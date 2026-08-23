import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { explorationBoost } from "../_shared/recommendation/exploration.ts";
import { rankVideo, type VideoCandidate } from "../_shared/recommendation/rankers/videos.ts";
import { ALGORITHM_VERSIONS } from "../_shared/recommendation/versioning.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function overlapScore(source: string[], target: string[]) {
  if (!source.length || !target.length) return 0;
  const targetSet = new Set(target.map(normalize));
  return Math.min(1, source.filter((value) => targetSet.has(normalize(value))).length / Math.min(3, source.length));
}

function saturated(count: number, scale: number) {
  return 1 - Math.exp(-Math.max(0, count) / scale);
}

function countBy(rows: Array<Record<string, unknown>>, key: string) {
  const result = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string") result.set(value, (result.get(value) || 0) + 1);
  }
  return result;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { error: "Authentication required" });
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json(401, { error: "Authentication required" });
  const currentUserId = authData.user.id;
  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const page = typeof body.page === "number" && Number.isInteger(body.page) ? Math.max(1, Math.min(body.page, 100)) : 1;
  const pageSize = typeof body.page_size === "number" && Number.isInteger(body.page_size)
    ? Math.max(1, Math.min(body.page_size, 20))
    : 20;

  const { data: videos, error: videosError } = await userClient.from("posts")
    .select("id, user_id, community_id, content, interest_tags, location_label, status, created_at")
    .eq("content_type", "video")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(120);
  if (videosError) return json(500, { error: "Unable to load videos" });
  if (!videos?.length) return json(200, { items: [], has_more: false, algorithm_version: ALGORITHM_VERSIONS.videos });

  const videoIds = videos.map((video) => video.id);
  const authorIds = [...new Set(videos.map((video) => video.user_id))];
  const [profileResult, preferencesResult, interestsResult, affinitiesResult, followsResult,
    connectionsResult, blocksResult, dismissalsResult, membershipsResult, authorsResult,
    mediaResult, likesResult, savesResult, commentsResult, metadataResult, outcomeEventsResult,
    viewerLikesResult, viewerSavesResult, semanticResult] = await Promise.all([
    service.from("profiles").select("location_city, location_country").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_preferences").select("personalization_enabled, exploration_enabled").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_interests").select("interest_name").eq("user_id", currentUserId),
    service.from("user_topic_affinities").select("topic, score").eq("user_id", currentUserId).eq("source", "learned"),
    service.from("user_follows").select("following_id").eq("follower_id", currentUserId),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
    service.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
    service.from("content_dismissals").select("content_id").eq("user_id", currentUserId).in("content_id", videoIds),
    service.from("community_members").select("community_id").eq("user_id", currentUserId).eq("status", "active"),
    service.from("profiles").select("user_id, first_name, last_name, profile_image_url, location_city, location_country, is_verified, is_active, account_status").in("user_id", authorIds),
    service.from("post_media").select("post_id, media_url, media_type, sort_order").in("post_id", videoIds).eq("media_type", "video"),
    service.from("post_likes").select("post_id").in("post_id", videoIds),
    service.from("post_saves").select("post_id").in("post_id", videoIds),
    service.from("post_comments").select("post_id").in("post_id", videoIds),
    service.from("recommendation_item_metadata").select("item_id, topics, quality_features, enrichment_status").eq("item_type", "video").in("item_id", videoIds),
    service.from("recommendation_events").select("user_id, item_id, event_type, safe_metadata").eq("surface", "videos").eq("item_type", "video").in("item_id", videoIds).limit(5000),
    service.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", videoIds),
    service.from("post_saves").select("post_id").eq("user_id", currentUserId).in("post_id", videoIds),
    userClient.rpc("get_semantic_recommendation_scores", { p_item_type: "video", p_item_ids: videoIds }),
  ]);

  const currentProfile = profileResult.data;
  const preferences = preferencesResult.data || {};
  const personalized = preferences.personalization_enabled !== false;
  const explore = personalized && preferences.exploration_enabled !== false;
  const explicitInterests = personalized ? (interestsResult.data || []).map((row) => row.interest_name) : [];
  const learnedTopics = personalized ? (affinitiesResult.data || []).filter((row) => row.score > 0).map((row) => row.topic) : [];
  const semanticScores = new Map((semanticResult.data || []).map((row: any) => [row.item_id, Number(row.semantic_score || 0)]));
  const followedIds = new Set((followsResult.data || []).map((row) => row.following_id));
  const connectedIds = new Set<string>();
  for (const row of connectionsResult.data || []) {
    if (!["active", "accepted"].includes(row.status)) continue;
    connectedIds.add(row.user_id_1 === currentUserId ? row.user_id_2 : row.user_id_1);
  }
  const blockedIds = new Set<string>();
  for (const row of blocksResult.data || []) blockedIds.add(row.blocker_id === currentUserId ? row.blocked_id : row.blocker_id);
  const dismissedIds = new Set((dismissalsResult.data || []).map((row) => row.content_id));
  const joinedCommunities = new Set((membershipsResult.data || []).map((row) => row.community_id));
  const authors = new Map((authorsResult.data || []).map((row) => [row.user_id, row]));
  const metadata = new Map((metadataResult.data || []).map((row) => [row.item_id, row]));
  const videoUrls = new Map<string, string>();
  for (const row of (mediaResult.data || []).sort((a, b) => a.sort_order - b.sort_order)) {
    if (!videoUrls.has(row.post_id)) videoUrls.set(row.post_id, row.media_url);
  }
  const likeCounts = countBy(likesResult.data || [], "post_id");
  const saveCounts = countBy(savesResult.data || [], "post_id");
  const commentCounts = countBy(commentsResult.data || [], "post_id");
  const viewerLikes = new Set((viewerLikesResult.data || []).map((row) => row.post_id));
  const viewerSaves = new Set((viewerSavesResult.data || []).map((row) => row.post_id));

  const eventStats = new Map<string, { starts: number; completes: number; watchTotal: number; watchCount: number; replayUsers: Set<string>; shares: number; outcomes: number }>();
  for (const event of outcomeEventsResult.data || []) {
    const stats = eventStats.get(event.item_id) || { starts: 0, completes: 0, watchTotal: 0, watchCount: 0, replayUsers: new Set<string>(), shares: 0, outcomes: 0 };
    if (event.event_type === "video_start") stats.starts += 1;
    if (event.event_type === "video_complete") stats.completes += 1;
    if (event.event_type === "video_replay") stats.replayUsers.add(event.user_id);
    if (event.event_type === "video_watch") {
      stats.watchTotal += Math.max(0, Math.min(100, Number(event.safe_metadata?.watch_percent || 0))) / 100;
      stats.watchCount += 1;
    }
    if (event.event_type === "post_share") stats.shares += 1;
    if (["follow", "connection_request", "community_join", "event_rsvp"].includes(event.event_type)) stats.outcomes += 1;
    eventStats.set(event.item_id, stats);
  }

  const ranked = videos.flatMap((video) => {
    const author = authors.get(video.user_id);
    const videoUrl = videoUrls.get(video.id);
    if (!author || !videoUrl || blockedIds.has(video.user_id) || dismissedIds.has(video.id) || author.is_active === false || (author.account_status || "active") !== "active") return [];
    const itemMetadata: any = metadata.get(video.id);
    const metadataTopics = Array.isArray(itemMetadata?.topics)
      ? itemMetadata.topics.map((topic: any) => typeof topic === "string" ? topic : topic.topic).filter(Boolean)
      : [];
    const topics = [...new Set([...(video.interest_tags || []), ...metadataTopics])];
    const sameCity = Boolean(currentProfile?.location_city && author.location_city && normalize(currentProfile.location_city) === normalize(author.location_city));
    const sameCountry = Boolean(currentProfile?.location_country && author.location_country && normalize(currentProfile.location_country) === normalize(author.location_country));
    const quality = itemMetadata?.quality_features || {};
    const creatorQuality = Math.min(1,
      (Number(quality.informational || 0) + Number(quality.conversation_potential || 0)) * 0.35 +
      (author.is_verified ? 0.15 : 0) + 0.15,
    );
    const stats = eventStats.get(video.id) || { starts: 0, completes: 0, watchTotal: 0, watchCount: 0, replayUsers: new Set<string>(), shares: 0, outcomes: 0 };
    const averageWatch = stats.watchCount ? stats.watchTotal / stats.watchCount : 0;
    const completionRate = stats.starts ? Math.min(1, stats.completes / stats.starts) : 0;
    const replayQuality = Math.min(1, stats.replayUsers.size / Math.max(1, stats.starts));
    const watchQuality = averageWatch * 0.5 + completionRate * 0.4 + replayQuality * 0.1;
    const explicit = overlapScore(explicitInterests, topics);
    const learned = overlapScore(learnedTopics, topics);
    const candidate: VideoCandidate = {
      id: video.id,
      topicRelevance: Math.max(explicit, learned, semanticScores.get(video.id) || 0),
      watchQuality,
      savesAndShares: Math.min(1, saturated((saveCounts.get(video.id) || 0) + stats.shares * 2 + stats.outcomes * 3, 12)),
      socialRelevance: video.user_id === currentUserId ? 1 : connectedIds.has(video.user_id) ? 1 : followedIds.has(video.user_id) ? 0.65 : 0,
      creatorQuality,
      communityRelevance: video.community_id && joinedCommunities.has(video.community_id) ? 1 : 0,
      locationRelevance: sameCity ? 1 : sameCountry ? 0.4 : 0,
      exploration: explorationBoost(`${currentUserId}:${video.id}:${new Date().toISOString().slice(0, 10)}`, explore, 0.05),
    };
    return [{ video, videoUrl, author, topics, ranked: rankVideo(candidate), stats }];
  }).sort((a, b) => b.ranked.score - a.ranked.score || new Date(b.video.created_at).getTime() - new Date(a.video.created_at).getTime());

  const start = (page - 1) * pageSize;
  const pageItems = ranked.slice(start, start + pageSize);
  return json(200, {
    algorithm_version: ALGORITHM_VERSIONS.videos,
    has_more: start + pageSize < ranked.length,
    items: pageItems.map(({ video, videoUrl, author, topics, ranked: score }, index) => ({
      id: video.id,
      authorId: video.user_id,
      communityId: video.community_id || null,
      authorName: `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Member",
      authorAvatar: author.profile_image_url || null,
      isVerified: Boolean(author.is_verified),
      title: video.content || "Community video",
      videoUrl,
      thumbnail: author.profile_image_url || null,
      location: video.location_label || author.location_city || null,
      topics: topics.slice(0, 5),
      likesCount: likeCounts.get(video.id) || 0,
      commentsCount: commentCounts.get(video.id) || 0,
      isLiked: viewerLikes.has(video.id),
      isSaved: viewerSaves.has(video.id),
      isFollowing: video.user_id === currentUserId || followedIds.has(video.user_id),
      rankPosition: start + index + 1,
      score: score.score,
      reasonCodes: score.reasonCodes,
      algorithmVersion: ALGORITHM_VERSIONS.videos,
    })),
  });
});
