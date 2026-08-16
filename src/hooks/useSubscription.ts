import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "free" | "pro" | "premium";

interface SubscriptionState {
  plan: PlanTier;
  loading: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

export type FeatureKey =
  | "unlimited_matches"
  | "unlimited_communities"
  | "priority_messaging"
  | "create_events"
  | "enhanced_profile"
  | "profile_viewers"
  | "advanced_filters"
  | "ai_insights"
  | "verified_badge"
  | "priority_support"
  | "early_access"
  | "community_analytics"
  | "custom_themes"
  | "ad_free";

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const active = data?.expires_at ? new Date(data.expires_at).getTime() > Date.now() : Boolean(data);
    setPlan(active && (data?.plan === "pro" || data?.plan === "premium") ? data.plan : "free");
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const hasFeature = useCallback((feature: FeatureKey) => {
    const proFeatures: FeatureKey[] = ["unlimited_matches", "unlimited_communities", "priority_messaging", "create_events", "enhanced_profile", "profile_viewers", "advanced_filters"];
    if (plan === "premium") return true;
    return plan === "pro" && proFeatures.includes(feature);
  }, [plan]);

  return { plan, loading, hasFeature, refresh };
}
