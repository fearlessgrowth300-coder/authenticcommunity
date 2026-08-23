import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { diversifyRankedItems } from "../_shared/recommendation/diversity.ts";
import { isFeedCandidateEligible } from "../_shared/recommendation/eligibility.ts";
import { explorationBoost } from "../_shared/recommendation/exploration.ts";
import { contentEngagementQuality } from "../_shared/recommendation/quality.ts";
import { rankFollowing } from "../_shared/recommendation/rankers/following.ts";
import { rankForYou } from "../_shared/recommendation/rankers/forYou.ts";
import { rankNearby } from "../_shared/recommendation/rankers/nearby.ts";
import type { FeedCandidate, RankedFeedCandidate } from "../_shared/recommendation/rankers/feedTypes.ts";
import { ALGORITHM_VERSIONS } from "../_shared/recommendation/versioning.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FeedSurface = "for_you" | "following" | "nearby";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function overlapScore(source: string[], target: string[]) {
  if (source.length === 0) return 0;
  const targetSet = new Set(target.map(normalize));
  const matches = source.filter((value) => targetSet.has(normalize(value))).length;
  return Math.min(1, matches / Math.min(3, source.length));
}

function countBy(rows: Array<Record<string, unknown>>, key: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string") counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
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

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const surface = body.surface;
  if (!['for_you', 'following', 'nearby'].includes(String(surface))) {
    return json(400, { error: "Invalid feed surface" });
  }
  const typedSurface = surface as FeedSurface;
  const page = typeof body.page === "number" && Number.isInteger(body.page) ? Math.max(1, Math.min(body.page, 100)) : 1;
  const pageSize = typeof body.page_size === "number" && Number.isInteger(body.page_size)
    ? Math.max(1, Math.min(body.page_size, 20)) : 10;

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [profileResult, preferencesResult, interestsResult, followsResult, connectionsResult,
    blocksResult, dismissalsResult, membershipsResult, affinitiesResult] = await Promise.all([
    service.from("profiles").select("user_id, location_city, location_country").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_preferences").select("personalization_enabled, exploration_enabled, recommendation_reset_at").eq("user_id", currentUserId).maybeSingle(),
    service.from("user_interests").select("interest_name").eq("user_id", currentUserId),
    service.from("user_follows").select("following_id").eq("follower_id", currentUserId),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
    service.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
    service.from("content_dismissals").select("content_id").eq("user_id", currentUserId),
    service.from("community_members").select("community_id").eq("user_id", currentUserId).eq("status", "active"),
    service.from("user_topic_affinities").select("topic, score").eq("user_id", currentUserId).eq("source", "learned"),
  ]);

  const currentProfile = profileResult.data;
  const preferences = preferencesResult.data || {};
  const personalizationEnabled = preferences.personalization_enabled !== false;
  const explorationEnabled = preferences.exploration_enabled !== false && personalizationEnabled;
  const explicitInterests = personalizationEnabled
    ? (interestsResult.data || []).map((row) => row.interest_name)
    : [];
  const learnedTopics = personalizationEnabled
    ? (affinitiesResult.data || []).filter((row) => row.score > 0).map((row) => row.topic)
    : [];
  const followedIds = new Set((followsResult.data || []).map((row) => row.following_id));
  const connectedIds = new Set<string>();
  for (const row of connectionsResult.data || []) {
    if (!["active", "accepted"].includes(row.status)) continue;
    connectedIds.add(row.user_id_1 === currentUserId ? row.user_id_2 : row.user_id_1);
  }
  const blockedIds = new Set<string>();
  for (const row of blocksResult.data || []) {
    blockedIds.add(row.blocker_id === currentUserId ? row.blocked_id : row.blocker_id);
  }
  const dismissedIds = new Set((dismissalsResult.data || []).map((row) => row.content_id));
  const joinedCommunityIds = new Set((membershipsResult.data || []).map((row) => row.community_id));

  let postsQuery = userClient.from("posts")
    .select("id, user_id, community_id, content, content_type, visibility, interest_tags, location_label, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);
  if (typedSurface === "following") {
    const followed = [...followedIds];
    if (followed.length === 0) {
      return json(200, { items: [], has_more: false, algorithm_version: ALGORITHM_VERSIONS.following });
    }
    postsQuery = postsQuery.in("user_id", followed);
  }
  const { data: posts, error: postsError } = await postsQuery;
  if (postsError) return json(500, { error: "Unable to load feed" });
  if (!posts?.length) return json(200, { items: [], has_more: false, algorithm_version: ALGORITHM_VERSIONS[typedSurface] });

  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.user_id))];
  const [authorsResult, authorInterestsResult, mediaResult, likesResult, savesResult,
    commentsResult, metadataResult, viewerLikesResult, viewerSavesResult] = await Promise.all([
    service.from("profiles").select("user_id, first_name, last_name, profile_image_url, location_city, location_country, is_verified, is_active, account_status").in("user_id", authorIds),
    service.from("user_interests").select("user_id, interest_name").in("user_id", authorIds),
    service.from("post_media").select("post_id, media_url, media_type, sort_order").in("post_id", postIds),
    service.from("post_likes").select("post_id").in("post_id", postIds),
    service.from("post_saves").select("post_id").in("post_id", postIds),
    service.from("post_comments").select("post_id").in("post_id", postIds),
    service.from("recommendation_item_metadata").select("item_id, topics, quality_features, enrichment_status").in("item_id", postIds).in("item_type", ["post", "video"]),
    service.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
    service.from("post_saves").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
  ]);

  const authors = new Map((authorsResult.data || []).map((row) => [row.user_id, row]));
  const authorInterests = new Map<string, string[]>();
  for (const row of authorInterestsResult.data || []) {
    authorInterests.set(row.user_id, [...(authorInterests.get(row.user_id) || []), row.interest_name]);
  }
  const metadata = new Map((metadataResult.data || []).map((row) => [row.item_id, row]));
  const media = new Map<string, { images: string[]; videoUrl?: string }>();
  for (const row of mediaResult.data || []) {
    const entry = media.get(row.post_id) || { images: [] };
    if (row.media_type === "video") entry.videoUrl = row.media_url;
    else entry.images.push(row.media_url);
    media.set(row.post_id, entry);
  }
  const likeCounts = countBy(likesResult.data || [], "post_id");
  const saveCounts = countBy(savesResult.data || [], "post_id");
  const commentCounts = countBy(commentsResult.data || [], "post_id");
  const viewerLikes = new Set((viewerLikesResult.data || []).map((row) => row.post_id));
  const viewerSaves = new Set((viewerSavesResult.data || []).map((row) => row.post_id));

  const eligiblePosts: Array<{ post: any; author: any; candidate: FeedCandidate }> = [];
  for (const post of posts) {
    const author = authors.get(post.user_id);
    if (!author) continue;
    const sameCity = Boolean(currentProfile?.location_city && author.location_city && normalize(currentProfile.location_city) === normalize(author.location_city));
    const sameCountry = Boolean(currentProfile?.location_country && author.location_country && normalize(currentProfile.location_country) === normalize(author.location_country));
    if (typedSurface === "nearby" && post.user_id !== currentUserId && !sameCity) continue;
    if (!isFeedCandidateEligible({
      authorId: post.user_id,
      status: post.status,
      visibility: post.visibility,
      authorActive: author.is_active !== false,
      authorAccountStatus: author.account_status || "active",
      communityAllowed: !post.community_id || joinedCommunityIds.has(post.community_id) || post.visibility === "public",
    }, { currentUserId, blockedUserIds: blockedIds, dismissedItemIds: dismissedIds, itemId: post.id })) continue;

    const itemMetadata: any = metadata.get(post.id);
    const metadataTopics = Array.isArray(itemMetadata?.topics)
      ? itemMetadata.topics.map((topic: any) => typeof topic === "string" ? topic : topic.topic).filter(Boolean)
      : [];
    const topics = [...new Set([...(post.interest_tags || []), ...metadataTopics, ...(authorInterests.get(post.user_id) || [])])];
    const qualityFeatures = itemMetadata?.quality_features || {};
    const contentQuality = itemMetadata?.enrichment_status === "completed"
      ? Math.max(0, Math.min(1, (Number(qualityFeatures.informational || 0) + Number(qualityFeatures.conversation_potential || 0)) / 2))
      : 0.5;
    const candidate: FeedCandidate = {
      id: post.id,
      authorId: post.user_id,
      createdAt: post.created_at,
      primaryTopic: topics[0] || "General",
      explicitInterestScore: overlapScore(explicitInterests, topics),
      learnedInterestScore: overlapScore(learnedTopics, topics),
      relationshipScore: post.user_id === currentUserId ? 1 : connectedIds.has(post.user_id) ? 1 : followedIds.has(post.user_id) ? 0.65 : 0,
      communityScore: post.community_id && joinedCommunityIds.has(post.community_id) ? 1 : 0,
      localScore: sameCity ? 1 : sameCountry ? 0.4 : 0,
      engagementQuality: contentEngagementQuality({
        likes: likeCounts.get(post.id) || 0,
        comments: commentCounts.get(post.id) || 0,
        saves: saveCounts.get(post.id) || 0,
      }),
      contentQuality,
      explorationBoost: explorationBoost(`${currentUserId}:${post.id}:${new Date().toISOString().slice(0, 10)}`, explorationEnabled),
    };
    eligiblePosts.push({ post, author, candidate });
  }

  const ranker = typedSurface === "following" ? rankFollowing : typedSurface === "nearby" ? rankNearby : rankForYou;
  const ranked = eligiblePosts.map((entry) => ({ ...entry, ranked: ranker(entry.candidate) }))
    .sort((a, b) => b.ranked.score - a.ranked.score || new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime());
  const byId = new Map(ranked.map((entry) => [entry.post.id, entry]));
  const diversified = diversifyRankedItems(
    ranked.map((entry) => ({ ...entry.ranked, primaryTopic: entry.candidate.primaryTopic })),
    100,
  );
  const ordered = diversified.map((item) => byId.get(item.id)!).filter(Boolean);
  const start = (page - 1) * pageSize;
  const pageItems = ordered.slice(start, start + pageSize);
  const algorithmVersion = ALGORITHM_VERSIONS[typedSurface];

  return json(200, {
    algorithm_version: algorithmVersion,
    has_more: start + pageSize < ordered.length,
    items: pageItems.map(({ post, author, ranked }, index) => ({
      id: post.id,
      authorId: post.user_id,
      author_name: `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Community Member",
      author_avatar: author.profile_image_url || null,
      is_verified: Boolean(author.is_verified),
      location: post.location_label || author.location_city || "Local",
      topic: ranked.primaryTopic || "General",
      created_at: post.created_at,
      text: post.content || "",
      images: media.get(post.id)?.images || [],
      video_url: media.get(post.id)?.videoUrl || null,
      likes_count: likeCounts.get(post.id) || 0,
      comments_count: commentCounts.get(post.id) || 0,
      is_liked: viewerLikes.has(post.id),
      is_saved: viewerSaves.has(post.id),
      is_following: post.user_id === currentUserId || followedIds.has(post.user_id),
      is_connection: connectedIds.has(post.user_id),
      score: ranked.score,
      rank_position: start + index + 1,
      reason_codes: ranked.reasonCodes,
      algorithm_version: algorithmVersion,
    })),
  });
});
