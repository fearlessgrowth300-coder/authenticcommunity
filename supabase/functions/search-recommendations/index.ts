import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadAiConfig } from "../_shared/ai/config.ts";
import { AiError } from "../_shared/ai/errors.ts";
import { GeminiProvider } from "../_shared/ai/geminiProvider.ts";
import { recordAiUsage } from "../_shared/ai/usage.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const AI_SECRET_MESSAGE = "GEMINI_API_KEY must be configured in Supabase Edge Function Secrets.";
const TYPES = ["people", "posts", "communities", "events", "videos", "topics"] as const;
type SearchType = typeof TYPES[number];
type Intent = { entityTypes: SearchType[]; topics: string[]; locationScope: "nearby" | "country" | "global"; timeScope: "any" | "today" | "this_week" | "this_weekend" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const normalize = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const unique = <T>(values: T[]) => [...new Set(values)];

function deterministicIntent(query: string): { intent: Intent; ambiguous: boolean } {
  const q = normalize(query); const entityTypes: SearchType[] = [];
  if (/\b(people|person|member|friend|founder|creator)\b/.test(q)) entityTypes.push("people");
  if (/\b(community|communities|group|hub|club)\b/.test(q)) entityTypes.push("communities");
  if (/\b(event|meetup|workshop|class|conference|today|weekend)\b/.test(q)) entityTypes.push("events");
  if (/\b(video|watch|clip)\b/.test(q)) entityTypes.push("videos");
  if (/\b(post|discussion|article)\b/.test(q)) entityTypes.push("posts");
  const locationScope = /\b(near|nearby|around me|local)\b/.test(q) ? "nearby" : /\b(country|nigeria|uk|united kingdom)\b/.test(q) ? "country" : "global";
  const timeScope = /\btoday\b/.test(q) ? "today" : /\bweekend\b/.test(q) ? "this_weekend" : /\bthis week\b/.test(q) ? "this_week" : "any";
  const stop = new Set(["find", "show", "me", "people", "person", "member", "community", "communities", "group", "hub", "event", "events", "meetup", "video", "videos", "post", "posts", "near", "nearby", "local", "this", "week", "weekend", "today"]);
  const topics = unique(q.split(/\s+/).map((word) => word.replace(/[^a-z0-9-]/g, "")).filter((word) => word.length > 2 && !stop.has(word))).slice(0, 8);
  const selected = entityTypes.length ? unique(entityTypes) : [...TYPES];
  return { intent: { entityTypes: selected, topics, locationScope, timeScope }, ambiguous: q.split(/\s+/).length >= 4 && entityTypes.length === 0 && timeScope === "any" && locationScope === "global" };
}

function validateIntent(value: any, fallback: Intent): Intent {
  const entityTypes = Array.isArray(value?.entity_types) ? unique(value.entity_types.filter((type: unknown) => TYPES.includes(type as SearchType))).slice(0, 6) : fallback.entityTypes;
  const topics = Array.isArray(value?.topics) ? value.topics.filter((topic: unknown) => typeof topic === "string").slice(0, 8).map((topic: string) => topic.slice(0, 80)) : fallback.topics;
  const locationScope = ["nearby", "country", "global"].includes(value?.location_scope) ? value.location_scope : fallback.locationScope;
  const timeScope = ["any", "today", "this_week", "this_weekend"].includes(value?.time_scope) ? value.time_scope : fallback.timeScope;
  return { entityTypes: entityTypes.length ? entityTypes : fallback.entityTypes, topics, locationScope, timeScope };
}

function textScore(query: string, fields: unknown[]) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean); const text = fields.map(normalize).join(" ");
  return tokens.length ? clamp(tokens.filter((token) => text.includes(token)).length / tokens.length) : 0;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization"); if (!authorization) return json(401, { error: "Authentication required" });
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(); if (authError || !authData.user) return json(401, { error: "Authentication required" });
  let body: Record<string, unknown> = {}; try { body = await request.json(); } catch { return json(400, { error: "Invalid search request" }); }
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 160) : ""; if (query.length < 2) return json(400, { error: "Search query is too short" });
  const requested = Array.isArray(body.types) ? body.types.filter((type): type is SearchType => TYPES.includes(type as SearchType)) : [];
  const limit = typeof body.limit === "number" ? Math.max(1, Math.min(20, Math.floor(body.limit))) : 10;
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const parsed = deterministicIntent(query); let intent = parsed.intent; if (requested.length) intent.entityTypes = unique(requested);
  const config = loadAiConfig((name) => Deno.env.get(name)); let aiConfigurationMessage: string | null = null; let provider: GeminiProvider | null = null;
  if (config.enabled && config.apiKey) provider = new GeminiProvider(config.apiKey, config); else if (config.enabled) aiConfigurationMessage = AI_SECRET_MESSAGE;
  if (provider && parsed.ambiguous && !requested.length) {
    const { data: allowed } = await service.rpc("consume_ai_action_quota", { p_user_id: authData.user.id, p_action: "search_intent", p_limit: 20, p_window_minutes: 60 });
    if (allowed) try {
      const result = await provider.generateStructured({ task: "search_intent", systemInstruction: "Classify search intent only. Never infer sensitive traits. Return JSON with entity_types, topics, location_scope and time_scope.", input: JSON.stringify({ query }), temperature: 0, maxOutputTokens: 300 });
      intent = validateIntent(result.value, intent); await recordAiUsage(service, provider, { model: result.model, task: "search_intent", success: true, inputUnits: result.inputUnits, outputUnits: result.outputUnits });
    } catch (error) { console.error("search intent fallback", error instanceof AiError ? error.code : "UNKNOWN"); await recordAiUsage(service, provider, { model: provider.generativeModel, task: "search_intent", success: false }); }
  }
  const itemTypes = intent.entityTypes.flatMap((type) => type === "people" ? ["profile"] : type === "posts" ? ["post"] : type === "videos" ? ["video"] : type === "communities" ? ["community"] : type === "events" ? ["event"] : []);
  const semantic = new Map<string, number>();
  if (provider && itemTypes.length) {
    const { data: allowed } = await service.rpc("consume_ai_action_quota", { p_user_id: authData.user.id, p_action: "search_embedding", p_limit: 30, p_window_minutes: 60 });
    if (allowed) try {
      const embedded = await provider.embed(query, "RETRIEVAL_QUERY"); const vector = `[${embedded.values.join(",")}]`;
      const { data } = await service.rpc("search_recommendation_metadata", { p_query_embedding: vector, p_item_types: unique(itemTypes), p_limit: 80 });
      for (const row of data || []) semantic.set(`${row.item_type}:${row.item_id}`, clamp(Number(row.semantic_score || 0)));
      await recordAiUsage(service, provider, { model: embedded.model, task: "search_embedding", success: true, inputUnits: embedded.inputUnits });
    } catch (error) { console.error("search embedding fallback", error instanceof AiError ? error.code : "UNKNOWN"); await recordAiUsage(service, provider, { model: provider.embeddingModel, task: "search_embedding", success: false }); }
  }
  const safeTerm = query.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim(); const pattern = `%${safeTerm}%`; const today = new Date().toISOString().slice(0, 10);
  const [profileResult, blocksResult] = await Promise.all([
    service.from("profiles").select("location_city, location_country").eq("user_id", authData.user.id).maybeSingle(),
    service.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${authData.user.id},blocked_id.eq.${authData.user.id}`),
  ]);
  const blocked = new Set((blocksResult.data || []).map((row) => row.blocker_id === authData.user.id ? row.blocked_id : row.blocker_id)); const me: any = profileResult.data || {};
  const wants = (type: SearchType) => intent.entityTypes.includes(type); const searches: PromiseLike<any>[] = [];
  searches.push(wants("people") ? service.from("profiles").select("id, user_id, first_name, last_name, bio, profile_image_url, is_verified, location_city, location_country, updated_at").eq("is_active", true).eq("show_in_search", true).or(`first_name.ilike.${pattern},last_name.ilike.${pattern},bio.ilike.${pattern},location_city.ilike.${pattern}`).limit(60) : Promise.resolve({ data: [] }));
  searches.push(wants("communities") ? service.from("communities").select("id, community_name, description, category, profile_image_url, member_count, location_city, delivery_mode, updated_at").eq("is_active", true).in("visibility", ["public", "approval"]).or(`community_name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`).limit(60) : Promise.resolve({ data: [] }));
  searches.push(wants("events") ? service.from("events").select("id, name, description, category, location, event_date, start_time, event_image_url, attendance_mode, created_at").eq("is_active", true).eq("status", "scheduled").eq("privacy", "public").gte("event_date", today).or(`name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},location.ilike.${pattern}`).limit(60) : Promise.resolve({ data: [] }));
  searches.push(wants("posts") || wants("videos") ? service.from("posts").select("id, user_id, content, content_type, created_at").eq("status", "active").eq("visibility", "public").ilike("content", pattern).limit(80) : Promise.resolve({ data: [] }));
  searches.push(wants("topics") ? service.from("user_interests").select("interest_name").ilike("interest_name", pattern).limit(40) : Promise.resolve({ data: [] }));
  const [peopleRaw, communitiesRaw, eventsRaw, postsRaw, topicsRaw] = await Promise.all(searches);
  const semanticIds = (type: string) => [...semantic.keys()].filter((key) => key.startsWith(`${type}:`)).slice(0, 40).map((key) => key.slice(type.length + 1));
  const profileIds = semanticIds("profile"); const communityIds = semanticIds("community"); const eventIds = semanticIds("event"); const postIds = unique([...semanticIds("post"), ...semanticIds("video")]);
  const [semanticPeople, semanticCommunities, semanticEvents, semanticPosts] = await Promise.all([
    wants("people") && profileIds.length ? service.from("profiles").select("id, user_id, first_name, last_name, bio, profile_image_url, is_verified, location_city, location_country, updated_at").eq("is_active", true).eq("show_in_search", true).in("id", profileIds) : Promise.resolve({ data: [] }),
    wants("communities") && communityIds.length ? service.from("communities").select("id, community_name, description, category, profile_image_url, member_count, location_city, delivery_mode, updated_at").eq("is_active", true).in("visibility", ["public", "approval"]).in("id", communityIds) : Promise.resolve({ data: [] }),
    wants("events") && eventIds.length ? service.from("events").select("id, name, description, category, location, event_date, start_time, event_image_url, attendance_mode, created_at").eq("is_active", true).eq("status", "scheduled").eq("privacy", "public").gte("event_date", today).in("id", eventIds) : Promise.resolve({ data: [] }),
    (wants("posts") || wants("videos")) && postIds.length ? service.from("posts").select("id, user_id, content, content_type, created_at").eq("status", "active").eq("visibility", "public").in("id", postIds) : Promise.resolve({ data: [] }),
  ]);
  const merge = (left: any[], right: any[]) => [...new Map([...(left || []), ...(right || [])].map((row) => [row.id, row])).values()];
  const peopleCandidates = merge(peopleRaw.data, semanticPeople.data); const communityCandidates = merge(communitiesRaw.data, semanticCommunities.data); const eventCandidates = merge(eventsRaw.data, semanticEvents.data); const postCandidates = merge(postsRaw.data, semanticPosts.data);
  const score = (text: number, semanticValue: number, typeSpecific: number, quality = 0.5) => text * 0.45 + semanticValue * 0.30 + typeSpecific * 0.15 + quality * 0.10;
  const people = peopleCandidates.filter((row: any) => row.user_id !== authData.user.id && !blocked.has(row.user_id)).map((row: any) => { const nearby = normalize(row.location_city) && normalize(row.location_city) === normalize(me.location_city) ? 1 : normalize(row.location_country) === normalize(me.location_country) ? 0.5 : 0; return { ...row, itemType: "profile", score: score(textScore(query, [row.first_name, row.last_name, row.bio, row.location_city]), semantic.get(`profile:${row.id}`) || 0, intent.locationScope === "nearby" ? nearby : 0.5, row.is_verified ? 0.6 : 0.5) }; }).sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  const communities = communityCandidates.map((row: any) => ({ ...row, itemType: "community", score: score(textScore(query, [row.community_name, row.description, row.category]), semantic.get(`community:${row.id}`) || 0, intent.locationScope === "nearby" && normalize(row.location_city) === normalize(me.location_city) ? 1 : row.delivery_mode === "online" ? 0.6 : 0.3) })).sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  const events = eventCandidates.map((row: any) => ({ ...row, itemType: "event", score: score(textScore(query, [row.name, row.description, row.category, row.location]), semantic.get(`event:${row.id}`) || 0, intent.locationScope === "nearby" && normalize(row.location).includes(normalize(me.location_city)) ? 1 : row.attendance_mode === "online" ? 0.6 : 0.3) })).sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  const posts = postCandidates.filter((row: any) => row.content_type !== "video" && wants("posts") && !blocked.has(row.user_id)).map((row: any) => ({ ...row, itemType: "post", score: score(textScore(query, [row.content]), semantic.get(`post:${row.id}`) || 0, 0.5) })).sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  const videos = postCandidates.filter((row: any) => row.content_type === "video" && wants("videos") && !blocked.has(row.user_id)).map((row: any) => ({ ...row, itemType: "video", score: score(textScore(query, [row.content]), semantic.get(`video:${row.id}`) || 0, 0.5) })).sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  const topics = unique((topicsRaw.data || []).map((row: any) => row.interest_name)).slice(0, limit).map((name) => ({ name, itemType: "topic" }));
  return json(200, { algorithm_version: "search_v1", intent: { entityTypes: intent.entityTypes, topics: intent.topics, locationScope: intent.locationScope, timeScope: intent.timeScope }, ai_configuration_message: aiConfigurationMessage, results: { people, posts, communities, events, videos, topics } });
});
