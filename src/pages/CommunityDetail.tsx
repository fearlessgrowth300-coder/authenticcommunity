import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountRestrictions } from "@/hooks/useAccountRestrictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Users, Calendar, MessageCircle, Share2, Loader2, FileText, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import CommunityFeed from "@/components/community/CommunityFeed";
import CommunityMembers from "@/components/community/CommunityMembers";
import CommunityResources from "@/components/community/CommunityResources";

const CommunityDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { canInteract, restrictionMessage } = useAccountRestrictions();
  const [community, setCommunity] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [communityRes, eventsRes, membersRes] = await Promise.all([
        supabase.from("communities").select("*").eq("id", id).maybeSingle(),
        supabase.from("events").select("*").eq("community_id", id).eq("is_active", true).order("event_date", { ascending: true }).limit(3),
        supabase.from("community_members").select("id, user_id").eq("community_id", id),
      ]);

      if (communityRes.data) setCommunity(communityRes.data);
      setEvents(eventsRes.data || []);
      setMemberCount(membersRes.data?.length || 0);

      if (user) {
        setIsMember(membersRes.data?.some((m) => m.user_id === user.id) || false);
      }

      setLoading(false);
    };

    load();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user || !id) return;
    if (!canInteract) {
      toast.error(restrictionMessage || "This action is disabled for your account.");
      return;
    }
    setJoining(true);

    if (isMember) {
      await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
      setIsMember(false);
      setMemberCount((c) => Math.max(0, c - 1));
      toast.success("Left community");
    } else {
      await supabase.from("community_members").insert({ community_id: id, user_id: user.id });
      setIsMember(true);
      setMemberCount((c) => c + 1);
      toast.success("Joined community!");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Community not found</p>
        <Button variant="outline" onClick={() => navigate("/communities")}>Back to communities</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative">
        <img
          src={community.profile_image_url || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"}
          alt={community.community_name}
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/communities/${id}`;
            if (navigator.share) {
              navigator.share({ title: community?.community_name || "Community", url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url);
              toast.success("Link copied!");
            }
          }}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="h-4 w-4 text-foreground" />
        </button>
      </div>

      <main className="px-5 -mt-8 relative z-10 max-w-lg mx-auto space-y-5">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          {community.category && <Badge variant="outline" className="mb-2">{community.category}</Badge>}
          <h1 className="text-xl font-bold text-foreground">{community.community_name}</h1>
          {community.description && <p className="text-sm text-muted-foreground mt-1">{community.description}</p>}

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {memberCount} members</div>
            {community.location_city && (
              <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {community.location_city}</div>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              variant={isMember ? "outline" : "gradient"}
              size="lg"
              className="flex-1"
              onClick={handleJoin}
              disabled={joining || !canInteract}
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isMember ? "Leave Community" : "Join Community"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-10">
            <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
            <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            {id && <CommunityFeed communityId={id} isMember={isMember} />}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            {id && <CommunityMembers communityId={id} />}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex gap-3 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors p-3 bg-card border border-border/50 rounded-xl"
                  >
                    <div className="bg-primary/10 rounded-lg p-2 text-center min-w-[48px]">
                      <Calendar className="h-4 w-4 text-primary mx-auto" />
                      {event.event_date && (
                        <p className="text-xs font-semibold text-primary mt-0.5">
                          {format(new Date(event.event_date + "T00:00:00"), "MMM d")}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.start_time ? event.start_time.slice(0, 5) : ""}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No upcoming events</p>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            {id && <CommunityResources communityId={id} isMember={isMember} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommunityDetail;
