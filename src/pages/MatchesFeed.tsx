import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, SlidersHorizontal, Loader2, MessageCircle, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccountRestrictions } from "@/hooks/useAccountRestrictions";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchDialog from "@/components/chat/MatchDialog";

interface ProfileCard {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  bio: string | null;
  profile_image_url: string | null;
  location_city: string | null;
  location_state: string | null;
  gender: string | null;
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
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [filterAge, setFilterAge] = useState<[number, number]>([18, 80]);
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; name: string; imageUrl: string | null; userId: string }>({ open: false, name: "", imageUrl: null, userId: "" });
  const { canInteract, restrictionMessage } = useAccountRestrictions();
  const { hasFeature } = useSubscription();

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profilesRes, likesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, first_name, last_name, age, bio, profile_image_url, location_city, location_state, gender")
          .neq("user_id", user.id)
          .eq("is_active", true)
          .eq("account_status", "active"),
        supabase
          .from("user_likes")
          .select("liked_id")
          .eq("liker_id", user.id),
      ]);

      const liked = new Set((likesRes.data || []).map((l: any) => l.liked_id));
      setLikedIds(liked);

      if (!profilesRes.data || profilesRes.data.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const userIds = profilesRes.data.map((p) => p.user_id);
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

      const cards: ProfileCard[] = profilesRes.data.map((p) => ({
        ...p,
        interests: interestsMap.get(p.user_id) || [],
        values: valuesMap.get(p.user_id) || [],
      }));

      setProfiles(cards);
      setLoading(false);
    };

    load();
  }, [user]);

  const filteredProfiles = profiles.filter((p) => {
    if (p.age && (p.age < filterAge[0] || p.age > filterAge[1])) return false;
    if (filterGender !== "all" && p.gender?.toLowerCase() !== filterGender.toLowerCase()) return false;
    if (filterLocation !== "all" && p.location_city?.toLowerCase() !== filterLocation.toLowerCase()) return false;
    return true;
  });

  const currentProfile = filteredProfiles[currentIndex];

  const handleLike = async (userId: string) => {
    if (!user) return;
    if (!canInteract) {
      toast.error(restrictionMessage || "This action is disabled for your account.");
      return;
    }
    try {
      if (likedIds.has(userId)) {
        await supabase.from("user_likes").delete().eq("liker_id", user.id).eq("liked_id", userId);
        setLikedIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
        toast.success("Unliked");
      } else {
        await supabase.from("user_likes").insert({ liker_id: user.id, liked_id: userId });
        setLikedIds((prev) => new Set(prev).add(userId));

        // Check if mutual like
        const { data: mutualLike } = await supabase
          .from("user_likes")
          .select("id")
          .eq("liker_id", userId)
          .eq("liked_id", user.id)
          .maybeSingle();

        if (mutualLike) {
          const matchedProfile = profiles.find((p) => p.user_id === userId);
          setMatchDialog({
            open: true,
            name: `${matchedProfile?.first_name || ""} ${matchedProfile?.last_name || ""}`.trim() || "User",
            imageUrl: matchedProfile?.profile_image_url || null,
            userId,
          });
        } else {
          toast.success("Liked! ❤️");
        }
      }
    } catch {
      toast.error("Failed to update like");
    }
  };

  const handleAction = async (action: "like" | "pass") => {
    if (!currentProfile) return;
    if (!canInteract) {
      toast.error(restrictionMessage || "This action is disabled for your account.");
      return;
    }
    if (action === "like") {
      await handleLike(currentProfile.user_id);
    }
    setDirection(action === "like" ? "right" : "left");
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next >= filteredProfiles.length ? 0 : next;
      });
      setDirection(null);
    }, 300);
  };

  const fetchAiSuggestions = async () => {
    if (!user) return;
    if (!hasFeature("ai_insights")) {
      toast.error("AI Match Insights is a Premium feature. Upgrade to unlock!");
      return;
    }
    setLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-suggestions");
      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI suggestions");
    } finally {
      setLoadingAi(false);
    }
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
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/profile/liked")}
              className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
            >
              <Heart className="h-4 w-4 text-destructive" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAiSuggestions}
              disabled={loadingAi}
              className="text-xs"
            >
              {loadingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              AI Match
            </Button>
            <button
              onClick={() => setShowFilter(true)}
              className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="px-5 pt-4 max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> AI-Powered Matches
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
            {aiSuggestions.map((s) => (
              <div
                key={s.user_id}
                className="flex-shrink-0 w-44 bg-card rounded-xl border border-border/50 p-3 text-left hover:shadow-card-hover transition-shadow"
              >
                <button
                  onClick={() => navigate(`/matches/${s.user_id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <span className="text-[10px] font-bold text-primary">{s.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{s.reason}</p>
                  {s.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.interests.slice(0, 2).map((i: string) => (
                        <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{i}</Badge>
                      ))}
                    </div>
                  )}
                </button>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => handleLike(s.user_id)}
                    className="flex-1 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Heart className={cn("h-3.5 w-3.5", likedIds.has(s.user_id) ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                  </button>
                    <button
                      onClick={() => {
                        if (!canInteract) {
                          toast.error(restrictionMessage || "This action is disabled for your account.");
                          return;
                        }
                        navigate(`/messages/${s.user_id}`);
                      }}
                    className="flex-1 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="px-5 py-5 max-w-lg mx-auto">
        {filteredProfiles.length === 0 ? (
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
                  onClick={() => {
                    if (!canInteract) {
                      toast.error(restrictionMessage || "This action is disabled for your account.");
                      return;
                    }
                    navigate(`/messages/${currentProfile.user_id}`);
                  }}
                className="h-12 w-12 rounded-full bg-card shadow-card border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-colors active:scale-95"
              >
                <MessageCircle className="h-5 w-5 text-primary" />
              </button>
              <button
                onClick={() => handleAction("like")}
                className={cn(
                  "h-16 w-16 rounded-full shadow-soft flex items-center justify-center hover:opacity-90 transition-all active:scale-95",
                  likedIds.has(currentProfile.user_id) ? "bg-destructive" : "gradient-primary"
                )}
              >
                <Heart className={cn("h-7 w-7 text-primary-foreground", likedIds.has(currentProfile.user_id) && "fill-primary-foreground")} />
              </button>
            </div>
          </>
        ) : null}
      </main>

      {/* Filter Dialog */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Advanced Filters</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <Label>Age Range: {filterAge[0]} - {filterAge[1]}</Label>
              <Slider
                min={18}
                max={80}
                step={1}
                value={filterAge}
                onValueChange={(v) => setFilterAge(v as [number, number])}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-Binary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {[...new Set(profiles.map((p) => p.location_city).filter(Boolean))].map((city) => (
                    <SelectItem key={city!} value={city!}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => { setCurrentIndex(0); setShowFilter(false); }}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Match Dialog */}
      <MatchDialog
        open={matchDialog.open}
        onOpenChange={(open) => setMatchDialog((prev) => ({ ...prev, open }))}
        matchedUser={matchDialog}
        onMessage={() => {
          setMatchDialog((prev) => ({ ...prev, open: false }));
          navigate(`/messages/${matchDialog.userId}`);
        }}
      />
    </div>
  );
};

export default MatchesFeed;
