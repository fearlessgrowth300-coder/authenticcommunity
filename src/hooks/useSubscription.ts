import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

// All features unlocked for now until Stripe is integrated
export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const hasFeature = useCallback((_feature: FeatureKey) => {
    // All features unlocked temporarily
    return true;
  }, []);

  const refresh = useCallback(async () => {}, []);

  return { plan: "premium", loading, hasFeature, refresh };
}
