import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Eye, Loader2, Send, Bookmark } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveStories, recordStoryView, likeStory, unlikeStory, checkIfLiked,
  replyToStory, deleteStory, shareStory, shareStoryTo
} from "@/lib/stories";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    getActiveStories().then((all) => {
      setStories(all);
      const idx = all.findIndex((s: any) => s.id === id);
      setCurrentIdx(idx >= 0 ? idx : 0);
      setLoading(false);
    });
  }, [id]);

  const story = stories[currentIdx];

  useEffect(() => {
    if (!story) return;
    recordStoryView(story.id);
    checkIfLiked(story.id).then(setLiked);

    // Auto-advance timer (5s for text/image, full duration for video)
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
      navigate(-1);
    }
  }, [currentIdx, stories.length, navigate]);

  const goPrev = () => {
    if (currentIdx > 0) { setCurrentIdx((i) => i - 1); setProgress(0); }
  };

  const handleLike = async () => {
    if (!story) return;
    try {
      if (liked) { await unlikeStory(story.id); setLiked(false); }
      else { await likeStory(story.id); setLiked(true); }
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

  const handleDelete = async () => {
    if (!story) return;
    await deleteStory(story.id);
    toast.success("Story deleted");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (!story) {
    navigate(-1);
    return null;
  }

  const isOwn = story.user_id === user?.id;
  const profile = story.profile;
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`;
  const expiresIn = formatDistanceToNow(new Date(story.expires_at), { addSuffix: false });

  return (
    <div className="fixed inset-0 z-50 bg-foreground flex flex-col" onClick={(e) => {
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
            <p className="text-xs font-semibold text-primary-foreground">{profile?.first_name || "User"}</p>
            <p className="text-[10px] text-primary-foreground/70">{formatDistanceToNow(new Date(story.created_at))} ago · {expiresIn} left</p>
          </div>
        </div>
        <button onClick={() => navigate(-1)}><X className="h-6 w-6 text-primary-foreground" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {story.content_type === "text" && (
          <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: story.background_color || "#3b82f6" }}>
            <p className="text-xl md:text-2xl font-semibold text-center" style={{ color: "white" }}>{story.text_content}</p>
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
            <Heart className={cn("h-6 w-6", liked ? "fill-secondary text-secondary" : "text-primary-foreground")} />
          </button>
          <button onClick={() => setShowReply(true)}>
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          </button>
          <button onClick={() => setShowShare(true)}>
            <Share2 className="h-6 w-6 text-primary-foreground" />
          </button>
        </div>
        <div className="flex gap-4">
          {isOwn && (
            <button onClick={() => navigate(`/stories/${story.id}/viewers`)}>
              <Eye className="h-6 w-6 text-primary-foreground" />
            </button>
          )}
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
            {isOwn && (
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Delete Story
              </Button>
            )}
            {isOwn && (
              <Button variant="outline" className="w-full" onClick={() => { navigate(`/stories/${story.id}/replies`); setShowMore(false); }}>
                <MessageCircle className="h-4 w-4 mr-2" />View Replies
              </Button>
            )}
            {isOwn && (
              <Button variant="outline" className="w-full" onClick={() => { navigate(`/stories/${story.id}/viewers`); setShowMore(false); }}>
                <Eye className="h-4 w-4 mr-2" />View Viewers
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryViewer;
