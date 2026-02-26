import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getStoryReplies, replyToStory, deleteStoryReply } from "@/lib/stories";

const StoryReplies = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [replies, setReplies] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    getStoryReplies(id).then((r) => { setReplies(r); setLoading(false); });
  };

  useEffect(load, [id]);

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    try {
      await replyToStory(id, text);
      setText("");
      load();
    } catch { toast.error("Failed to send reply"); }
  };

  const handleDelete = async (replyId: string) => {
    await deleteStoryReply(replyId);
    load();
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Replies</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : replies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No replies yet.</p>
        ) : (
          replies.map((r) => {
            const p = r.profile;
            const initials = `${p?.first_name?.[0] || ""}${p?.last_name?.[0] || ""}`;
            return (
              <div key={r.id} className="flex gap-3 bg-card rounded-xl p-3 border border-border/50 shadow-card">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p?.profile_image_url || undefined} />
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{p?.first_name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at))} ago</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.message}</p>
                </div>
                {r.user_id === user?.id && (
                  <button onClick={() => handleDelete(r.id)} className="text-destructive self-start"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            );
          })
        )}
      </main>

      <div className="fixed bottom-[var(--nav-height)] left-0 right-0 bg-background border-t border-border px-5 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
          <Button size="icon" onClick={handleSend}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default StoryReplies;
