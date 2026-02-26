import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    // Get current user's profile, interests, and values
    const [myInterests, myValues, myProfile] = await Promise.all([
      supabase.from("user_interests").select("interest_name, interest_category").eq("user_id", user.id),
      supabase.from("user_values").select("value_name").eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("first_name, last_name, bio, location_city, location_country, location_state, latitude, longitude, age, target_countries, min_age, max_age, max_distance_km, looking_for")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const me = myProfile.data;
    const myTargetCountries = me?.target_countries && me.target_countries.length > 0
      ? me.target_countries
      : me?.location_country
        ? [me.location_country]
        : null;
    const minAge = me?.min_age ?? 18;
    const maxAge = me?.max_age ?? 80;
    const maxDistKm = me?.max_distance_km ?? 500;

    // Build query with location & age filters
    let query = supabase
      .from("profiles")
      .select("user_id, first_name, last_name, bio, location_city, location_country, location_state, latitude, longitude, age, looking_for")
      .neq("user_id", user.id)
      .eq("is_active", true);

    // Filter by target countries
    if (myTargetCountries && myTargetCountries.length > 0) {
      query = query.in("location_country", myTargetCountries);
    }

    // Filter by age range
    query = query.gte("age", minAge).lte("age", maxAge);

    const { data: otherProfiles } = await query.limit(50);

    if (!otherProfiles || otherProfiles.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter by distance if coordinates are available
    let filtered = otherProfiles;
    if (me?.latitude && me?.longitude) {
      filtered = otherProfiles.filter((p) => {
        if (!p.latitude || !p.longitude) return true; // include users without coords
        const dist = haversineKm(me.latitude!, me.longitude!, p.latitude, p.longitude);
        return dist <= maxDistKm;
      });

      // Attach distance to each profile
      filtered = filtered.map((p) => ({
        ...p,
        distance_km: p.latitude && p.longitude
          ? Math.round(haversineKm(me.latitude!, me.longitude!, p.latitude, p.longitude))
          : null,
      }));
    }

    if (filtered.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otherIds = filtered.map((p) => p.user_id);
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

    const profileSummaries = filtered.map((p: any) => ({
      user_id: p.user_id,
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      bio: p.bio || "",
      city: p.location_city || "",
      country: p.location_country || "",
      age: p.age,
      looking_for: p.looking_for || "",
      distance_km: p.distance_km ?? null,
      interests: interestsMap[p.user_id] || [],
      values: valuesMap[p.user_id] || [],
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a match-making AI for a community app. Given a user's profile and a list of candidates, rank them by compatibility.

Current user:
- Name: ${me?.first_name || "User"}
- Age: ${me?.age || "Unknown"}
- City: ${me?.location_city || "Unknown"}, Country: ${me?.location_country || "Unknown"}
- Looking for: ${me?.looking_for || "Any"}
- Bio: ${me?.bio || "No bio"}
- Interests: ${myInterests.data?.map((i) => i.interest_name).join(", ") || "None"}
- Values: ${myValues.data?.map((v) => v.value_name).join(", ") || "None"}

Candidates:
${profileSummaries.map((p, i) => `${i + 1}. ${p.name} (ID: ${p.user_id}) - Age: ${p.age}, City: ${p.city}, Country: ${p.country}, Distance: ${p.distance_km !== null ? p.distance_km + "km" : "unknown"}, Looking for: ${p.looking_for}, Interests: [${p.interests.join(", ")}], Values: [${p.values.join(", ")}], Bio: "${p.bio}"`).join("\n")}

Consider shared interests, values, location proximity, age compatibility, and what each person is looking for. Return the top 5 most compatible matches with a conversation starter for each.`;

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
                        conversation_starter: { type: "string", description: "A suggested conversation opener" },
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
        country: profile?.country || "",
        distance_km: profile?.distance_km ?? null,
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
