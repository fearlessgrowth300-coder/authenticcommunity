import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getStoryViewers } from "@/lib/stories";

const StoryViewers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getStoryViewers(id).then((v) => { setViewers(v); setLoading(false); });
  }, [id]);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Viewed by {viewers.length}</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : viewers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No viewers yet.</p>
        ) : (
          viewers.map((v) => {
            const p = v.profile;
            const initials = `${p?.first_name?.[0] || ""}${p?.last_name?.[0] || ""}`;
            return (
              <div key={v.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50 shadow-card">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p?.profile_image_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p?.first_name} {p?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(v.viewed_at))} ago</p>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default StoryViewers;
