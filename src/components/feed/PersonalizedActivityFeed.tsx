import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageCircle, Heart, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeedStory {
  id: string;
  user_id: string;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
  created_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
    location_city: string | null;
    location_state: string | null;
    location_country: string | null;
  };
  isFollowing: boolean;
  commonInterests: number;
  score: number;
  sourceTag: "following" | "nearby" | "shared" | "discover";
}

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function PersonalizedActivityFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [likedStoryIds, setLikedStoryIds] = useState<Set<string>>(new Set());
  const [busyFollowUserId, setBusyFollowUserId] = useState<string | null>(null);
  const [busyLikeStoryId, setBusyLikeStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadFeed = async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();

      const [followsRes, myProfileRes, myInterestsRes, storiesRes] = await Promise.all([
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
        supabase
          .from("profiles")
          .select("location_city, location_state, location_country")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_interests").select("interest_name").eq("user_id", user.id),
        supabase
          .from("stories")
          .select("id, user_id, content_type, content_url, text_content, created_at")
          .eq("is_deleted", false)
          .gt("expires_at", nowIso)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(120),
      ]);

      const followSet = new Set((followsRes.data || []).map((f: any) => f.following_id));
      setFollowingIds(followSet);

      const stories = storiesRes.data || [];
      if (!stories.length) {
        setFeedStories([]);
        setLoading(false);
        return;
      }

      const storyIds = stories.map((s: any) => s.id);
      const userIds = [...new Set(stories.map((s: any) => s.user_id))];

      const [profilesRes, candidateInterestsRes, likesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_image_url, location_city, location_state, location_country")
          .in("user_id", userIds),
        supabase.from("user_interests").select("user_id, interest_name").in("user_id", userIds),
        supabase.from("story_likes").select("story_id").eq("user_id", user.id).in("story_id", storyIds),
      ]);

      const myProfile = myProfileRes.data;
      const myInterests = new Set((myInterestsRes.data || []).map((i: any) => normalize(i.interest_name)));
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const interestMap = new Map<string, Set<string>>();

      (candidateInterestsRes.data || []).forEach((row: any) => {
        if (!interestMap.has(row.user_id)) interestMap.set(row.user_id, new Set());
        interestMap.get(row.user_id)!.add(normalize(row.interest_name));
      });

      const likedSet = new Set((likesRes.data || []).map((l: any) => l.story_id));
      setLikedStoryIds(likedSet);

      const enriched = stories
        .map((story: any) => {
          const profile = profileMap.get(story.user_id);
          if (!profile) return null;

          const candidateInterests = interestMap.get(story.user_id) || new Set();
          const commonInterests = [...myInterests].filter((interest) => candidateInterests.has(interest)).length;

          const sameCity = normalize(myProfile?.location_city) && normalize(myProfile?.location_city) === normalize(profile.location_city);
          const sameState = normalize(myProfile?.location_state) && normalize(myProfile?.location_state) === normalize(profile.location_state);
          const sameCountry = normalize(myProfile?.location_country) && normalize(myProfile?.location_country) === normalize(profile.location_country);

          const isFollowing = followSet.has(story.user_id);
          const ageHours = (Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60);
          const freshnessBoost = Math.max(0, 12 - ageHours);

          const score =
            (isFollowing ? 100 : 0) +
            (sameCity ? 28 : sameState ? 14 : sameCountry ? 7 : 0) +
            Math.min(commonInterests * 6, 24) +
            freshnessBoost;

          const sourceTag: FeedStory["sourceTag"] = isFollowing
            ? "following"
            : sameCity || sameState || sameCountry
              ? "nearby"
              : commonInterests > 0
                ? "shared"
                : "discover";

          return {
            ...story,
            profile,
            isFollowing,
            commonInterests,
            score,
            sourceTag,
          } as FeedStory;
        })
        .filter(Boolean) as FeedStory[];

      const followingFirst = enriched.filter((s) => s.isFollowing).sort((a, b) => b.score - a.score);
      const discoveryRanked = enriched.filter((s) => !s.isFollowing).sort((a, b) => b.score - a.score);
      const randomMix = shuffle(discoveryRanked).slice(0, 4);

      const seen = new Set<string>();
      const finalFeed = [...followingFirst, ...discoveryRanked.slice(0, 8), ...randomMix]
        .filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .slice(0, 12);

      setFeedStories(finalFeed);
      setLoading(false);
    };

    loadFeed();
  }, [user]);

  const sourceTagLabel = useMemo(
    () => ({
      following: "Following",
      nearby: "Nearby",
      shared: "Shared interests",
      discover: "Discover",
    }),
    []
  );

  const toggleFollow = async (targetUserId: string) => {
    if (!user || busyFollowUserId) return;

    const isFollowing = followingIds.has(targetUserId);
    setBusyFollowUserId(targetUserId);

    if (isFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      setFeedStories((prev) => prev.map((s) => (s.user_id === targetUserId ? { ...s, isFollowing: false } : s)));
    } else {
      await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetUserId });
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "follow",
        title: "New Follower",
        message: "Someone started following you!",
        data: { follower_id: user.id },
      });
      setFollowingIds((prev) => new Set(prev).add(targetUserId));
      setFeedStories((prev) => prev.map((s) => (s.user_id === targetUserId ? { ...s, isFollowing: true } : s)));
    }

    setBusyFollowUserId(null);
  };

  const toggleStoryLike = async (storyId: string) => {
    if (!user || busyLikeStoryId) return;

    const isLiked = likedStoryIds.has(storyId);
    setBusyLikeStoryId(storyId);

    if (isLiked) {
      await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", user.id);
      setLikedStoryIds((prev) => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
    } else {
      await supabase.from("story_likes").insert({ story_id: storyId, user_id: user.id });
      setLikedStoryIds((prev) => new Set(prev).add(storyId));
    }

    setBusyLikeStoryId(null);
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-center py-5">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!feedStories.length) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Personalized Feed</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Follow more people and like stories to make your feed more active.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Personalized Feed</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/matches")}>Find People</Button>
      </div>

      {feedStories.map((story) => {
        const fullName = `${story.profile.first_name || ""} ${story.profile.last_name || ""}`.trim() || "User";
        const isLiked = likedStoryIds.has(story.id);

        return (
          <article key={story.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <button
              onClick={() => navigate(`/stories/${story.id}`)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 p-3.5 border-b border-border/40">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {story.profile.profile_image_url ? (
                    <img src={story.profile.profile_image_url} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {(story.profile.first_name?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{sourceTagLabel[story.sourceTag]}</Badge>
                    {story.commonInterests > 0 && (
                      <span className="text-[10px] text-muted-foreground">{story.commonInterests} shared</span>
                    )}
                  </div>
                </div>
              </div>

              {story.content_type === "image" || story.content_type === "video" ? (
                <div className="h-64 bg-muted">
                  <img src={story.content_url || ""} alt="Story preview" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-sm text-foreground line-clamp-4">{story.text_content || "New story"}</p>
                </div>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2 p-3">
              <Button
                size="sm"
                variant={story.isFollowing ? "outline" : "default"}
                disabled={busyFollowUserId === story.user_id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(story.user_id);
                }}
              >
                {story.isFollowing ? <UserCheck className="h-3.5 w-3.5 mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                {story.isFollowing ? "Following" : "Follow"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/messages/${story.user_id}`)}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Message
              </Button>

              <Button
                size="sm"
                variant={isLiked ? "default" : "outline"}
                disabled={busyLikeStoryId === story.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStoryLike(story.id);
                }}
              >
                <Heart className={`h-3.5 w-3.5 mr-1 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Liked" : "Like"}
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
