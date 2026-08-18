import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Authenticate user from JWT
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const documentCountry = body.documentCountry || "US";
    const documentType = body.documentType || "drivers_license";

    // 2. Initialize Service Role client for privileged DB writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Check existing verification status
    const { data: existing } = await supabaseAdmin
      .from("identity_verifications")
      .select("id, status, identity_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "verified" && existing?.identity_verified) {
      return new Response(
        JSON.stringify({
          status: "verified",
          message: "Identity is already verified.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create session with active provider
    const providerName = Deno.env.get("VERIFICATION_PROVIDER") || "mock";
    const providerReference = `vs_${providerName}_${Date.now()}`;
    const clientSecret = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 5. Upsert session record in identity_verifications
    const { error: upsertError } = await supabaseAdmin
      .from("identity_verifications")
      .upsert(
        {
          user_id: user.id,
          provider: providerName,
          provider_reference: providerReference,
          document_country: documentCountry,
          document_type: documentType,
          status: "pending",
          identity_verified: false,
          liveness_verified: false,
          face_match_verified: false,
          client_secret: clientSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        provider: providerName,
        providerReference,
        clientSecret,
        status: "pending",
        url: `https://verify.authenticcommunity.dev/session/${providerReference}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to initialize verification session" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
