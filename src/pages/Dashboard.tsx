import { Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockUsers, mockCommunities, mockEvents } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold text-foreground">Hey, Alex! 👋</h1>
            <p className="text-xs text-muted-foreground">San Francisco, CA</p>
          </div>
          <div className="flex gap-2">
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-background" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-7">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {[
            { label: "Matches", value: "12", color: "text-primary" },
            { label: "Communities", value: "4", color: "text-secondary" },
            { label: "Events", value: "3", color: "text-accent-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl p-3 text-center shadow-card border border-border/50">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top Matches */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Top Matches</h2>
            <button onClick={() => navigate("/matches")} className="text-sm text-primary font-medium">See all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex-shrink-0 w-36 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => navigate(`/matches/${user.id}`)}
              >
                <img src={user.profileImage} alt={user.firstName} className="w-full h-32 object-cover" loading="lazy" />
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-foreground truncate">{user.firstName}, {user.age}</p>
                  <p className="text-xs text-muted-foreground">{user.distance} mi away</p>
                  <Badge className="mt-1.5 gradient-primary text-primary-foreground text-[10px] border-0">{user.matchScore}% match</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Upcoming Events</h2>
            <button className="text-sm text-primary font-medium">See all</button>
          </div>
          <div className="space-y-3">
            {mockEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="flex gap-3 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow">
                <img src={event.image} alt={event.name} className="w-24 h-24 object-cover" loading="lazy" />
                <div className="py-2.5 pr-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.date} · {event.time}</p>
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                  <p className="text-xs text-primary mt-1">{event.attendees} going</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Communities */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Recommended Communities</h2>
            <button onClick={() => navigate("/communities")} className="text-sm text-primary font-medium">See all</button>
          </div>
          <div className="space-y-3">
            {mockCommunities.slice(0, 2).map((c) => (
              <div key={c.id} className="flex gap-3 bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate(`/communities/${c.id}`)}>
                <img src={c.image} alt={c.name} className="w-24 h-24 object-cover" loading="lazy" />
                <div className="py-2.5 pr-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                    <span className="text-xs text-muted-foreground">{c.memberCount} members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
