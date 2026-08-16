import { CalendarDays, CheckCircle2, Compass, MessageCircle, Users } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FirstWeekPlanProps = {
  profile: {
    bio?: string | null;
    location_city?: string | null;
    profile_image_url?: string | null;
  } | null;
  interestsCount: number;
  communityCount: number;
  eventCount: number;
  matchCount: number;
};

export function FirstWeekPlan({ profile, interestsCount, communityCount, eventCount, matchCount }: FirstWeekPlanProps) {
  const navigate = useNavigate();
  const steps = useMemo(() => [
    {
      title: "Make your profile feel like you",
      detail: "A photo, short bio, location, and interests make introductions much better.",
      done: Boolean(profile?.profile_image_url && profile?.bio && profile?.location_city && interestsCount >= 2),
      icon: Compass,
      action: "Finish profile",
      to: "/profile/edit",
    },
    {
      title: "Join one welcoming community",
      detail: "Smaller shared spaces are the easiest place to start a conversation.",
      done: communityCount > 0,
      icon: Users,
      action: "Explore communities",
      to: "/communities",
    },
    {
      title: "Choose a local event",
      detail: "Real-world plans are a calmer first step than endless messaging.",
      done: eventCount > 0,
      icon: CalendarDays,
      action: "Find an event",
      to: "/events",
    },
    {
      title: "Start one thoughtful introduction",
      detail: "Use a shared interest or a simple plan—there is no pressure to perform.",
      done: matchCount > 0,
      icon: MessageCircle,
      action: "Meet people",
      to: "/matches",
    },
  ], [communityCount, eventCount, interestsCount, matchCount, profile]);

  const complete = steps.filter((step) => step.done).length;
  if (complete === steps.length) return null;

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Your first meaningful week</p>
          <p className="text-xs text-muted-foreground">{complete} of {steps.length} steps complete. We optimize for belonging, not popularity.</p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-xs font-semibold text-primary">{Math.round((complete / steps.length) * 100)}%</span>
      </div>
      <div className="space-y-3">
        {steps.filter((step) => !step.done).slice(0, 2).map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex gap-3 rounded-xl bg-background/80 p-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                <Button variant="link" className="h-auto px-0 pt-2 text-xs" onClick={() => navigate(step.to)}>{step.action}</Button>
              </div>
            </div>
          );
        })}
      </div>
      {complete > 0 && <div className="mt-3 flex items-center gap-1.5 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> You are building a more useful signal for better introductions.</div>}
    </section>
  );
}
