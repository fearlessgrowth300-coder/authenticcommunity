import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockUsers } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MatchesFeed = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentUser = mockUsers[currentIndex];

  const handleAction = (action: "like" | "pass") => {
    setDirection(action === "like" ? "right" : "left");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mockUsers.length);
      setDirection(null);
    }, 300);
  };

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
        {currentUser && (
          <div
            className={cn(
              "relative bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden transition-all duration-300",
              direction === "left" && "opacity-0 -translate-x-16 rotate-[-8deg]",
              direction === "right" && "opacity-0 translate-x-16 rotate-[8deg]"
            )}
          >
            <div className="relative cursor-pointer" onClick={() => navigate(`/matches/${currentUser.id}`)}>
              <img src={currentUser.profileImage} alt={currentUser.firstName} className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-card">{currentUser.firstName}, {currentUser.age}</h2>
                  {currentUser.online && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-card/70" />
                  <span className="text-sm text-card/80">{currentUser.city} · {currentUser.distance} mi</span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <Badge className="gradient-primary text-primary-foreground border-0 mb-3">{currentUser.matchScore}% Match</Badge>
              <p className="text-sm text-muted-foreground mb-3">{currentUser.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.interests.map((i) => (
                  <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => handleAction("pass")}
            className="h-14 w-14 rounded-full bg-card shadow-card border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors active:scale-95"
          >
            <X className="h-6 w-6 text-destructive" />
          </button>
          <button
            onClick={() => handleAction("like")}
            className="h-16 w-16 rounded-full gradient-primary shadow-soft flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
          >
            <Heart className="h-7 w-7 text-primary-foreground" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default MatchesFeed;
