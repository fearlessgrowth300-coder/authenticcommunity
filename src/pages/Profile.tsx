import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, Share2, MapPin, Star, Users, Calendar, ChevronRight } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <div className="flex gap-2">
            <button className="text-muted-foreground"><Share2 className="h-5 w-5" /></button>
            <button onClick={() => navigate("/settings")} className="text-muted-foreground"><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-5">
        {/* Profile card */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5 text-center">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
            alt="Your profile"
            className="h-24 w-24 rounded-full object-cover mx-auto border-4 border-primary/20"
          />
          <h2 className="text-xl font-bold text-foreground mt-3">Alex Thompson, 29</h2>
          <div className="flex items-center justify-center gap-1 text-muted-foreground mt-0.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm">San Francisco, CA</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-sm text-foreground font-medium">4.9</span>
            <span className="text-sm text-muted-foreground">· 12 reviews · Verified</span>
          </div>
          <Button variant="outline" size="sm" className="mt-3">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
          </Button>
        </div>

        {/* Bio */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
          <p className="text-sm text-muted-foreground">
            Tech enthusiast who loves the outdoors. Always up for a hike, a good coffee, or trying new restaurants. Looking for genuine friendships and community.
          </p>
        </div>

        {/* Interests & Values */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {["Hiking", "Coffee", "Tech", "Cooking", "Photography", "Running"].map((i) => (
                <Badge key={i} variant="outline">{i}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Values</h3>
            <div className="flex flex-wrap gap-1.5">
              {["Authenticity", "Growth", "Community", "Kindness"].map((v) => (
                <Badge key={v} className="bg-accent text-accent-foreground border-0">{v}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats links */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 divide-y divide-border">
          {[
            { icon: Users, label: "My Connections", value: "24" },
            { icon: Users, label: "My Communities", value: "4" },
            { icon: Calendar, label: "My Events", value: "7" },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
              <span className="text-sm text-muted-foreground mr-1">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
