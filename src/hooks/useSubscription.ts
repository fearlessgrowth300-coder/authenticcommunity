import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "free" | "pro" | "premium";

interface SubscriptionState {
  plan: PlanTier;
  loading: boolean;
  /** Check if user has access to a feature */
  hasFeature: (feature: FeatureKey) => boolean;
  /** Refresh subscription data */
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

const featureAccess: Record<FeatureKey, PlanTier[]> = {
  unlimited_matches: ["pro", "premium"],
  unlimited_communities: ["pro", "premium"],
  priority_messaging: ["pro", "premium"],
  create_events: ["pro", "premium"],
  enhanced_profile: ["pro", "premium"],
  profile_viewers: ["pro", "premium"],
  advanced_filters: ["pro", "premium"],
  ai_insights: ["premium"],
  verified_badge: ["premium"],
  priority_support: ["premium"],
  early_access: ["premium"],
  community_analytics: ["premium"],
  custom_themes: ["premium"],
  ad_free: ["premium"],
};

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) { setPlan("free"); setLoading(false); return; }
    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const expired = data.expires_at && new Date(data.expires_at) < new Date();
      setPlan(expired ? "free" : (data.plan as PlanTier));
    } else {
      setPlan("free");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const hasFeature = useCallback((feature: FeatureKey) => {
    return featureAccess[feature]?.includes(plan) ?? false;
  }, [plan]);

  return { plan, loading, hasFeature, refresh: fetchPlan };
}
