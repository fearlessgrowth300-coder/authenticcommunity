import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId) return;

    const load = async () => {
      const [followCheck, followers, following] = await Promise.all([
        supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle(),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
      ]);
      setIsFollowing(!!followCheck.data);
      setFollowerCount(followers.count || 0);
      setFollowingCount(following.count || 0);
    };

    load();
  }, [user, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || loading) return;
    setLoading(true);

    try {
      if (isFollowing) {
        await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);

        // Create notification for the followed user
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "follow",
          title: "New Follower",
          message: "Someone started following you!",
          data: { follower_id: user.id },
        });
      }
    } catch {
      // revert
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, isFollowing, loading]);

  return { isFollowing, followerCount, followingCount, toggleFollow, loading };
}
