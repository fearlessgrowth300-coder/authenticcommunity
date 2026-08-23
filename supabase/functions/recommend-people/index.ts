import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadAiConfig } from "../_shared/ai/config.ts";
import { AiError } from "../_shared/ai/errors.ts";
import { GeminiProvider } from "../_shared/ai/geminiProvider.ts";
import { recordAiUsage } from "../_shared/ai/usage.ts";
import { rankPerson, type PeopleCandidate } from "../_shared/recommendation/rankers/people.ts";
import { ALGORITHM_VERSIONS } from "../_shared/recommendation/versioning.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const AI_SECRET_MESSAGE = "GEMINI_API_KEY must be configured in Supabase Edge Function Secrets.";
const clusters = [
  ["startups", "entrepreneurship", "business", "saas", "freelancing", "e-commerce", "marketing", "sales"],
  ["programming", "software", "coding", "ai", "technology", "design"],
  ["fitness", "gym", "running", "hiking", "yoga", "cycling", "nutrition"],
  ["meditation", "mindfulness", "mental health", "wellness"],
  ["photography", "art", "film", "writing", "music", "creativity"],
  ["books", "reading", "learning", "languages"],
];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function normalize(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
function clamp(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function semanticTaxonomyOverlap(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const normalizedRight = right.map(normalize);
  let total = 0;
  for (const raw of left) {
    const value = normalize(raw);
    if (normalizedRight.includes(value)) total += 1;
    else if (clusters.some((cluster) => cluster.includes(value) && normalizedRight.some((other) => cluster.includes(other)))) total += 0.65;
  }
  return clamp(total / Math.max(1, Math.min(left.length, right.length)));
}
function importance(value: unknown) {
  const normalized = normalize(value);
  return normalized === "core" || normalized === "essential" ? 2 : normalized === "important" ? 1.5 : 1;
}
function weightedValuesMine(mine: any[], theirs: any[]) {
  if (!mine.length || !theirs.length) return { score: 0, shared: [] as string[] };
  const theirMap = new Map(theirs.map((row) => [normalize(row.value_name), row]));
  const shared = mine.filter((row) => theirMap.has(normalize(row.value_name)));
  const matched = shared.reduce((sum, row) => sum + importance(row.importance_level) * importance(theirMap.get(normalize(row.value_name))?.importance_level), 0);
  const possible = mine.slice().sort((a, b) => importance(b.importance_level) - importance(a.importance_level))
    .slice(0, Math.max(1, Math.min(mine.length, theirs.length)))
    .reduce((sum, row) => sum + importance(row.importance_level) * 2, 0);
  return { score: clamp(matched / Math.max(1, possible)), shared: shared.map((row) => row.value_name) };
}
function feedbackScore(rows: any[]) {
  if (!rows.length) return 0.4;
  const weights: Record<string, number> = {
    viewed: 0.05, profile_open: 0.1, liked: 0.15, saved: 0.3, followed: 0.45,
    connected: 0.8, connection_requested: 0.55, connection_accepted: 1,
    conversation_started: 1, message_sent: 0.65, message_replied: 0.8,
    repeat_interaction: 1, passed: -1, not_interested: -1,
  };
  return clamp(0.4 + rows.reduce((sum, row) => sum + (weights[row.signal] || 0), 0) / 4);
}
function deterministicReasons(input: { sharedValues: string[]; sharedInterests: string[]; sameCity: boolean; city?: string; sharedCommunityCount: number; goalsMatch: boolean }) {
  const reasons: string[] = [];
  if (input.sharedValues.length) reasons.push(`You both value ${input.sharedValues.slice(0, 2).join(" and ")}`);
  if (input.sharedInterests.length) reasons.push(`Shared interests in ${input.sharedInterests.slice(0, 2).join(" and ")}`);
  if (input.sameCity && input.city) reasons.push(`You are both based around ${input.city}`);
  if (input.sharedCommunityCount) reasons.push(`You share ${input.sharedCommunityCount} ${input.sharedCommunityCount === 1 ? "community" : "communities"}`);
  if (input.goalsMatch) reasons.push("You are looking for a similar kind of connection");
  return reasons.slice(0, 4);
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { error: "Authentication required" });
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json(401, { error: "Authentication required" });
  const currentUserId = authData.user.id;
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const requestedCandidate = typeof body.candidate_id === "string" ? body.candidate_id : null;
  const limit = typeof body.limit === "number" && Number.isInteger(body.limit) ? Math.max(1, Math.min(body.limit, 30)) : 20;

  const [myProfileResult, preferencesResult, myInterestsResult, myValuesResult, mySocialResult,
    profilesResult, blocksResult, connectionsResult, feedbackResult, myMembershipsResult] = await Promise.all([
    service.from("profiles").select("id, user_id, age, location_city, location_country, latitude, longitude, looking_for, target_countries, min_age, max_age, max_distance_km").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_preferences").select("discovery_area, recommendation_reset_at, personalization_enabled").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_interests").select("interest_name").eq("user_id", currentUserId),
    service.from("user_values").select("value_name, importance_level").eq("user_id", currentUserId),
    service.from("user_social_preferences").select("preferred_group_size, meetup_frequency, connection_style").eq("user_id", currentUserId).maybeSingle(),
    service.from("profiles").select("id, user_id, first_name, last_name, age, bio, profile_image_url, location_city, location_country, latitude, longitude, looking_for, min_age, max_age, profile_visibility, is_verified, is_active, account_status, updated_at").neq("user_id", currentUserId).limit(200),
    service.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
    service.from("recommendation_feedback").select("candidate_id, signal, created_at").eq("user_id", currentUserId),
    service.from("community_members").select("community_id").eq("user_id", currentUserId).eq("status", "active"),
  ]);
  const me = myProfileResult.data;
  if (!me) return json(409, { error: "Complete your profile before discovering people" });
  const preferences = preferencesResult.data || {};
  const resetAt = preferences.recommendation_reset_at ? new Date(preferences.recommendation_reset_at).getTime() : 0;
  const blockedIds = new Set<string>();
  for (const row of blocksResult.data || []) blockedIds.add(row.blocker_id === currentUserId ? row.blocked_id : row.blocker_id);
  const connectedIds = new Set<string>();
  for (const row of connectionsResult.data || []) connectedIds.add(row.user_id_1 === currentUserId ? row.user_id_2 : row.user_id_1);
  const feedbackMap = new Map<string, any[]>();
  for (const row of feedbackResult.data || []) {
    if (resetAt && new Date(row.created_at).getTime() < resetAt) continue;
    feedbackMap.set(row.candidate_id, [...(feedbackMap.get(row.candidate_id) || []), row]);
  }
  const passedIds = new Set([...feedbackMap.entries()].filter(([, rows]) => rows.some((row) => ["passed", "not_interested"].includes(row.signal))).map(([id]) => id));
  const discoveryArea = preferences.discovery_area || "nearby";
  const targetCountries = Array.isArray(me.target_countries) && me.target_countries.length ? me.target_countries.map(normalize) : me.location_country ? [normalize(me.location_country)] : [];
  const myAge = Number(me.age || 0);
  const eligible = (profilesResult.data || []).filter((profile) => {
    if (requestedCandidate && profile.user_id !== requestedCandidate) return false;
    if (blockedIds.has(profile.user_id) || connectedIds.has(profile.user_id) || passedIds.has(profile.user_id)) return false;
    if (profile.is_active === false || (profile.account_status || "active") !== "active" || profile.profile_visibility === "connections") return false;
    const age = Number(profile.age || 0);
    if (age && (age < Number(me.min_age || 18) || age > Number(me.max_age || 80))) return false;
    if (myAge && (myAge < Number(profile.min_age || 18) || myAge > Number(profile.max_age || 80))) return false;
    if (discoveryArea === "country" && me.location_country && normalize(profile.location_country) !== normalize(me.location_country)) return false;
    if (discoveryArea === "nearby" && targetCountries.length && !targetCountries.includes(normalize(profile.location_country))) return false;
    if (discoveryArea === "nearby" && me.latitude != null && me.longitude != null && profile.latitude != null && profile.longitude != null) {
      return haversineKm(Number(me.latitude), Number(me.longitude), Number(profile.latitude), Number(profile.longitude)) <= Number(me.max_distance_km || 100);
    }
    return true;
  });
  if (!eligible.length) return json(200, { items: [], algorithm_version: ALGORITHM_VERSIONS.people });

  const candidateUserIds = eligible.map((profile) => profile.user_id);
  const candidateProfileIds = eligible.map((profile) => profile.id);
  const [candidateInterestsResult, candidateValuesResult, candidateSocialResult, candidateMembershipsResult, semanticResult] = await Promise.all([
    service.from("user_interests").select("user_id, interest_name").in("user_id", candidateUserIds),
    service.from("user_values").select("user_id, value_name, importance_level").in("user_id", candidateUserIds),
    service.from("user_social_preferences").select("user_id, preferred_group_size, meetup_frequency, connection_style").in("user_id", candidateUserIds),
    service.from("community_members").select("user_id, community_id").in("user_id", candidateUserIds).eq("status", "active"),
    userClient.rpc("get_semantic_recommendation_scores", { p_item_type: "profile", p_item_ids: candidateProfileIds }),
  ]);
  const interestMap = new Map<string, string[]>();
  for (const row of candidateInterestsResult.data || []) interestMap.set(row.user_id, [...(interestMap.get(row.user_id) || []), row.interest_name]);
  const valueMap = new Map<string, any[]>();
  for (const row of candidateValuesResult.data || []) valueMap.set(row.user_id, [...(valueMap.get(row.user_id) || []), row]);
  const socialMap = new Map((candidateSocialResult.data || []).map((row) => [row.user_id, row]));
  const myCommunities = new Set((myMembershipsResult.data || []).map((row) => row.community_id));
  const candidateCommunityMap = new Map<string, string[]>();
  for (const row of candidateMembershipsResult.data || []) {
    if (myCommunities.has(row.community_id)) candidateCommunityMap.set(row.user_id, [...(candidateCommunityMap.get(row.user_id) || []), row.community_id]);
  }
  const semanticByProfile = new Map((semanticResult.data || []).map((row: any) => [row.item_id, clamp(Number(row.semantic_score || 0))]));
  const myInterests = (myInterestsResult.data || []).map((row) => row.interest_name);
  const myValues = myValuesResult.data || [];

  const ranked = eligible.map((profile) => {
    const theirInterests = interestMap.get(profile.user_id) || [];
    const theirValues = valueMap.get(profile.user_id) || [];
    const values = weightedValuesMine(myValues, theirValues);
    const sharedInterests = myInterests.filter((value) => theirInterests.some((other) => normalize(other) === normalize(value)));
    const taxonomy = semanticTaxonomyOverlap(myInterests, theirInterests);
    const semantic = semanticByProfile.get(profile.id);
    const interestCompatibility = semantic == null ? taxonomy : taxonomy * 0.8 + semantic * 0.2;
    const theirSocial: any = socialMap.get(profile.user_id) || {};
    const goalsMatch = Boolean(me.looking_for && profile.looking_for && normalize(me.looking_for) === normalize(profile.looking_for));
    const stylesMatch = Boolean(mySocialResult.data?.connection_style && theirSocial.connection_style && mySocialResult.data.connection_style === theirSocial.connection_style);
    const socialCompatibility = goalsMatch && stylesMatch ? 1 : goalsMatch || stylesMatch ? 0.8 : mySocialResult.data?.connection_style && theirSocial.connection_style ? 0.3 : 0.65;
    const activityAvailability = mySocialResult.data?.meetup_frequency && theirSocial.meetup_frequency
      ? mySocialResult.data.meetup_frequency === theirSocial.meetup_frequency ? 1 : 0.25
      : 0.6;
    const sharedCommunities = candidateCommunityMap.get(profile.user_id) || [];
    const sameCity = Boolean(me.location_city && profile.location_city && normalize(me.location_city) === normalize(profile.location_city));
    const sameCountry = Boolean(me.location_country && profile.location_country && normalize(me.location_country) === normalize(profile.location_country));
    let distanceKm: number | null = null;
    if (me.latitude != null && me.longitude != null && profile.latitude != null && profile.longitude != null) {
      distanceKm = haversineKm(Number(me.latitude), Number(me.longitude), Number(profile.latitude), Number(profile.longitude));
    }
    const geographicCompatibility = sameCity ? 1 : distanceKm != null && distanceKm <= Number(me.max_distance_km || 100) ? 0.8 : sameCountry ? 0.6 : 0.2;
    const candidate: PeopleCandidate = {
      id: profile.user_id,
      valuesCompatibility: values.score,
      interestCompatibility,
      socialCompatibility,
      sharedCommunitySignals: clamp(sharedCommunities.length / 2),
      geographicCompatibility,
      activityAvailability,
      trustAccountQuality: profile.is_verified ? 0.75 : 0.45,
      recommendationFeedback: feedbackScore(feedbackMap.get(profile.user_id) || []),
      sharedValues: values.shared,
      sharedInterests,
    };
    const scored = rankPerson(candidate);
    const reasons = deterministicReasons({ sharedValues: values.shared, sharedInterests, sameCity, city: me.location_city, sharedCommunityCount: sharedCommunities.length, goalsMatch });
    return { profile, theirInterests, sharedCommunities, semantic, scored, reasons };
  }).sort((a, b) => b.scored.score - a.scored.score);

  const top = ranked.slice(0, limit);
  const cachedResult = await service.from("recommendation_scores")
    .select("candidate_id, ai_explanation, conversation_starters, generated_at, algorithm_version")
    .eq("user_id", currentUserId).in("candidate_id", top.map((entry) => entry.profile.user_id));
  const cached = new Map((cachedResult.data || []).map((row) => [row.candidate_id, row]));
  await service.from("recommendation_scores").upsert(top.map((entry) => ({
    user_id: currentUserId,
    candidate_id: entry.profile.user_id,
    overall_score: entry.scored.matchPercent,
    breakdown: {
      values: entry.scored.valuesCompatibility,
      interests: entry.scored.interestCompatibility,
      social: entry.scored.socialCompatibility,
      community: entry.scored.sharedCommunitySignals,
      geography: entry.scored.geographicCompatibility,
      activity: entry.scored.activityAvailability,
      trust: entry.scored.trustAccountQuality,
      feedback: entry.scored.recommendationFeedback,
    },
    reasons: entry.reasons,
    semantic_score: entry.semantic ?? null,
    algorithm_version: ALGORITHM_VERSIONS.people,
    updated_at: new Date().toISOString(),
  })), { onConflict: "user_id,candidate_id", ignoreDuplicates: false });

  let aiConfigurationMessage: string | null = null;
  const staleBefore = Date.now() - 7 * 86_400_000;
  const needsAi = top.slice(0, 5).filter((entry) => {
    const value = cached.get(entry.profile.user_id);
    return !value?.ai_explanation || value.algorithm_version !== ALGORITHM_VERSIONS.people || new Date(value.generated_at).getTime() < staleBefore;
  });
  if (needsAi.length) {
    const config = loadAiConfig((name) => Deno.env.get(name));
    const settingsResult = await service.from("admin_settings").select("setting_value").eq("setting_key", "ai").maybeSingle();
    const enabled = config.enabled && settingsResult.data?.setting_value?.enabled !== false;
    if (enabled && config.apiKey) {
      const provider = new GeminiProvider(config.apiKey, config);
      try {
        const result = await provider.generateStructured({
          task: "match_explanation",
          systemInstruction: "Use only supplied safe structured facts. Never infer sensitive traits, judge authenticity, set compatibility scores, or auto-send a message. Return JSON only.",
          input: JSON.stringify({
            required_shape: { matches: [{ candidate_id: "uuid", explanation: "grounded sentence", starters: ["friendly optional question"] }] },
            candidates: needsAi.map((entry) => ({
              candidate_id: entry.profile.user_id,
              shared_values: entry.scored.sharedValues.slice(0, 5),
              shared_interests: entry.scored.sharedInterests.slice(0, 5),
              same_general_area: entry.scored.geographicCompatibility >= 0.8,
              shared_community_count: entry.sharedCommunities.length,
              similar_connection_goal: entry.scored.socialCompatibility >= 0.8,
            })),
          }),
          temperature: 0.2,
          maxOutputTokens: 1200,
        });
        const rows = Array.isArray((result.value as any)?.matches) ? (result.value as any).matches : [];
        const allowedIds = new Set(needsAi.map((entry) => entry.profile.user_id));
        for (const raw of rows.slice(0, 5)) {
          if (!raw || !allowedIds.has(raw.candidate_id) || typeof raw.explanation !== "string") continue;
          const starters = Array.isArray(raw.starters) ? raw.starters.filter((value: unknown) => typeof value === "string").slice(0, 3).map((value: string) => value.slice(0, 240)) : [];
          await service.from("recommendation_scores").update({
            ai_explanation: raw.explanation.slice(0, 500), conversation_starters: starters,
            generated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          }).eq("user_id", currentUserId).eq("candidate_id", raw.candidate_id);
          cached.set(raw.candidate_id, { ...cached.get(raw.candidate_id), ai_explanation: raw.explanation.slice(0, 500), conversation_starters: starters, algorithm_version: ALGORITHM_VERSIONS.people, generated_at: new Date().toISOString() });
        }
        await recordAiUsage(service, provider, { model: result.model, task: "match_explanation", success: true, inputUnits: result.inputUnits, outputUnits: result.outputUnits });
      } catch (error) {
        console.error("recommend-people AI failure", error instanceof AiError ? error.code : "UNKNOWN");
        await recordAiUsage(service, provider, { model: provider.generativeModel, task: "match_explanation", success: false });
      }
    } else if (enabled && !config.apiKey) {
      aiConfigurationMessage = AI_SECRET_MESSAGE;
    }
  }

  return json(200, {
    algorithm_version: ALGORITHM_VERSIONS.people,
    ai_configuration_message: aiConfigurationMessage,
    items: top.map((entry, index) => {
      const cachedAi = cached.get(entry.profile.user_id);
      const distanceLabel = entry.scored.geographicCompatibility >= 1 ? "In your city" : entry.scored.geographicCompatibility >= 0.8 ? "Within your discovery radius" : entry.scored.geographicCompatibility >= 0.6 ? "In your country" : "Worldwide discovery";
      return {
        id: entry.profile.user_id,
        name: `${entry.profile.first_name || ""} ${entry.profile.last_name || ""}`.trim() || "Community Member",
        age: entry.profile.age || null,
        isVerified: Boolean(entry.profile.is_verified),
        location: entry.profile.location_city || "General area",
        distance: distanceLabel,
        matchScore: entry.scored.matchPercent,
        photoUrl: entry.profile.profile_image_url || null,
        bio: entry.profile.bio || "",
        sharedInterests: entry.scored.sharedInterests,
        sharedValues: entry.scored.sharedValues,
        sharedCommunityCount: entry.sharedCommunities.length,
        breakdown: {
          values: Math.round(entry.scored.valuesCompatibility * 30),
          interests: Math.round(entry.scored.interestCompatibility * 20),
          social: Math.round(entry.scored.socialCompatibility * 15),
          community: Math.round(entry.scored.sharedCommunitySignals * 10),
          geography: Math.round(entry.scored.geographicCompatibility * 10),
          activity: Math.round(entry.scored.activityAvailability * 5),
          trust: Math.round(entry.scored.trustAccountQuality * 5),
          feedback: Math.round(entry.scored.recommendationFeedback * 5),
        },
        reasons: entry.reasons,
        aiExplanation: cachedAi?.ai_explanation || null,
        conversationStarters: Array.isArray(cachedAi?.conversation_starters) ? cachedAi.conversation_starters : [],
        reasonCodes: entry.scored.reasonCodes,
        rankPosition: index + 1,
        algorithmVersion: ALGORITHM_VERSIONS.people,
      };
    }),
  });
});
