import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Highlight {
  id: string;
  story_id: string;
  title: string;
  cover_url: string | null;
  story?: {
    content_type: string;
    content_url: string | null;
    text_content: string | null;
    background_color: string | null;
  };
}

interface StoryHighlightsProps {
  userId: string;
  isOwn: boolean;
}

export function StoryHighlights({ userId, isOwn }: StoryHighlightsProps) {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("story_highlights")
        .select("id, story_id, title, cover_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (!data || data.length === 0) return;

      // Fetch associated stories for covers
      const storyIds = data.map((h: any) => h.story_id);
      const { data: stories } = await supabase
        .from("stories")
        .select("id, content_type, content_url, text_content, background_color")
        .in("id", storyIds);

      const storyMap = new Map((stories || []).map((s: any) => [s.id, s]));
      
      setHighlights(data.map((h: any) => ({
        ...h,
        story: storyMap.get(h.story_id) || null,
      })));
    };
    load();
  }, [userId]);

  if (highlights.length === 0 && !isOwn) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {isOwn && (
        <button
          onClick={() => navigate("/stories/create")}
          className="flex flex-col items-center gap-1 min-w-[64px]"
        >
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-muted">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground">New</span>
        </button>
      )}
      {highlights.map((h) => {
        const coverImg = h.cover_url || h.story?.content_url;
        const bgColor = h.story?.background_color || "#3b82f6";
        
        return (
          <button
            key={h.id}
            onClick={() => navigate(`/stories/${h.story_id}`)}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div className="h-14 w-14 rounded-full border-2 border-border overflow-hidden">
              {coverImg ? (
                <img src={coverImg} alt={h.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: bgColor }}>
                  {h.story?.text_content?.slice(0, 2) || "📖"}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{h.title}</span>
          </button>
        );
      })}
    </div>
  );
}
