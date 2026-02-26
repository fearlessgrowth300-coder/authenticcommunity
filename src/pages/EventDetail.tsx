import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Users, CalendarIcon, Loader2, Check, X, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  category: string | null;
  event_image_url: string | null;
  attendee_count: number | null;
  max_attendees: number | null;
  organizer_id: string | null;
}

const EventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvping, setRsvping] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventData) {
        setEvent(eventData);
        setAttendeeCount(eventData.attendee_count || 0);
      }

      if (user) {
        const { data: rsvp } = await supabase
          .from("event_attendees")
          .select("rsvp_status")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (rsvp) setRsvpStatus(rsvp.rsvp_status);
      }

      setLoading(false);
    };

    load();
  }, [id, user]);

  const handleRsvp = async (status: string) => {
    if (!user || !id) return;
    setRsvping(true);

    if (rsvpStatus) {
      // Update existing
      if (status === "cancel") {
        await supabase.from("event_attendees").delete().eq("event_id", id).eq("user_id", user.id);
        setRsvpStatus(null);
        setAttendeeCount((c) => Math.max(0, c - 1));
        // Update event count
        await supabase.from("events").update({ attendee_count: Math.max(0, attendeeCount - 1) }).eq("id", id);
        toast.success("RSVP cancelled");
      } else {
        await supabase
          .from("event_attendees")
          .update({ rsvp_status: status })
          .eq("event_id", id)
          .eq("user_id", user.id);
        setRsvpStatus(status);
        toast.success(`RSVP updated to ${status}`);
      }
    } else {
      // New RSVP
      await supabase.from("event_attendees").insert({
        event_id: id,
        user_id: user.id,
        rsvp_status: status,
      });
      setRsvpStatus(status);
      if (status === "going") {
        setAttendeeCount((c) => c + 1);
        await supabase.from("events").update({ attendee_count: attendeeCount + 1 }).eq("id", id);
      }
      toast.success(`RSVP'd as ${status}!`);
    }

    setRsvping(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" onClick={() => navigate("/events")}>Back to events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative">
        <img
          src={event.event_image_url || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop"}
          alt={event.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button
          onClick={() => navigate("/events")}
          className="absolute top-4 left-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/events/${id}`;
            if (navigator.share) {
              navigator.share({ title: event?.name || "Event", url }).catch(() => {});
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

      <main className="px-5 -mt-10 relative z-10 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            {event.category && <Badge variant="outline">{event.category}</Badge>}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">{event.name}</h1>

          {event.description && (
            <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
          )}

          <div className="space-y-2.5 mb-5">
            {event.event_date && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(new Date(event.event_date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
              </div>
            )}
            {event.start_time && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {event.start_time.slice(0, 5)}
                {event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ""}
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {event.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4 text-primary" />
              {attendeeCount} attending
              {event.max_attendees ? ` · ${event.max_attendees - attendeeCount} spots left` : ""}
            </div>
          </div>

          {/* RSVP section */}
          <div className="border-t border-border/50 pt-4">
            {rsvpStatus === "going" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Check className="h-4 w-4" /> You're going!
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRsvp("cancel")}
                  disabled={rsvping}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-1" /> Cancel RSVP
                </Button>
              </div>
            ) : rsvpStatus === "interested" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  You're interested
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm" onClick={() => handleRsvp("going")} disabled={rsvping}>
                    Going
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRsvp("cancel")} disabled={rsvping} className="text-destructive">
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="gradient" size="lg" className="flex-1" onClick={() => handleRsvp("going")} disabled={rsvping}>
                  {rsvping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  I'm Going
                </Button>
                <Button variant="outline" size="lg" onClick={() => handleRsvp("interested")} disabled={rsvping}>
                  Interested
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;
