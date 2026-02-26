import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getActiveStories } from "@/lib/stories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface StoryGroup {
  user_id: string;
  profile: { first_name: string | null; last_name: string | null; profile_image_url: string | null } | null;
  stories: any[];
}

function groupStories(stories: any[], currentUserId?: string): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const s of stories) {
    if (!map.has(s.user_id)) {
      map.set(s.user_id, { user_id: s.user_id, profile: s.profile, stories: [] });
    }
    map.get(s.user_id)!.stories.push(s);
  }
  const arr = Array.from(map.values());
  const myIdx = arr.findIndex((g) => g.user_id === currentUserId);
  if (myIdx > 0) {
    const [mine] = arr.splice(myIdx, 1);
    arr.unshift(mine);
  }
  return arr;
}

export function StoriesFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [allStories, setAllStories] = useState<any[]>([]);

  // Initial fetch
  useEffect(() => {
    getActiveStories().then((stories) => {
      setAllStories(stories);
      setGroups(groupStories(stories, user?.id));
    });
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("stories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stories" },
        () => {
          // Refetch on any change
          getActiveStories().then((stories) => {
            setAllStories(stories);
            setGroups(groupStories(stories, user?.id));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {/* Add story */}
      <button
        onClick={() => navigate("/stories/create")}
        className="flex flex-col items-center gap-1.5 min-w-[68px]"
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/40">
            <Plus className="h-6 w-6 text-primary" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">Add Story</span>
      </button>

      {groups.map((group) => {
        const initials = `${group.profile?.first_name?.[0] || ""}${group.profile?.last_name?.[0] || ""}`;
        const isMe = group.user_id === user?.id;
        return (
          <button
            key={group.user_id}
            onClick={() => navigate(`/stories/${group.stories[0].id}`)}
            className="flex flex-col items-center gap-1.5 min-w-[68px]"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-br from-primary via-tertiary to-secondary">
                <Avatar className="h-full w-full border-2 border-card">
                  <AvatarImage src={group.profile?.profile_image_url || undefined} />
                  <AvatarFallback className="text-xs font-semibold">{initials || "?"}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] font-medium text-foreground truncate max-w-[64px]">
              {isMe ? "Your Story" : group.profile?.first_name || "User"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
