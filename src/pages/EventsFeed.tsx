import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin, Users, Plus, Loader2, Clock, Map, List } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EventsMap } from "@/components/EventsMap";
import { scoreLocalRecommendation } from "@/lib/recommendations";

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
  latitude: number | null;
  longitude: number | null;
  recommendation?: { score: number; reason: string | null };
}

const categories = ["Outdoors", "Food & Drink", "Arts & Culture", "Wellness", "Tech", "Social", "Sports", "Learning"];

const categoryImages: Record<string, string> = {
  Outdoors: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop",
  "Food & Drink": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
  "Arts & Culture": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop",
  Wellness: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&h=400&fit=crop",
  Tech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
  Social: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop",
  Sports: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=600&h=400&fit=crop",
  Learning: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&h=400&fit=crop",
};

const EventsFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState<Date>();
  const [formStartTime, setFormStartTime] = useState("18:00");
  const [formLocation, setFormLocation] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formMaxAttendees, setFormMaxAttendees] = useState("");
  const [creating, setCreating] = useState(false);

  const loadEvents = async () => {
    let query = supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("event_date", { ascending: true });

    if (selectedCategory) {
      query = query.eq("category", selectedCategory);
    }

    const [eventsRes, profileRes, interestsRes] = await Promise.all([
      query,
      user ? supabase.from("profiles").select("location_city").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from("user_interests").select("interest_name").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    const myInterests = (interestsRes.data || []).map((row: { interest_name: string }) => row.interest_name);
    setEvents((eventsRes.data || []).map((event: EventRow) => ({
      ...event,
      recommendation: scoreLocalRecommendation({
        itemCity: event.location,
        itemCategory: event.category,
        memberCount: event.attendee_count,
        myCity: profileRes.data?.location_city,
        myInterests,
      }),
    })).sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0)));
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  const handleCreate = async () => {
    if (!formName.trim() || !formDate || !user) return;
    setCreating(true);

    const { error } = await supabase.from("events").insert({
      name: formName.trim(),
      description: formDesc.trim() || null,
      event_date: format(formDate, "yyyy-MM-dd"),
      start_time: formStartTime || null,
      location: formLocation.trim() || null,
      category: formCategory || null,
      max_attendees: formMaxAttendees ? parseInt(formMaxAttendees) : null,
      organizer_id: user.id,
      event_image_url: categoryImages[formCategory] || categoryImages["Social"],
    });

    if (error) {
      toast.error("Failed to create event");
    } else {
      toast.success("Event created!");
      setCreateOpen(false);
      setFormName("");
      setFormDesc("");
      setFormDate(undefined);
      setFormStartTime("18:00");
      setFormLocation("");
      setFormCategory("");
      setFormMaxAttendees("");
      loadEvents();
    }
    setCreating(false);
  };

  return (
    <div className="app-page">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/95 px-5 py-3 backdrop-blur-lg">
        <div className="app-content flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">Events</h1>
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "map" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <Map className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Event name *" value={formName} onChange={(e) => setFormName(e.target.value)} />
                <Textarea placeholder="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formDate ? format(formDate, "PPP") : "Pick a date *"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formDate}
                      onSelect={setFormDate}
                      disabled={(d) => d < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
                    <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                  </div>
                </div>

                <Input placeholder="Location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />

                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input type="number" placeholder="Max attendees (optional)" value={formMaxAttendees} onChange={(e) => setFormMaxAttendees(e.target.value)} />

                <Button variant="gradient" className="w-full" onClick={handleCreate} disabled={!formName.trim() || !formDate || creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Category filter */}
      <div className="app-content px-5 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
              !selectedCategory ? "gradient-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat ? "gradient-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events content */}
      <main className="app-content space-y-4 px-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">No events found. Create one!</p>
        ) : viewMode === "map" ? (
          <EventsMap events={events} onEventClick={(id) => navigate(`/events/${id}`)} />
        ) : (
          events.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="w-full bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden text-left transition-shadow hover:shadow-card-hover"
            >
              <img
                src={event.event_image_url || categoryImages["Social"]}
                alt={event.name}
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {event.category && (
                    <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
                  )}
                  {event.event_date && (
                    <span className="text-xs text-primary font-medium">
                      {format(new Date(event.event_date + "T00:00:00"), "MMM d, yyyy")}
                    </span>
                  )}
                  {event.recommendation?.reason && <span className="text-[10px] text-primary font-medium">{event.recommendation.reason}</span>}
                </div>
                <h3 className="text-base font-semibold text-foreground">{event.name}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </span>
                  )}
                  {event.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {event.start_time.slice(0, 5)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {event.attendee_count || 0}
                    {event.max_attendees ? ` / ${event.max_attendees}` : ""} going
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
};

export default EventsFeed;
