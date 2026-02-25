import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current user's interests and values
    const [myInterests, myValues, myProfile] = await Promise.all([
      supabase.from("user_interests").select("interest_name, interest_category").eq("user_id", user.id),
      supabase.from("user_values").select("value_name").eq("user_id", user.id),
      supabase.from("profiles").select("first_name, location_city, bio").eq("user_id", user.id).maybeSingle(),
    ]);

    // Get other users' profiles with their interests and values
    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, bio, location_city, age")
      .neq("user_id", user.id)
      .eq("is_active", true)
      .limit(20);

    if (!otherProfiles || otherProfiles.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otherIds = otherProfiles.map((p) => p.user_id);
    const [otherInterests, otherValues] = await Promise.all([
      supabase.from("user_interests").select("user_id, interest_name").in("user_id", otherIds),
      supabase.from("user_values").select("user_id, value_name").in("user_id", otherIds),
    ]);

    const interestsMap: Record<string, string[]> = {};
    otherInterests.data?.forEach((i) => {
      if (!interestsMap[i.user_id]) interestsMap[i.user_id] = [];
      interestsMap[i.user_id].push(i.interest_name);
    });

    const valuesMap: Record<string, string[]> = {};
    otherValues.data?.forEach((v) => {
      if (!valuesMap[v.user_id]) valuesMap[v.user_id] = [];
      valuesMap[v.user_id].push(v.value_name);
    });

    const profileSummaries = otherProfiles.map((p) => ({
      user_id: p.user_id,
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      bio: p.bio || "",
      city: p.location_city || "",
      interests: interestsMap[p.user_id] || [],
      values: valuesMap[p.user_id] || [],
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a match-making AI. Given a user's profile and a list of other users, rank them by compatibility and explain why.

Current user:
- Name: ${myProfile.data?.first_name || "User"}
- City: ${myProfile.data?.location_city || "Unknown"}
- Bio: ${myProfile.data?.bio || "No bio"}
- Interests: ${myInterests.data?.map((i) => i.interest_name).join(", ") || "None"}
- Values: ${myValues.data?.map((v) => v.value_name).join(", ") || "None"}

Other users:
${profileSummaries.map((p, i) => `${i + 1}. ${p.name} (ID: ${p.user_id}) - City: ${p.city}, Interests: [${p.interests.join(", ")}], Values: [${p.values.join(", ")}], Bio: "${p.bio}"`).join("\n")}

Return the top 5 most compatible matches.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a compatibility matching AI. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return ranked match suggestions",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: { type: "string" },
                        score: { type: "number", description: "Compatibility score 0-100" },
                        reason: { type: "string", description: "Brief reason for match, 1-2 sentences" },
                      },
                      required: ["user_id", "score", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_matches" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let matches = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        matches = parsed.matches || [];
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    // Enrich matches with profile data
    const enriched = matches.map((m: any) => {
      const profile = profileSummaries.find((p) => p.user_id === m.user_id);
      return {
        ...m,
        name: profile?.name || "User",
        interests: profile?.interests || [],
        city: profile?.city || "",
      };
    });

    return new Response(JSON.stringify({ suggestions: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
