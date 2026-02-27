import { useEffect, useState } from "react";
import { Bell, Search, Loader2, Heart, X, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { WelcomeGuide } from "@/components/WelcomeGuide";
import { StoriesFeed } from "@/components/StoriesFeed";
import { PersonalizedActivityFeed } from "@/components/feed/PersonalizedActivityFeed";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  location_city: string | null;
  location_state: string | null;
  profile_image_url: string | null;
}

interface LikedProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [stats, setStats] = useState({ matches: 0, communities: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    return !localStorage.getItem("welcome_guide_seen");
  });
  const [showPushBanner, setShowPushBanner] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const pushBannerDismissedKey = user ? `push_banner_dismissed_${user.id}` : "push_banner_dismissed_guest";

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("welcome_guide_seen", "true");
  };

  // Show push notification banner if supported and not subscribed
  useEffect(() => {
    const dismissed = localStorage.getItem(pushBannerDismissedKey);
    if (isSubscribed) {
      setShowPushBanner(false);
      localStorage.setItem(pushBannerDismissedKey, "true");
      return;
    }

    if (!isSupported || permission === "denied" || dismissed) {
      setShowPushBanner(false);
      return;
    }

    setShowPushBanner(true);
  }, [isSupported, isSubscribed, permission, pushBannerDismissedKey]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, eventsRes, communitiesRes, matchesRes, memberRes, attendeeRes, notifsRes, likesRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, location_city, location_state, profile_image_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("events").select("*").eq("is_active", true).order("event_date", { ascending: true }).limit(3),
        supabase.from("communities").select("*").eq("is_active", true).order("member_count", { ascending: false }).limit(3),
        supabase.from("matches").select("id").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase.from("community_members").select("id").eq("user_id", user.id),
        supabase.from("event_attendees").select("id").eq("user_id", user.id),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
        supabase.from("user_likes").select("liked_id").eq("liker_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setEvents(eventsRes.data || []);
      setCommunities(communitiesRes.data || []);
      setStats({
        matches: matchesRes.data?.length || 0,
        communities: memberRes.data?.length || 0,
        events: attendeeRes.data?.length || 0,
      });
      setUnreadNotifs(notifsRes.count || 0);

      // Load liked profiles
      const likedIds = (likesRes.data || []).map((l: any) => l.liked_id);
      if (likedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_image_url")
          .in("user_id", likedIds);
        setLikedProfiles(profiles || []);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, profile_image_url, location_city")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .neq("user_id", user?.id || "")
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const firstName = profile?.first_name || "there";
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {showSearch ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-muted border-0 h-9"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary" onClick={() => navigate("/profile")}>
                  <AvatarImage src={profile?.profile_image_url || undefined} />
                  <AvatarFallback className="text-xs font-semibold">{initials || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Hey, {firstName}! 👋</h1>
                  {profile?.location_city && (
                    <p className="text-xs text-muted-foreground">{profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ""}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSearch(true)} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => navigate("/notifications")} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadNotifs > 99 ? "99+" : unreadNotifs}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Search Results */}
      {showSearch && (
        <div className="px-5 max-w-lg mx-auto">
          {searching && <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>}
          {searchResults.map((p) => (
            <button
              key={p.user_id}
              onClick={() => { navigate(`/matches/${p.user_id}`); setShowSearch(false); }}
              className="w-full flex items-center gap-3 py-3 border-b border-border/30 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {p.profile_image_url ? (
                  <img src={p.profile_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {(p.first_name?.[0] || "?").toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{p.first_name || ""} {p.last_name || ""}</p>
                {p.location_city && <p className="text-xs text-muted-foreground">{p.location_city}</p>}
              </div>
            </button>
          ))}
          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-center py-6 text-sm text-muted-foreground">No results for "{searchQuery}"</p>
          )}
        </div>
      )}

      {!showSearch && (
        <main className="px-5 py-5 max-w-lg mx-auto space-y-7">
          {/* Push Notification Banner */}
          {showPushBanner && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <BellRing className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Enable Push Notifications</p>
                <p className="text-xs text-muted-foreground">Get alerts for new matches, messages, and followers</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => { setShowPushBanner(false); localStorage.setItem(pushBannerDismissedKey, "true"); }}>
                  Later
                </Button>
                <Button size="sm" onClick={async () => {
                  const ok = await subscribe();
                  if (ok) {
                    setShowPushBanner(false);
                    localStorage.setItem(pushBannerDismissedKey, "true");
                    toast.success("Push notifications enabled");
                  } else if (Notification.permission === "denied") {
                    setShowPushBanner(false);
                    localStorage.setItem(pushBannerDismissedKey, "true");
                    toast.error("Notification permission denied. Enable it in browser settings.");
                  } else {
                    toast.error("Could not enable push notifications.");
                  }
                }}>
                  Enable
                </Button>
              </div>
            </div>
          )}

          {/* Stories */}
          <section>
            <StoriesFeed />
          </section>

          {/* Personalized activity feed */}
          <PersonalizedActivityFeed />

          {/* Liked Users horizontal scroller */}
          {likedProfiles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-destructive" /> People You Like
                </h2>
                <button onClick={() => navigate("/profile/liked")} className="text-sm text-primary font-medium">See all</button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {likedProfiles.map((p) => {
                  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "User";
                  return (
                    <button
                      key={p.user_id}
                      onClick={() => navigate(`/matches/${p.user_id}`)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                    >
                      <div className="h-14 w-14 rounded-full bg-muted overflow-hidden border-2 border-destructive/30">
                        {p.profile_image_url ? (
                          <img src={p.profile_image_url} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground truncate w-full text-center">{p.first_name || "User"}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {[
              { label: "Matches", value: stats.matches.toString(), color: "text-primary" },
              { label: "Communities", value: stats.communities.toString(), color: "text-secondary" },
              { label: "Events", value: stats.events.toString(), color: "text-tertiary" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl p-3 text-center shadow-card border border-border/50">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Upcoming Events</h2>
              <button onClick={() => navigate("/events")} className="text-sm text-primary font-medium">See all</button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex gap-3 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                  >
                    <img
                      src={event.event_image_url || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"}
                      alt={event.name}
                      className="w-24 h-24 object-cover"
                      loading="lazy"
                    />
                    <div className="py-2.5 pr-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                      {event.event_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(event.event_date + "T00:00:00"), "MMM d, yyyy")}
                          {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
                        </p>
                      )}
                      {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                      <p className="text-xs text-primary mt-1">{event.attendee_count || 0} going</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Communities */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Popular Communities</h2>
              <button onClick={() => navigate("/communities")} className="text-sm text-primary font-medium">See all</button>
            </div>
            {communities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No communities yet.</p>
            ) : (
              <div className="space-y-3">
                {communities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/communities/${c.id}`)}
                    className="flex gap-3 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                  >
                    <img
                      src={c.profile_image_url || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"}
                      alt={c.community_name}
                      className="w-24 h-24 object-cover"
                      loading="lazy"
                    />
                    <div className="py-2.5 pr-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.community_name}</p>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {c.category && <Badge variant="outline" className="text-[10px]">{c.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{c.member_count || 0} members</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
      <WelcomeGuide open={showGuide} onClose={closeGuide} />
    </div>
  );
};

export default Dashboard;
