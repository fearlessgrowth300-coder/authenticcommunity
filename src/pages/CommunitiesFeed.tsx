import { useNavigate } from "react-router-dom";
import { mockCommunities } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, MapPin, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = ["All", "Outdoors", "Food & Drink", "Arts & Culture", "Wellness", "Tech", "Social"];

const CommunitiesFeed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto mb-3">
          <h1 className="text-lg font-bold text-foreground">Communities</h1>
          <button className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities..." className="pl-10 bg-muted border-0" />
        </div>
      </header>

      <main className="px-5 py-4 max-w-lg mx-auto">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide mb-4">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                i === 0
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Communities list */}
        <div className="space-y-3">
          {mockCommunities.map((c) => (
            <div
              key={c.id}
              className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
              onClick={() => navigate(`/communities/${c.id}`)}
            >
              <img src={c.image} alt={c.name} className="w-full h-36 object-cover" loading="lazy" />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="text-xs">{c.category}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {c.memberCount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {c.distance} mi
                  </div>
                  <Button size="sm" variant="gradient" className="ml-auto text-xs h-7">Join</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CommunitiesFeed;
