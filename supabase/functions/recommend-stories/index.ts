import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rankStory, type StoryCandidate } from "../_shared/recommendation/rankers/stories.ts";
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
  const limit = typeof body.limit === "number" && Number.isInteger(body.limit)
    ? Math.max(1, Math.min(body.limit, 40))
    : 30;
  const now = new Date().toISOString();
  const { data: stories, error: storiesError } = await userClient.from("stories")
    .select("id, user_id, content_type, content_url, text_content, interest_tags, created_at, expires_at, is_deleted")
    .eq("is_deleted", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(100);
  if (storiesError) return json(500, { error: "Unable to load stories" });
  if (!stories?.length) return json(200, { items: [], algorithm_version: ALGORITHM_VERSIONS.stories });

  const storyIds = stories.map((story) => story.id);
  const authorIds = [...new Set(stories.map((story) => story.user_id))];
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [profilesResult, interestsResult, followsResult, connectionsResult, blocksResult,
    viewerMembershipsResult, authorMembershipsResult, viewsResult, repliesResult, messagesResult] = await Promise.all([
    service.from("profiles").select("user_id, first_name, last_name, profile_image_url, is_active, account_status").in("user_id", authorIds),
    service.from("user_interests").select("interest_name").eq("user_id", currentUserId),
    service.from("user_follows").select("following_id").eq("follower_id", currentUserId).in("following_id", authorIds),
    service.from("connections").select("user_id_1, user_id_2, status").or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
    service.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
    service.from("community_members").select("community_id").eq("user_id", currentUserId).eq("status", "active"),
    service.from("community_members").select("community_id, user_id").in("user_id", authorIds).eq("status", "active"),
    service.from("story_views").select("story_id").eq("viewer_id", currentUserId).in("story_id", storyIds),
    service.from("story_replies").select("story_id").eq("user_id", currentUserId).in("story_id", storyIds),
    service.from("messages").select("sender_id, recipient_id, created_at").gte("created_at", since)
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`),
  ]);

  const profiles = new Map((profilesResult.data || []).map((row) => [row.user_id, row]));
  const interests = (interestsResult.data || []).map((row) => row.interest_name);
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
  const viewerCommunities = new Set((viewerMembershipsResult.data || []).map((row) => row.community_id));
  const sharedCommunityCount = new Map<string, number>();
  for (const row of authorMembershipsResult.data || []) {
    if (viewerCommunities.has(row.community_id)) {
      sharedCommunityCount.set(row.user_id, (sharedCommunityCount.get(row.user_id) || 0) + 1);
    }
  }
  const viewedIds = new Set((viewsResult.data || []).map((row) => row.story_id));
  const repliedIds = new Set((repliesResult.data || []).map((row) => row.story_id));
  const recentMessageCount = new Map<string, number>();
  for (const row of messagesResult.data || []) {
    const other = row.sender_id === currentUserId ? row.recipient_id : row.sender_id;
    if (authorIds.includes(other)) recentMessageCount.set(other, (recentMessageCount.get(other) || 0) + 1);
  }

  const ranked = stories.flatMap((story) => {
    const author = profiles.get(story.user_id);
    if (!author || blockedIds.has(story.user_id) || author.is_active === false || (author.account_status || "active") !== "active") return [];
    const connected = connectedIds.has(story.user_id);
    const followed = followedIds.has(story.user_id);
    const own = story.user_id === currentUserId;
    const sharedCommunities = sharedCommunityCount.get(story.user_id) || 0;
    const candidate: StoryCandidate = {
      id: story.id,
      createdAt: story.created_at,
      relationshipStrength: own ? 1 : connected ? 1 : followed ? 0.65 : sharedCommunities ? 0.4 : 0,
      recentInteraction: saturated(recentMessageCount.get(story.user_id) || 0, 5),
      storyEngagementHistory: repliedIds.has(story.id) ? 1 : viewedIds.has(story.id) ? 0.45 : 0,
      contentRelevance: overlapScore(interests, story.interest_tags || []),
      communityRelationship: Math.min(1, sharedCommunities / 2),
      viewed: viewedIds.has(story.id),
    };
    return [{ story, author, ranked: rankStory(candidate) }];
  }).sort((a, b) => b.ranked.score - a.ranked.score || new Date(b.story.created_at).getTime() - new Date(a.story.created_at).getTime());

  return json(200, {
    algorithm_version: ALGORITHM_VERSIONS.stories,
    items: ranked.slice(0, limit).map(({ story, author, ranked: score }, index) => ({
      id: story.id,
      userId: story.user_id,
      userName: `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Member",
      userAvatar: author.profile_image_url || null,
      contentType: story.content_type,
      contentUrl: story.content_url || "",
      caption: story.text_content || null,
      createdAt: story.created_at,
      hasUnseen: !score.viewed,
      rankPosition: index + 1,
      score: score.score,
      reasonCodes: score.reasonCodes,
      algorithmVersion: ALGORITHM_VERSIONS.stories,
    })),
  });
});
