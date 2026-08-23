import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadAiConfig } from "../_shared/ai/config.ts";
import { AiError } from "../_shared/ai/errors.ts";
import { GeminiProvider } from "../_shared/ai/geminiProvider.ts";
import { buildContentClassificationInput, CONTENT_CLASSIFICATION_SYSTEM } from "../_shared/ai/prompts.ts";
import { sanitizePublicAiInput } from "../_shared/ai/sanitizer.ts";
import { parseContentEnrichment } from "../_shared/ai/schemas.ts";
import { recordAiUsage } from "../_shared/ai/usage.ts";

type EnrichmentItemType = "post" | "video" | "profile" | "community" | "event";

type EnrichmentJob = {
  id: string;
  item_type: EnrichmentItemType;
  item_id: string;
  content_hash: string;
  attempt_count: number;
};

type SourceRow = {
  content_hash: string;
  safe_input: Record<string, unknown>;
  eligible: boolean;
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function boundedLimit(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return 5;
  return Math.max(1, Math.min(value, 10));
}

function safePublicSource(itemType: EnrichmentItemType, source: Record<string, unknown>) {
  const textParts = [source.name, source.text]
    .filter((value): value is string => typeof value === "string")
    .join("\n")
    .trim();
  return sanitizePublicAiInput({
    itemType,
    visibility: "public",
    text: textParts,
    city: typeof source.city === "string" ? source.city : null,
    country: typeof source.country === "string" ? source.country : null,
    extra: {
      category: source.category,
      topics: source.topics,
      explicit_interests: source.explicit_interests,
    },
  });
}

serve(async (request) => {
  if (request.method !== "POST") return response(405, { error: "Method not allowed" });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authorization = request.headers.get("Authorization") || "";
  if (!serviceRoleKey || authorization !== `Bearer ${serviceRoleKey}`) {
    return response(403, { error: "Service authorization required" });
  }

  const aiConfig = loadAiConfig((name) => Deno.env.get(name));
  if (!aiConfig.enabled) return response(503, { error: "AI enrichment is disabled" });
  if (!aiConfig.apiKey) return response(503, { error: "AI enrichment is not configured" });

  let requestBody: Record<string, unknown> = {};
  try {
    requestBody = await request.json();
  } catch {
    // Empty JSON body uses the bounded default.
  }

  const limit = boundedLimit(requestBody.limit);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const provider = new GeminiProvider(aiConfig.apiKey, aiConfig);

  const { data: jobs, error: claimError } = await supabase.rpc("claim_ai_enrichment_jobs", {
    p_limit: limit,
  });
  if (claimError) {
    console.error("AI enrichment claim failed");
    return response(500, { error: "Unable to claim enrichment work" });
  }

  const result = { claimed: (jobs || []).length, completed: 0, failed: 0, skipped: 0 };

  for (const job of (jobs || []) as EnrichmentJob[]) {
    try {
      const { data: sourceRows, error: sourceError } = await supabase.rpc(
        "get_recommendation_item_source",
        { p_item_type: job.item_type, p_item_id: job.item_id },
      );
      if (sourceError) throw new AiError("AI_PROVIDER_ERROR", "Unable to load public content.", true);
      const source = (Array.isArray(sourceRows) ? sourceRows[0] : sourceRows) as SourceRow | undefined;
      if (!source?.eligible || source.content_hash !== job.content_hash) {
        await supabase.from("ai_enrichment_jobs").update({
          status: "skipped",
          last_error_code: source?.content_hash !== job.content_hash ? "CONTENT_CHANGED" : "NOT_ELIGIBLE",
          updated_at: new Date().toISOString(),
        }).eq("id", job.id);
        result.skipped += 1;
        continue;
      }

      const sanitized = safePublicSource(job.item_type, source.safe_input);
      const classificationResult = await provider.generateStructured({
        task: "public_content_classification",
        systemInstruction: CONTENT_CLASSIFICATION_SYSTEM,
        input: buildContentClassificationInput(sanitized),
        temperature: 0.1,
        maxOutputTokens: 900,
      });
      const enrichment = parseContentEnrichment(classificationResult.value);
      await recordAiUsage(supabase, provider, {
        model: classificationResult.model,
        task: "public_content_classification",
        success: true,
        inputUnits: classificationResult.inputUnits,
        outputUnits: classificationResult.outputUnits,
      });

      const embeddingInput = JSON.stringify({
        text: sanitized.text,
        topics: enrichment.topics.map((topic) => topic.topic),
        content_type: enrichment.content_type,
      });
      const embeddingResult = await provider.embed(embeddingInput, "RETRIEVAL_DOCUMENT");
      await recordAiUsage(supabase, provider, {
        model: embeddingResult.model,
        task: "public_content_embedding",
        success: true,
        inputUnits: embeddingResult.inputUnits,
      });

      const { error: metadataError } = await supabase.from("recommendation_item_metadata").upsert({
        item_type: job.item_type,
        item_id: job.item_id,
        content_hash: job.content_hash,
        topics: enrichment.topics,
        language: enrichment.language,
        location_scope: enrichment.location_scope,
        quality_features: {
          ...enrichment.quality_hints,
          content_type: enrichment.content_type,
          safety_flags: enrichment.safety_flags,
        },
        embedding: `[${embeddingResult.values.join(",")}]`,
        embedding_model: embeddingResult.model,
        classification_model: classificationResult.model,
        metadata_version: "content_metadata_v1",
        enrichment_status: "completed",
        last_enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "item_type,item_id" });
      if (metadataError) throw new AiError("AI_PROVIDER_ERROR", "Unable to save enrichment.", true);

      await supabase.from("ai_enrichment_jobs").update({
        status: "completed",
        last_error_code: null,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      result.completed += 1;
    } catch (error) {
      const errorCode = error instanceof AiError ? error.code : "UNEXPECTED_ERROR";
      console.error("AI enrichment job failed", errorCode);
      const delayMinutes = Math.min(60, 2 ** Math.max(1, job.attempt_count));
      await supabase.from("ai_enrichment_jobs").update({
        status: "failed",
        last_error_code: errorCode.slice(0, 120),
        next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      await recordAiUsage(supabase, provider, {
        model: provider.generativeModel,
        task: "public_content_enrichment",
        success: false,
      });
      result.failed += 1;
    }
  }

  return response(200, result);
});

