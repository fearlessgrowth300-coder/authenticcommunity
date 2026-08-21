import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-signature",
};

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
};

async function signPayload(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("VERIFICATION_WEBHOOK_SECRET");

    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Webhook secret is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const genericSignature = req.headers.get("x-signature")?.replace(/^sha256=/, "").toLowerCase();
    const stripeHeader = req.headers.get("stripe-signature");
    let validSignature = false;
    if (genericSignature) {
      validSignature = safeEqual(await signPayload(webhookSecret, rawBody), genericSignature);
    } else if (stripeHeader) {
      const parts = Object.fromEntries(stripeHeader.split(",").map((part) => part.split("=", 2)));
      const timestamp = Number(parts.t);
      if (timestamp && Math.abs(Date.now() / 1000 - timestamp) <= 300 && parts.v1) {
        validSignature = safeEqual(await signPayload(webhookSecret, `${parts.t}.${rawBody}`), parts.v1.toLowerCase());
      }
    }
    if (!validSignature) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody || "{}");
    const providerReference = payload.providerReference || payload?.data?.object?.id;
    const outcome = payload.outcome || payload?.data?.object?.status;

    if (!providerReference) {
      return new Response(JSON.stringify({ error: "Invalid payload: missing provider reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch current verification record
    const query = supabaseAdmin.from("identity_verifications").select("*").eq("provider_reference", providerReference);

    const { data: record, error: findError } = await query.maybeSingle();
    if (findError || !record) {
      return new Response(JSON.stringify({ error: "Verification record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. IDEMPOTENCY CHECK:
    // If the record is already verified or in final state, avoid duplicate state mutations
    if (record.status === "verified" && record.identity_verified) {
      return new Response(
        JSON.stringify({ handled: true, message: "Webhook already processed (idempotent)." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUserId = record.user_id;

    // 3. Process outcome
    if (outcome === "verified" || outcome === "approved") {
      // In production mode, reject mock provider attempts to grant verified status
      if (record.provider === "mock") {
        await supabaseAdmin
          .from("identity_verifications")
          .update({
            status: "failed",
            failure_code: "provider_unavailable",
            failure_reason: "Mock provider cannot grant verification in production.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.id);

        return new Response(
          JSON.stringify({ handled: false, error: "Mock provider rejected in production" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verifiedAt = new Date().toISOString();

      // Update identity_verifications record
      await supabaseAdmin
        .from("identity_verifications")
        .update({
          status: "verified",
          identity_verified: true,
          liveness_verified: true,
          face_match_verified: true,
          failure_code: null,
          failure_reason: null,
          verified_at: verifiedAt,
          updated_at: verifiedAt,
        })
        .eq("id", record.id);

      // Privileged update to public.profiles.is_verified
      await supabaseAdmin
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: verifiedAt,
        })
        .eq("user_id", targetUserId);

      // Send in-app notification
      await supabaseAdmin.from("notifications").insert({
        user_id: targetUserId,
        type: "verification_approved",
        title: "Identity Verified",
        message: "Your identity has been successfully verified with your government ID.",
      });

      return new Response(
        JSON.stringify({ handled: true, status: "verified", userId: targetUserId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Failure / requires action / manual review
      const failureCode = payload.failureCode || (outcome === "requires_action" ? "unclear_document" : "failed_face_match");
      const failureReason = payload.failureReason || "Identity verification could not be completed.";
      const nextStatus = outcome === "manual_review" ? "manual_review" : outcome === "requires_action" ? "requires_action" : "failed";

      await supabaseAdmin
        .from("identity_verifications")
        .update({
          status: nextStatus,
          identity_verified: false,
          liveness_verified: outcome === "failed_face_match" ? true : false,
          face_match_verified: false,
          failure_code: failureCode,
          failure_reason: failureReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      await supabaseAdmin.from("notifications").insert({
        user_id: targetUserId,
        type: "verification_failed",
        title: "Verification Update",
        message: failureReason,
      });

      return new Response(
        JSON.stringify({ handled: true, status: nextStatus, userId: targetUserId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Webhook error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
