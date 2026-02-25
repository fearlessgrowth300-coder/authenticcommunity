import { useNavigate, useParams } from "react-router-dom";
import { mockCommunities, mockEvents } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Users, Calendar, MessageCircle, Share2 } from "lucide-react";

const CommunityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const community = mockCommunities.find((c) => c.id === id) || mockCommunities[0];

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="relative">
        <img src={community.image} alt={community.name} className="w-full h-52 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <button className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Share2 className="h-4 w-4 text-foreground" />
        </button>
      </div>

      <main className="px-5 -mt-8 relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          <Badge variant="outline" className="mb-2">{community.category}</Badge>
          <h1 className="text-xl font-bold text-foreground">{community.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{community.description}</p>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {community.memberCount} members</div>
            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {community.city}</div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button variant="gradient" size="lg" className="flex-1">Join Community</Button>
            <Button variant="outline" size="lg"><MessageCircle className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Members preview */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Members</h3>
          <div className="flex -space-x-2">
            {["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
            ].map((img, i) => (
              <img key={i} src={img} alt="Member" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
            ))}
            <div className="h-9 w-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{community.memberCount - 4}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Events</h3>
            <button className="text-xs text-primary font-medium">See all</button>
          </div>
          {mockEvents.slice(0, 1).map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="bg-primary/10 rounded-lg p-2 text-center min-w-[48px]">
                <Calendar className="h-4 w-4 text-primary mx-auto" />
                <p className="text-xs font-semibold text-primary mt-0.5">Mar 2</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{event.name}</p>
                <p className="text-xs text-muted-foreground">{event.time} · {event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CommunityDetail;
