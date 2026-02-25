import { useEffect, useState } from "react";
import { Bell, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  location_city: string | null;
  location_state: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [stats, setStats] = useState({ matches: 0, communities: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, eventsRes, communitiesRes, matchesRes, memberRes, attendeeRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, location_city, location_state").eq("user_id", user.id).maybeSingle(),
        supabase.from("events").select("*").eq("is_active", true).order("event_date", { ascending: true }).limit(3),
        supabase.from("communities").select("*").eq("is_active", true).order("member_count", { ascending: false }).limit(3),
        supabase.from("matches").select("id").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase.from("community_members").select("id").eq("user_id", user.id),
        supabase.from("event_attendees").select("id").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setEvents(eventsRes.data || []);
      setCommunities(communitiesRes.data || []);
      setStats({
        matches: matchesRes.data?.length || 0,
        communities: memberRes.data?.length || 0,
        events: attendeeRes.data?.length || 0,
      });
      setLoading(false);
    };

    load();
  }, [user]);

  const firstName = profile?.first_name || "there";

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
          <div>
            <h1 className="text-lg font-bold text-foreground">Hey, {firstName}! 👋</h1>
            {profile?.location_city && (
              <p className="text-xs text-muted-foreground">{profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ""}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-7">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {[
            { label: "Matches", value: stats.matches.toString(), color: "text-primary" },
            { label: "Communities", value: stats.communities.toString(), color: "text-secondary" },
            { label: "Events", value: stats.events.toString(), color: "text-accent-foreground" },
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
    </div>
  );
};

export default Dashboard;
