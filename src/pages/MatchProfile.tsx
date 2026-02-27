import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, MessageCircle, Heart, Star, Shield, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MatchDialog from "@/components/chat/MatchDialog";

interface ProfileData {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  bio: string | null;
  profile_image_url: string | null;
  location_city: string | null;
  location_state: string | null;
}

const MatchProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [matchDialog, setMatchDialog] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [profileRes, interestsRes, valuesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name, age, bio, profile_image_url, location_city, location_state").eq("user_id", id).maybeSingle(),
        supabase.from("user_interests").select("interest_name").eq("user_id", id),
        supabase.from("user_values").select("value_name").eq("user_id", id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setInterests(interestsRes.data?.map((i) => i.interest_name) || []);
      setValues(valuesRes.data?.map((v) => v.value_name) || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // Check if already liked
  useEffect(() => {
    if (!user || !id) return;
    supabase.from("user_likes").select("id").eq("liker_id", user.id).eq("liked_id", id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, id]);

  const handleLike = async () => {
    if (!user || !id) return;
    try {
      if (liked) {
        await supabase.from("user_likes").delete().eq("liker_id", user.id).eq("liked_id", id);
        setLiked(false);
        toast.success("Unliked");
      } else {
        await supabase.from("user_likes").insert({ liker_id: user.id, liked_id: id });
        setLiked(true);

        // Check mutual
        const { data: mutualLike } = await supabase
          .from("user_likes")
          .select("id")
          .eq("liker_id", id)
          .eq("liked_id", user.id)
          .maybeSingle();

        if (mutualLike) {
          setMatchDialog(true);
        } else {
          toast.success("Liked! ❤️");
        }
      }
    } catch {
      toast.error("Failed to update like");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Button variant="outline" onClick={() => navigate("/matches")}>Back to Discover</Button>
      </div>
    );
  }

  const displayName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="relative">
        {profile.profile_image_url ? (
          <img src={profile.profile_image_url} alt={displayName} className="w-full h-80 object-cover" />
        ) : (
          <div className="w-full h-80 bg-muted flex items-center justify-center text-6xl font-bold text-muted-foreground">
            {(profile.first_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/profile/${id}`;
            if (navigator.share) {
              navigator.share({ title: displayName, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
              toast.success("Link copied!");
            }
          }}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="h-4 w-4 text-foreground" />
        </button>
      </div>

      <main className="px-5 -mt-12 relative z-10 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {displayName}{profile.age ? `, ${profile.age}` : ""}
              </h1>
              {(profile.location_city || profile.location_state) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm">
                    {profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>}

          {interests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <Badge key={i} variant="outline">{i}</Badge>
                ))}
              </div>
            </div>
          )}

          {values.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Values</h3>
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <Badge key={v} className="bg-accent text-accent-foreground border-0">{v}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Authenticity */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Authenticity</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 text-primary fill-primary" />
                ))}
              </div>
              <Shield className="h-4 w-4 text-primary ml-auto" />
              <span className="text-xs text-primary font-medium">Verified</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="gradient" size="lg" className="flex-1" onClick={() => navigate(`/messages/${id}`)}>
              <MessageCircle className="h-4 w-4 mr-2" /> Message
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={handleLike}
              className={cn(liked && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            </Button>
          </div>
        </div>
      </main>

      <MatchDialog
        open={matchDialog}
        onOpenChange={setMatchDialog}
        matchedUser={{ name: displayName, imageUrl: profile.profile_image_url, userId: id! }}
        onMessage={() => {
          setMatchDialog(false);
          navigate(`/messages/${id}`);
        }}
      />
    </div>
  );
};

export default MatchProfile;
