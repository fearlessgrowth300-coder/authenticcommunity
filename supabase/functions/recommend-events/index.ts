import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rankEvent } from "../_shared/recommendation/rankers/events.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const normalize = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const overlap = (left: string[], right: string[]) => { if (!left.length || !right.length) return 0; const set = new Set(right.map(normalize)); return clamp(left.filter((value) => set.has(normalize(value))).length / Math.min(3, left.length)); };
const haversineKm = (a: number, b: number, c: number, d: number) => { const r = (v: number) => v * Math.PI / 180; const x = r(c - a); const y = r(d - b); const q = Math.sin(x / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(y / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q)); };

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization"); if (!authorization) return json(401, { error: "Authentication required" });
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(); if (authError || !authData.user) return json(401, { error: "Authentication required" });
  const userId = authData.user.id; const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: Record<string, unknown> = {}; try { body = await request.json(); } catch { /* defaults */ } const limit = typeof body.limit === "number" ? Math.max(1, Math.min(30, Math.floor(body.limit))) : 20;
  const today = new Date().toISOString().slice(0, 10);
  const [profileResult, preferencesResult, interestsResult, affiliationsResult, membershipsResult, connectionsResult, eventsResult] = await Promise.all([
    service.from("profiles").select("location_city, location_country, latitude, longitude, max_distance_km").eq("user_id", userId).maybeSingle(),
    service.from("user_preferences").select("personalization_enabled, discovery_area").eq("user_id", userId).maybeSingle(),
    service.from("user_interests").select("interest_name").eq("user_id", userId),
    service.from("user_topic_affinities").select("topic, score").eq("user_id", userId).eq("source", "learned"),
    service.from("community_members").select("community_id, status").eq("user_id", userId),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
    service.from("events").select("id, organizer_id, community_id, name, description, event_date, start_time, location, latitude, longitude, event_image_url, category, max_attendees, attendee_count, privacy, attendance_mode, status, is_active, created_at").eq("is_active", true).gte("event_date", today).neq("status", "cancelled").order("event_date").limit(150),
  ]);
  const profile: any = profileResult.data || {}; const preferences: any = preferencesResult.data || {}; const personalization = preferences.personalization_enabled !== false;
  const explicit = personalization ? (interestsResult.data || []).map((row) => row.interest_name) : []; const learned = personalization ? (affiliationsResult.data || []).filter((row) => row.score > 0).map((row) => row.topic) : [];
  const memberships = new Set((membershipsResult.data || []).filter((row) => row.status === "active").map((row) => row.community_id)); const connected = new Set<string>(); for (const row of connectionsResult.data || []) if (["active", "accepted"].includes(row.status)) connected.add(row.user_id_1 === userId ? row.user_id_2 : row.user_id_1);
  const eligible = (eventsResult.data || []).filter((event) => event.privacy === "public" || (event.privacy === "community" && event.community_id && memberships.has(event.community_id)) || event.organizer_id === userId);
  const ids = eligible.map((event) => event.id); if (!ids.length) return json(200, { items: [], algorithm_version: "events_v1" });
  const [attendeesResult, savesResult, metadataResult, semanticResult] = await Promise.all([
    service.from("event_attendees").select("event_id, user_id, rsvp_status").in("event_id", ids),
    service.from("event_saves").select("event_id, user_id").in("event_id", ids),
    service.from("recommendation_item_metadata").select("item_id, topics, quality_features").eq("item_type", "event").in("item_id", ids),
    userClient.rpc("get_semantic_recommendation_scores", { p_item_type: "event", p_item_ids: ids }),
  ]);
  const attendees = new Map<string, any[]>(); for (const row of attendeesResult.data || []) attendees.set(row.event_id, [...(attendees.get(row.event_id) || []), row]); const saves = new Map<string, number>(); for (const row of savesResult.data || []) saves.set(row.event_id, (saves.get(row.event_id) || 0) + 1);
  const metadata = new Map((metadataResult.data || []).map((row) => [row.item_id, row])); const semantic = new Map((semanticResult.data || []).map((row: any) => [row.item_id, clamp(Number(row.semantic_score || 0))])); const now = Date.now();
  const ranked = eligible.map((event) => {
    const attending = attendees.get(event.id) || []; const isGoing = attending.some((row) => row.user_id === userId && row.rsvp_status === "going"); const goingCount = attending.filter((row) => row.rsvp_status === "going").length;
    if (!isGoing && event.max_attendees && goingCount >= event.max_attendees) return null;
    const mode = event.attendance_mode || "in_person"; let distanceKm: number | null = null; if ([profile.latitude, profile.longitude, event.latitude, event.longitude].every((value) => value != null)) distanceKm = haversineKm(Number(profile.latitude), Number(profile.longitude), Number(event.latitude), Number(event.longitude));
    const sameCity = normalize(profile.location_city) && normalize(event.location).includes(normalize(profile.location_city)); const sameCountry = normalize(profile.location_country) && normalize(event.location).includes(normalize(profile.location_country)); const maxDistance = Number(profile.max_distance_km || 100);
    if (mode === "in_person" && preferences.discovery_area === "nearby" && distanceKm != null && distanceKm > maxDistance) return null;
    const distanceGeography = mode === "online" ? 0.65 : distanceKm != null ? distanceKm <= 5 ? 1 : distanceKm <= 15 ? 0.9 : distanceKm <= maxDistance ? 0.7 : 0.1 : sameCity ? 0.9 : sameCountry ? 0.5 : mode === "hybrid" ? 0.5 : 0.15;
    const eventTime = new Date(`${event.event_date}T${event.start_time || "12:00:00"}`).getTime(); const daysAway = Math.max(0, (eventTime - now) / 86_400_000); const dateTimeSuitability = daysAway <= 2 ? 1 : daysAway <= 7 ? 0.85 : daysAway <= 30 ? 0.6 : 0.35;
    const meta: any = metadata.get(event.id); const topics = [event.category, ...(Array.isArray(meta?.topics) ? meta.topics.map((topic: any) => typeof topic === "string" ? topic : topic.topic) : [])].filter(Boolean); const taxonomy = overlap(explicit, topics); const interestMatch = semantic.has(event.id) ? taxonomy * 0.8 + semantic.get(event.id)! * 0.2 : taxonomy;
    const connectionCount = attending.filter((row) => connected.has(row.user_id) && row.rsvp_status === "going").length; const eventQuality = clamp(0.45 + Math.min(0.45, (goingCount + (saves.get(event.id) || 0) * 2) / 100)); const freshnessTrending = clamp((new Date(event.created_at).getTime() > now - 14 * 86_400_000 ? 0.6 : 0.3) + Math.min(0.4, (saves.get(event.id) || 0) / 20));
    const scored = rankEvent({ id: event.id, distanceGeography, dateTimeSuitability, interestMatch: Math.max(interestMatch, overlap(learned, topics) * 0.5), socialAttendance: clamp(connectionCount / 3), communityRelevance: event.community_id && memberships.has(event.community_id) ? 1 : 0, eventQuality, freshnessTrending });
    return { event, scored, distanceKm, goingCount, isGoing, isSaved: (savesResult.data || []).some((row) => row.event_id === event.id && row.user_id === userId) };
  }).filter(Boolean).sort((a: any, b: any) => b.scored.score - a.scored.score).slice(0, limit) as any[];
  return json(200, { items: ranked.map(({ event, scored, distanceKm, goingCount, isGoing, isSaved }, index) => ({ id: event.id, title: event.name, host: "Authentic Community", eventDate: event.event_date, startTime: event.start_time, location: event.location || (event.attendance_mode === "online" ? "Online" : "Local event"), distance: event.attendance_mode === "online" ? "Online" : distanceKm != null ? `${Math.max(1, Math.round(distanceKm))} km away` : event.location || "Local", imageUrl: event.event_image_url || null, attendeesCount: goingCount || event.attendee_count || 0, isRsvped: isGoing, isSaved, description: event.description || "", score: Math.round(scored.score * 100), reasonCodes: scored.reasonCodes, rankPosition: index + 1, algorithmVersion: "events_v1" })), algorithm_version: "events_v1" });
});
