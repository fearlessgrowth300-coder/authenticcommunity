import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventAttendeesProps {
  eventId: string;
}

interface Attendee {
  user_id: string;
  rsvp_status: string | null;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null; location_city: string | null };
}

const EventAttendees = ({ eventId }: EventAttendeesProps) => {
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("event_attendees").select("user_id, rsvp_status").eq("event_id", eventId);
      if (data) {
        const userIds = data.map((a) => a.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url, location_city").in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        setAttendees(data.map((a) => ({ ...a, profile: profileMap.get(a.user_id) })));
      }
      setLoading(false);
    };
    load();
  }, [eventId]);

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  const filtered = filter === "all" ? attendees : attendees.filter((a) => a.rsvp_status === filter);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-3">
        {["all", "going", "interested"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors",
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {f} ({f === "all" ? attendees.length : attendees.filter((a) => a.rsvp_status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No attendees yet</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.user_id}
              onClick={() => navigate(`/matches/${a.user_id}`)}
              className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors text-left"
            >
              {a.profile?.profile_image_url ? (
                <img src={a.profile.profile_image_url} className="h-10 w-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {getName(a.profile)[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getName(a.profile)}</p>
                {a.profile?.location_city && <p className="text-xs text-muted-foreground">{a.profile.location_city}</p>}
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", 
                a.rsvp_status === "going" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground")}>
                {a.rsvp_status === "going" ? <Check className="h-3 w-3 inline mr-0.5" /> : <HelpCircle className="h-3 w-3 inline mr-0.5" />}
                {a.rsvp_status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventAttendees;
