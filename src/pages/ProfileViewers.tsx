import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowLeft, Eye, Lock, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Viewer {
  viewer_id: string;
  viewed_at: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

const ProfileViewers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const canView = hasFeature("profile_viewers");

  useEffect(() => {
    if (!user || !canView) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from("profile_views")
        .select("viewer_id, viewed_at")
        .eq("profile_user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const ids = data.map((d: any) => d.viewer_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_image_url")
          .in("user_id", ids);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setViewers(data.map((d: any) => ({
          ...d,
          ...(profileMap.get(d.viewer_id) || {}),
        })));
      }
      setLoading(false);
    };
    load();
  }, [user, canView]);

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Profile Viewers</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto">
        {!canView ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Pro Feature</h2>
            <p className="text-sm text-muted-foreground">Upgrade to Pro or Premium to see who viewed your profile.</p>
            <Button onClick={() => navigate("/settings/subscription")}>Upgrade Now</Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : viewers.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No one has viewed your profile yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {viewers.map((v) => {
              const name = `${v.first_name || ""} ${v.last_name || ""}`.trim() || "User";
              return (
                <button
                  key={v.viewer_id}
                  onClick={() => navigate(`/matches/${v.viewer_id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={v.profile_image_url || undefined} />
                    <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileViewers;
