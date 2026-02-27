import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AccountStatus = "active" | "suspended" | "deleted";

interface AccountRestrictionsState {
  loading: boolean;
  accountStatus: AccountStatus;
  canInteract: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  suspensionReason: string | null;
  suspendedUntil: string | null;
  restrictionMessage: string | null;
  refresh: () => Promise<void>;
}

export function useAccountRestrictions(): AccountRestrictionsState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccountStatus("active");
      setSuspensionReason(null);
      setSuspendedUntil(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("account_status, suspended_until, suspension_reason, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setAccountStatus("active");
      setSuspensionReason(null);
      setSuspendedUntil(null);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const rawStatus = (data.account_status || "active") as AccountStatus;
    const isDeleted = rawStatus === "deleted" || data.is_active === false;
    const suspensionEndsAt = data.suspended_until ? new Date(data.suspended_until).getTime() : null;
    const suspensionExpired =
      rawStatus === "suspended" && suspensionEndsAt !== null && !Number.isNaN(suspensionEndsAt) && suspensionEndsAt <= now;

    if (suspensionExpired) {
      const { error: reactivateError } = await supabase
        .from("profiles")
        .update({
          account_status: "active",
          suspended_until: null,
          suspension_reason: null,
          is_active: true,
        })
        .eq("user_id", user.id);

      if (!reactivateError) {
        setAccountStatus("active");
        setSuspensionReason(null);
        setSuspendedUntil(null);
        setLoading(false);
        return;
      }
    }

    setAccountStatus(isDeleted ? "deleted" : rawStatus);
    setSuspensionReason(data.suspension_reason || null);
    setSuspendedUntil(data.suspended_until || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isDeleted = accountStatus === "deleted";
  const isSuspended = useMemo(() => {
    if (accountStatus !== "suspended") return false;
    if (!suspendedUntil) return true;
    const until = new Date(suspendedUntil).getTime();
    if (Number.isNaN(until)) return true;
    return until > Date.now();
  }, [accountStatus, suspendedUntil]);

  const canInteract = !isDeleted && !isSuspended;

  const restrictionMessage = useMemo(() => {
    if (isDeleted) return "This account has been removed."
    if (!isSuspended) return null;
    if (suspendedUntil) {
      const until = new Date(suspendedUntil);
      if (!Number.isNaN(until.getTime())) {
        return `Your account is suspended until ${until.toLocaleString()}. You can browse only.`;
      }
    }
    return suspensionReason
      ? `Your account is suspended: ${suspensionReason}. You can browse only.`
      : "Your account is suspended. You can browse only.";
  }, [isDeleted, isSuspended, suspendedUntil, suspensionReason]);

  return {
    loading,
    accountStatus,
    canInteract,
    isSuspended,
    isDeleted,
    suspensionReason,
    suspendedUntil,
    restrictionMessage,
    refresh,
  };
}
