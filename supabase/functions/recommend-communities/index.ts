import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { explorationBoost } from "../_shared/recommendation/exploration.ts";
import { rankCommunity } from "../_shared/recommendation/rankers/communities.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const normalize = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const haversineKm = (a: number, b: number, c: number, d: number) => { const r = (v: number) => v * Math.PI / 180; const x = r(c - a); const y = r(d - b); const q = Math.sin(x / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(y / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); };
const overlap = (left: string[], right: string[]) => { if (!left.length || !right.length) return 0; const set = new Set(right.map(normalize)); return clamp(left.filter((value) => set.has(normalize(value))).length / Math.min(3, left.length)); };
const countBy = (rows: any[], key: string) => { const map = new Map<string, number>(); for (const row of rows) map.set(row[key], (map.get(row[key]) || 0) + 1); return map; };

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { error: "Authentication required" });
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json(401, { error: "Authentication required" });
  const userId = authData.user.id;
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: Record<string, unknown> = {}; try { body = await request.json(); } catch { /* defaults */ }
  const limit = typeof body.limit === "number" ? Math.max(1, Math.min(30, Math.floor(body.limit))) : 20;
  const [profileResult, preferencesResult, interestsResult, affinitiesResult, membershipsResult, connectionsResult, communitiesResult] = await Promise.all([
    service.from("profiles").select("location_city, location_country, latitude, longitude, max_distance_km").eq("user_id", userId).maybeSingle(),
    service.from("user_preferences").select("personalization_enabled, exploration_enabled").eq("user_id", userId).maybeSingle(),
    service.from("user_interests").select("interest_name").eq("user_id", userId),
    service.from("user_topic_affinities").select("topic, score").eq("user_id", userId).eq("source", "learned"),
    service.from("community_members").select("community_id, status").eq("user_id", userId),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
    service.from("communities").select("id, community_name, description, category, profile_image_url, location_city, location_country, latitude, longitude, member_count, community_type, visibility, delivery_mode, is_active, updated_at").eq("is_active", true).limit(150),
  ]);
  const profile: any = profileResult.data || {};
  const preferences: any = preferencesResult.data || {};
  const personalization = preferences.personalization_enabled !== false;
  const explicit = personalization ? (interestsResult.data || []).map((row) => row.interest_name) : [];
  const learned = personalization ? (affinitiesResult.data || []).filter((row) => row.score > 0).map((row) => row.topic) : [];
  const membershipStatus = new Map((membershipsResult.data || []).map((row) => [row.community_id, row.status]));
  const connected = new Set<string>(); for (const row of connectionsResult.data || []) if (["active", "accepted"].includes(row.status)) connected.add(row.user_id_1 === userId ? row.user_id_2 : row.user_id_1);
  const eligible = (communitiesResult.data || []).filter((community) => membershipStatus.get(community.id) !== "banned" && (!["private", "hidden"].includes(community.visibility || community.community_type) || membershipStatus.get(community.id) === "active"));
  const ids = eligible.map((community) => community.id);
  if (!ids.length) return json(200, { items: [], algorithm_version: "communities_local_v1" });
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [membersResult, postsResult, messagesResult, metadataResult, semanticResult] = await Promise.all([
    service.from("community_members").select("community_id, user_id").in("community_id", ids).eq("status", "active"),
    service.from("posts").select("community_id").in("community_id", ids).gte("created_at", monthAgo),
    service.from("community_messages").select("community_id").in("community_id", ids).is("deleted_at", null).gte("created_at", monthAgo),
    service.from("recommendation_item_metadata").select("item_id, topics, quality_features").eq("item_type", "community").in("item_id", ids),
    userClient.rpc("get_semantic_recommendation_scores", { p_item_type: "community", p_item_ids: ids }),
  ]);
  const memberCounts = countBy(membersResult.data || [], "community_id"); const postCounts = countBy(postsResult.data || [], "community_id"); const messageCounts = countBy(messagesResult.data || [], "community_id");
  const connectionOverlap = new Map<string, number>(); for (const row of membersResult.data || []) if (connected.has(row.user_id)) connectionOverlap.set(row.community_id, (connectionOverlap.get(row.community_id) || 0) + 1);
  const metadata = new Map((metadataResult.data || []).map((row) => [row.item_id, row])); const semantic = new Map((semanticResult.data || []).map((row: any) => [row.item_id, clamp(Number(row.semantic_score || 0))]));
  const ranked = eligible.map((community) => {
    const mode = ["online", "hybrid"].includes(community.delivery_mode) ? community.delivery_mode : "local";
    const meta: any = metadata.get(community.id); const topics = [community.category, ...(Array.isArray(meta?.topics) ? meta.topics.map((topic: any) => typeof topic === "string" ? topic : topic.topic) : [])].filter(Boolean);
    const taxonomy = overlap(explicit, topics); const interestRelevance = semantic.has(community.id) ? taxonomy * 0.8 + semantic.get(community.id)! * 0.2 : taxonomy;
    const sameCity = normalize(profile.location_city) && normalize(profile.location_city) === normalize(community.location_city); const sameCountry = normalize(profile.location_country) && normalize(profile.location_country) === normalize(community.location_country);
    let distanceKm: number | null = null; if ([profile.latitude, profile.longitude, community.latitude, community.longitude].every((value) => value != null)) distanceKm = haversineKm(Number(profile.latitude), Number(profile.longitude), Number(community.latitude), Number(community.longitude));
    const geographicRelevance = mode === "online" ? 0 : sameCity ? 1 : distanceKm != null && distanceKm <= Number(profile.max_distance_km || 100) ? 0.8 : sameCountry ? 0.5 : 0;
    const activity = clamp(0.35 + ((postCounts.get(community.id) || 0) * 2 + (messageCounts.get(community.id) || 0) * 0.2) / Math.max(20, memberCounts.get(community.id) || community.member_count || 1));
    const quality = clamp(0.45 + activity * 0.4); const topicValueFit = Math.max(overlap(learned, topics), taxonomy * 0.7);
    const rankedCommunity = rankCommunity({ id: community.id, mode, interestRelevance, geographicRelevance, connectionOverlap: clamp((connectionOverlap.get(community.id) || 0) / 3), topicValueFit, communityActivity: activity, quality, exploration: explorationBoost(`${userId}:${community.id}:${new Date().toISOString().slice(0, 10)}`, preferences.exploration_enabled !== false) });
    return { community, rankedCommunity, distanceKm, overlapCount: connectionOverlap.get(community.id) || 0 };
  }).sort((a, b) => b.rankedCommunity.score - a.rankedCommunity.score).slice(0, limit);
  return json(200, { items: ranked.map(({ community, rankedCommunity, distanceKm, overlapCount }, index) => ({ id: community.id, name: community.community_name, category: community.category || "Community", description: community.description || "", imageUrl: community.profile_image_url || null, membersCount: community.member_count || 0, distance: rankedCommunity.mode === "online" ? "Online" : distanceKm != null ? `${Math.max(1, Math.round(distanceKm))} km away` : community.location_city || "Local", location: community.location_city || community.location_country || "Online", mode: rankedCommunity.mode, isJoined: membershipStatus.get(community.id) === "active", mutualConnections: overlapCount, score: Math.round(rankedCommunity.score * 100), reasonCodes: rankedCommunity.reasonCodes, rankPosition: index + 1, algorithmVersion: rankedCommunity.algorithmVersion })), algorithm_version: "communities_local_v1" });
});
