import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Loader2, Image as ImageIcon, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommunityFeedProps {
  communityId: string;
  isMember: boolean;
}

interface Post {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

const CommunityFeed = ({ communityId, isMember }: CommunityFeedProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      // Fetch profiles for posts
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, profile_image_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const enriched = data.map((p) => ({ ...p, profile: profileMap.get(p.user_id) }));
      setPosts(enriched);

      // Check which posts user has liked
      if (user) {
        const postIds = data.map((p) => p.id);
        if (postIds.length > 0) {
          const { data: likes } = await supabase
            .from("community_post_likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds);
          setLikedPosts(new Set((likes || []).map((l) => l.post_id)));
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, [communityId]);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      community_id: communityId,
      user_id: user.id,
      content: newPost.trim(),
    });
    if (error) toast.error("Failed to post");
    else { setNewPost(""); loadPosts(); }
    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    if (likedPosts.has(postId)) {
      await supabase.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from("community_post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedPosts((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const loadComments = async (postId: string) => {
    if (expandedComments === postId) { setExpandedComments(null); return; }
    setExpandedComments(postId);
    setCommentsLoading(true);
    const { data } = await supabase
      .from("community_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setComments(data.map((c) => ({ ...c, profile: profileMap.get(c.user_id) })));
    }
    setCommentsLoading(false);
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim() || !user) return;
    await supabase.from("community_post_comments").insert({ post_id: postId, user_id: user.id, content: newComment.trim() });
    setNewComment("");
    loadComments(postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Create post */}
      {isMember && (
        <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
          <Textarea
            placeholder="Share something with the community..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button variant="gradient" size="sm" onClick={handlePost} disabled={!newPost.trim() || posting}>
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No posts yet. Be the first to share!</p>
      ) : posts.map((post) => (
        <div key={post.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
          {/* Post header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            {post.profile?.profile_image_url ? (
              <img src={post.profile.profile_image_url} className="h-9 w-9 rounded-full object-cover" alt="" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {getName(post.profile)[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{getName(post.profile)}</p>
              <p className="text-[10px] text-muted-foreground">{format(new Date(post.created_at), "MMM d, h:mm a")}</p>
            </div>
            {post.user_id === user?.id && (
              <button
                onClick={async () => {
                  await supabase.from("community_posts").delete().eq("id", post.id);
                  setPosts((prev) => prev.filter((p) => p.id !== post.id));
                }}
                className="text-muted-foreground hover:text-destructive p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Post content */}
          <div className="px-4 pb-3">
            {post.title && <h4 className="text-sm font-semibold text-foreground mb-1">{post.title}</h4>}
            <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.image_url && (
            <img src={post.image_url} className="w-full max-h-64 object-cover" alt="" />
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/50">
            <button onClick={() => handleLike(post.id)} className={cn("flex items-center gap-1 text-xs", likedPosts.has(post.id) ? "text-destructive" : "text-muted-foreground")}>
              <Heart className={cn("h-4 w-4", likedPosts.has(post.id) && "fill-current")} />
              {post.likes_count || 0}
            </button>
            <button onClick={() => loadComments(post.id)} className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {post.comments_count || 0}
            </button>
          </div>

          {/* Comments section */}
          {expandedComments === post.id && (
            <div className="border-t border-border/50 bg-muted/30 px-4 py-3 space-y-3">
              {commentsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">No comments yet</p>
              ) : comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                    {getName(c.profile)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs"><span className="font-medium text-foreground">{getName(c.profile)}</span> <span className="text-muted-foreground">{c.content}</span></p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
              {isMember && (
                <div className="flex gap-2 pt-1">
                  <input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleComment(post.id); }}
                    className="flex-1 bg-background rounded-lg px-3 py-1.5 text-xs border border-border outline-none"
                  />
                  <button onClick={() => handleComment(post.id)} disabled={!newComment.trim()} className="text-primary disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommunityFeed;
