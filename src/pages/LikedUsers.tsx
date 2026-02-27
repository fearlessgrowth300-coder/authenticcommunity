import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Heart, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikedUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  age: number | null;
  location_city: string | null;
  isMutual?: boolean;
}

const LikedUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: likes } = await supabase
        .from("user_likes")
        .select("liked_id")
        .eq("liker_id", user.id)
        .order("created_at", { ascending: false });

      if (!likes || likes.length === 0) {
        setLikedUsers([]);
        setLoading(false);
        return;
      }

      const ids = likes.map((l: any) => l.liked_id);
      const [profilesRes, mutualRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_image_url, age, location_city")
          .in("user_id", ids),
        supabase
          .from("user_likes")
          .select("liker_id")
          .eq("liked_id", user.id)
          .in("liker_id", ids),
      ]);

      const mutualIds = new Set((mutualRes.data || []).map((m: any) => m.liker_id));
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
      const ordered = ids.map((id) => {
        const p = profileMap.get(id);
        return p ? { ...p, isMutual: mutualIds.has(id) } : null;
      }).filter(Boolean) as LikedUser[];
      // Sort mutuals first
      ordered.sort((a, b) => (b.isMutual ? 1 : 0) - (a.isMutual ? 1 : 0));
      setLikedUsers(ordered);
      setLoading(false);
    };

    load();
  }, [user]);

  const handleUnlike = async (userId: string) => {
    if (!user) return;
    await supabase.from("user_likes").delete().eq("liker_id", user.id).eq("liked_id", userId);
    setLikedUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Liked Users</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : likedUsers.length === 0 ? (
          <div className="text-center py-16 px-5">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">You haven't liked anyone yet.</p>
            <button onClick={() => navigate("/matches")} className="text-primary text-sm font-medium mt-2">
              Start Discovering
            </button>
          </div>
        ) : (
          likedUsers.map((u) => {
            const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "User";
            return (
              <div
                key={u.user_id}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 hover:bg-muted/50 transition-colors"
              >
              <button
                onClick={() => navigate(`/matches/${u.user_id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="relative flex-shrink-0">
                  {u.profile_image_url ? (
                    <img src={u.profile_image_url} alt={name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  {u.isMutual && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                      <Heart className="h-2.5 w-2.5 fill-primary-foreground text-primary-foreground" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {name}{u.age ? `, ${u.age}` : ""}
                    </p>
                    {u.isMutual && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Match!</span>
                    )}
                  </div>
                  {u.location_city && (
                    <p className="text-xs text-muted-foreground truncate">{u.location_city}</p>
                  )}
                </div>
                </button>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/messages/${u.user_id}`)}
                    className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={() => handleUnlike(u.user_id)}
                    className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default LikedUsers;
