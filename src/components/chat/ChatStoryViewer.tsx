import { useEffect, useState, useCallback } from "react";
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Eye, Loader2, Send, Download, RefreshCw, Bookmark } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  recordStoryView, likeStory, unlikeStory, checkIfLiked,
  replyToStory, deleteStory, shareStory, shareStoryTo,
  createImageStory,
} from "@/lib/stories";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ChatStoryViewerProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const ChatStoryViewer = ({ userId, userName, onClose }: ChatStoryViewerProps) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadStories = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, profile_image_url")
        .eq("user_id", userId);

      const profile = profiles?.[0] || null;
      setStories((data || []).map((s: any) => ({ ...s, profile })));
      setLoading(false);
    };
    loadStories();
  }, [userId]);

  const story = stories[currentIdx];

  useEffect(() => {
    if (!story) return;
    recordStoryView(story.id);
    checkIfLiked(story.id).then(setLiked);

    const duration = story.content_type === "video" ? 15000 : 5000;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(timer);
        goNext();
      }
    }, interval);
    return () => clearInterval(timer);
  }, [currentIdx, stories]);

  const goNext = useCallback(() => {
    if (currentIdx < stories.length - 1) {
      setCurrentIdx((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIdx, stories.length, onClose]);

  const goPrev = () => {
    if (currentIdx > 0) { setCurrentIdx((i) => i - 1); setProgress(0); }
  };

  const handleLike = async () => {
    if (!story) return;
    try {
      if (liked) { await unlikeStory(story.id); setLiked(false); toast.success("Unliked"); }
      else { await likeStory(story.id); setLiked(true); toast.success("Liked!"); }
    } catch { toast.error("Failed"); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !story) return;
    try {
      await replyToStory(story.id, replyText);
      setReplyText("");
      setShowReply(false);
      toast.success("Reply sent!");
    } catch { toast.error("Failed to reply"); }
  };

  const handleSaveToPhone = async () => {
    if (!story) return;
    if (story.content_type === "text") {
      toast.info("Text stories can't be saved as images");
      return;
    }
    try {
      const response = await fetch(story.content_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${story.id}.${story.content_type === "video" ? "mp4" : "jpg"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Saved to device!");
    } catch { toast.error("Failed to save"); }
  };

  const handleReshare = async () => {
    if (!story || !user) return;
    try {
      if (story.content_type === "text") {
        // Reshare text story by creating a new one with same content
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;
        await supabase.from("stories").insert({
          user_id: currentUser.id,
          content_type: "text",
          text_content: story.text_content,
          background_color: story.background_color,
        });
      } else if (story.content_url) {
        // Download and re-upload as own story
        const response = await fetch(story.content_url);
        const blob = await response.blob();
        const file = new File([blob], `reshared.${story.content_type === "video" ? "mp4" : "jpg"}`, { type: blob.type });
        await createImageStory(file);
      }
      toast.success("Reshared to your stories!");
      setShowMore(false);
    } catch { toast.error("Failed to reshare"); }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] bg-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (!story || stories.length === 0) {
    onClose();
    return null;
  }

  const isOwn = story.user_id === user?.id;
  const profile = story.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`;

  return (
    <div className="fixed inset-0 z-[70] bg-foreground flex flex-col" onClick={(e) => {
      const x = (e as any).clientX;
      const w = window.innerWidth;
      if (x < w / 3) goPrev();
      else if (x > (w * 2) / 3) goNext();
    }}>
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-2 pt-2">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-primary-foreground/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-foreground rounded-full transition-all duration-75"
              style={{ width: i < currentIdx ? "100%" : i === currentIdx ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-primary-foreground/30">
            <AvatarImage src={profile?.profile_image_url || undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-semibold text-primary-foreground">{userName}</p>
            <p className="text-[10px] text-primary-foreground/70">
              {formatDistanceToNow(new Date(story.created_at))} ago
            </p>
          </div>
        </div>
        <button onClick={onClose}><X className="h-6 w-6 text-primary-foreground" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {story.content_type === "text" && (
          <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: story.background_color || "#3b82f6" }}>
            <p className="text-xl md:text-2xl font-semibold text-center text-white">{story.text_content}</p>
          </div>
        )}
        {story.content_type === "image" && (
          <img src={story.content_url} alt="Story" className="w-full h-full object-contain" />
        )}
        {story.content_type === "video" && (
          <video src={story.content_url} autoPlay muted className="w-full h-full object-contain" />
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4">
          <button onClick={handleLike}>
            <Heart className={cn("h-6 w-6", liked ? "fill-red-500 text-red-500" : "text-primary-foreground")} />
          </button>
          <button onClick={() => setShowReply(true)}>
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          </button>
          <button onClick={() => setShowShare(true)}>
            <Share2 className="h-6 w-6 text-primary-foreground" />
          </button>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSaveToPhone}>
            <Download className="h-6 w-6 text-primary-foreground" />
          </button>
          <button onClick={() => setShowMore(true)}>
            <MoreHorizontal className="h-6 w-6 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Reply dialog */}
      <Dialog open={showReply} onOpenChange={setShowReply}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Reply to story</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type a reply..." onKeyDown={(e) => e.key === "Enter" && handleReply()} />
            <Button size="icon" onClick={handleReply}><Send className="h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Share story</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {["whatsapp", "facebook", "twitter", "email", "copy"].map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => { shareStoryTo(story.id, p); toast.success(p === "copy" ? "Link copied!" : "Opening..."); setShowShare(false); }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* More options */}
      <Dialog open={showMore} onOpenChange={setShowMore}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Options</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleSaveToPhone}>
              <Download className="h-4 w-4 mr-2" />Save to device
            </Button>
            <Button variant="outline" className="w-full" onClick={async () => {
              if (!user || !story) return;
              try {
                await (supabase as any).from("story_highlights").insert({
                  user_id: user.id,
                  story_id: story.id,
                  title: story.text_content?.slice(0, 20) || "Highlight",
                  cover_url: story.content_url || null,
                });
                toast.success("Saved to highlights!");
                setShowMore(false);
              } catch { toast.error("Failed to save"); }
            }}>
              <Bookmark className="h-4 w-4 mr-2" />Save to Highlights
            </Button>
            {!isOwn && (
              <Button variant="outline" className="w-full" onClick={handleReshare}>
                <RefreshCw className="h-4 w-4 mr-2" />Reshare to your stories
              </Button>
            )}
            {isOwn && (
              <>
                <Button variant="destructive" className="w-full" onClick={async () => { await deleteStory(story.id); toast.success("Deleted"); onClose(); }}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete Story
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setShowMore(false); }}>
                  <Eye className="h-4 w-4 mr-2" />View Viewers
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatStoryViewer;
