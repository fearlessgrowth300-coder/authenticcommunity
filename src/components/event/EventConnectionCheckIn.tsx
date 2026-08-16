import { useEffect, useState } from "react";
import { HeartHandshake, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ConnectionAnswer = "yes" | "not-yet" | "no" | null;

export function EventConnectionCheckIn({ eventId, eventDate, isGoing }: { eventId: string; eventDate: string | null; isGoing: boolean }) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState<ConnectionAnswer>(null);
  const [followUp, setFollowUp] = useState<ConnectionAnswer>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isPast = !!eventDate && new Date(`${eventDate}T23:59:59`).getTime() < Date.now();

  useEffect(() => {
    if (!isPast || !isGoing || !user) { setLoading(false); return; }
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("event_connection_outcomes")
        .select("made_connection, wants_follow_up, feedback")
        .eq("event_id", eventId)
        .maybeSingle();
      if (!error && data) {
        setAnswer(data.made_connection ? "yes" : "no");
        setFollowUp(data.wants_follow_up ? "yes" : "no");
        setFeedback(data.feedback || "");
      }
      setLoading(false);
    };
    load();
  }, [eventId, isGoing, isPast, user]);

  if (!isPast || !isGoing || !user || loading) return null;

  const save = async () => {
    if (!answer || !followUp) return toast.error("Please answer both questions.");
    setSaving(true);
    const { error } = await (supabase as any).from("event_connection_outcomes").upsert({
      event_id: eventId,
      user_id: user.id,
      made_connection: answer === "yes",
      wants_follow_up: followUp === "yes",
      feedback: feedback.trim() || null,
    }, { onConflict: "event_id,user_id" });
    setSaving(false);
    if (error) return toast.error("We could not save your check-in. Please try again.");
    toast.success("Thanks—this helps us make better introductions and events.");
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex gap-3">
        <HeartHandshake className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">A quick connection check-in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Private to you. We use this to improve events and introductions—not to create a public score.</p>
          <p className="mt-4 text-sm font-medium text-foreground">Did you meet someone you would like to see again?</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant={answer === "yes" ? "default" : "outline"} onClick={() => setAnswer("yes")}>Yes</Button>
            <Button size="sm" variant={answer === "not-yet" ? "default" : "outline"} onClick={() => setAnswer("not-yet")}>Not yet</Button>
            <Button size="sm" variant={answer === "no" ? "default" : "outline"} onClick={() => setAnswer("no")}>No</Button>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Would you like help taking a next step?</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant={followUp === "yes" ? "default" : "outline"} onClick={() => setFollowUp("yes")}>Yes, please</Button>
            <Button size="sm" variant={followUp === "no" ? "default" : "outline"} onClick={() => setFollowUp("no")}>No thanks</Button>
          </div>
          <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={500} placeholder="Optional: what would have made this event easier or better?" className="mt-4 min-h-20 bg-background" />
          <Button size="sm" variant="gradient" className="mt-3" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save private check-in
          </Button>
        </div>
      </div>
    </section>
  );
}
