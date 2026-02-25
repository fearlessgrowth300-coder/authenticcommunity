import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, SlidersHorizontal, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCard {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  bio: string | null;
  profile_image_url: string | null;
  location_city: string | null;
  location_state: string | null;
  interests: string[];
  values: string[];
}

const MatchesFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get all profiles except current user
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, age, bio, profile_image_url, location_city, location_state")
        .neq("user_id", user.id)
        .eq("is_active", true);

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get interests and values for all users
      const userIds = profilesData.map((p) => p.user_id);
      const [interestsRes, valuesRes] = await Promise.all([
        supabase.from("user_interests").select("user_id, interest_name").in("user_id", userIds),
        supabase.from("user_values").select("user_id, value_name").in("user_id", userIds),
      ]);

      const interestsMap = new Map<string, string[]>();
      interestsRes.data?.forEach((i) => {
        if (!interestsMap.has(i.user_id)) interestsMap.set(i.user_id, []);
        interestsMap.get(i.user_id)!.push(i.interest_name);
      });

      const valuesMap = new Map<string, string[]>();
      valuesRes.data?.forEach((v) => {
        if (!valuesMap.has(v.user_id)) valuesMap.set(v.user_id, []);
        valuesMap.get(v.user_id)!.push(v.value_name);
      });

      const cards: ProfileCard[] = profilesData.map((p) => ({
        ...p,
        interests: interestsMap.get(p.user_id) || [],
        values: valuesMap.get(p.user_id) || [],
      }));

      setProfiles(cards);
      setLoading(false);
    };

    load();
  }, [user]);

  const currentProfile = profiles[currentIndex];

  const handleAction = (action: "like" | "pass") => {
    setDirection(action === "like" ? "right" : "left");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
      setDirection(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground">Discover</h1>
          <button className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto">
        {profiles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No profiles to discover yet. Check back soon!</p>
          </div>
        ) : currentProfile ? (
          <>
            <div
              className={cn(
                "relative bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden transition-all duration-300",
                direction === "left" && "opacity-0 -translate-x-16 rotate-[-8deg]",
                direction === "right" && "opacity-0 translate-x-16 rotate-[8deg]"
              )}
            >
              <div className="relative cursor-pointer" onClick={() => navigate(`/matches/${currentProfile.user_id}`)}>
                {currentProfile.profile_image_url ? (
                  <img src={currentProfile.profile_image_url} alt={currentProfile.first_name || "User"} className="w-full h-80 object-cover" />
                ) : (
                  <div className="w-full h-80 bg-muted flex items-center justify-center text-5xl font-bold text-muted-foreground">
                    {(currentProfile.first_name?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-2xl font-bold text-card">
                    {currentProfile.first_name || "User"}
                    {currentProfile.age ? `, ${currentProfile.age}` : ""}
                  </h2>
                  {currentProfile.location_city && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-card/70" />
                      <span className="text-sm text-card/80">
                        {currentProfile.location_city}
                        {currentProfile.location_state ? `, ${currentProfile.location_state}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                {currentProfile.bio && (
                  <p className="text-sm text-muted-foreground mb-3">{currentProfile.bio}</p>
                )}
                {currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentProfile.interests.map((i) => (
                      <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 mt-6">
              <button
                onClick={() => handleAction("pass")}
                className="h-14 w-14 rounded-full bg-card shadow-card border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors active:scale-95"
              >
                <X className="h-6 w-6 text-destructive" />
              </button>
              <button
                onClick={() => navigate(`/messages/${currentProfile.user_id}`)}
                className="h-12 w-12 rounded-full bg-card shadow-card border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-colors active:scale-95"
              >
                <MessageCircle className="h-5 w-5 text-primary" />
              </button>
              <button
                onClick={() => handleAction("like")}
                className="h-16 w-16 rounded-full gradient-primary shadow-soft flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
              >
                <Heart className="h-7 w-7 text-primary-foreground" />
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default MatchesFeed;
