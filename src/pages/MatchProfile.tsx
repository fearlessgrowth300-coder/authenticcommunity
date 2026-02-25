import { useNavigate, useParams } from "react-router-dom";
import { mockUsers } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, MessageCircle, Heart, Star, Shield } from "lucide-react";

const MatchProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = mockUsers.find((u) => u.id === id) || mockUsers[0];

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="relative">
        <img src={user.profileImage} alt={user.firstName} className="w-full h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
      </div>

      <main className="px-5 -mt-12 relative z-10 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.firstName} {user.lastName}, {user.age}</h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{user.city}, {user.state} · {user.distance} mi</span>
              </div>
            </div>
            <Badge className="gradient-primary text-primary-foreground border-0 text-base px-3 py-1">{user.matchScore}%</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{user.bio}</p>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map((i) => (
                <Badge key={i} variant="outline">{i}</Badge>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Values</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.values.map((v) => (
                <Badge key={v} className="bg-accent text-accent-foreground border-0">{v}</Badge>
              ))}
            </div>
          </div>

          {/* Conversation starters */}
          <div className="bg-muted rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">💬 Conversation Starter</p>
            <p className="text-sm text-foreground italic">"I noticed you love hiking too! What's the best trail you've done recently?"</p>
          </div>

          {/* Reviews */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Authenticity</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 text-primary fill-primary" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">5.0 · 8 reviews</span>
              <Shield className="h-4 w-4 text-primary ml-auto" />
              <span className="text-xs text-primary font-medium">Verified</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="gradient" size="lg" className="flex-1" onClick={() => navigate("/messages/1")}>
              <MessageCircle className="h-4 w-4 mr-2" /> Message
            </Button>
            <Button variant="accent" size="lg">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchProfile;
