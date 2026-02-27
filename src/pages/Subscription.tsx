import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscription, PlanTier } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const plans = [
  {
    name: "Free" as PlanTier,
    price: "$0",
    period: "/month",
    icon: Zap,
    highlight: false,
    features: [
      "5 match suggestions per day",
      "Join up to 3 communities",
      "Basic messaging",
      "Event discovery",
      "Standard profile",
    ],
  },
  {
    name: "pro" as PlanTier,
    displayName: "Pro",
    price: "$9.99",
    period: "/month",
    icon: Sparkles,
    highlight: true,
    features: [
      "Unlimited match suggestions",
      "Join unlimited communities",
      "Priority messaging",
      "Create & host events",
      "Enhanced profile with badges",
      "See who viewed your profile",
      "Advanced match filters",
    ],
  },
  {
    name: "premium" as PlanTier,
    displayName: "Premium",
    price: "$19.99",
    period: "/month",
    icon: Crown,
    highlight: false,
    features: [
      "Everything in Pro",
      "AI-powered match insights",
      "Verified badge",
      "Priority support",
      "Early access to features",
      "Community analytics",
      "Custom profile themes",
      "Ad-free experience",
    ],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan: currentPlan, refresh } = useSubscription();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (targetPlan: PlanTier) => {
    if (!user) return;
    setUpgrading(targetPlan);
    try {
      // For now, directly activate the plan (Stripe integration will replace this)
      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        plan: targetPlan,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id" });

      if (error) throw error;
      await refresh();
      toast.success(`Upgraded to ${targetPlan === "pro" ? "Pro" : "Premium"}!`);
    } catch {
      toast.error("Failed to upgrade. Try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanKey = (p: typeof plans[0]): PlanTier => {
    if (p.name === ("Free" as string)) return "free";
    return p.name as PlanTier;
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Subscription</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-foreground">Choose Your Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">Unlock more connections and features</p>
        </div>

        {plans.map((plan) => {
          const planKey = getPlanKey(plan);
          const isCurrent = currentPlan === planKey;
          const display = (plan as any).displayName || plan.name;

          return (
            <div
              key={plan.name}
              className={cn(
                "bg-card rounded-xl border p-5 space-y-4 transition-all",
                plan.highlight
                  ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)),var(--shadow-card-hover)]"
                  : "border-border/50 shadow-card"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center",
                    plan.highlight ? "bg-primary/15" : "bg-muted"
                  )}>
                    <plan.icon className={cn("h-5 w-5", plan.highlight ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{display}</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                </div>
                {isCurrent && (
                  <Badge variant="default" className="text-[10px]">Current Plan</Badge>
                )}
                {!isCurrent && plan.highlight && (
                  <Badge variant="secondary" className="text-[10px]">Most Popular</Badge>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.highlight ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-foreground/80">{feat}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : planKey === "free" ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Free
                </Button>
              ) : (
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={!!upgrading}
                  onClick={() => handleUpgrade(planKey)}
                >
                  {upgrading === planKey ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Upgrade to {display}
                </Button>
              )}
            </div>
          );
        })}

        <p className="text-center text-xs text-muted-foreground pt-2">
          Cancel anytime. No hidden fees.
        </p>
      </main>
    </div>
  );
};

export default Subscription;
