import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, ShieldCheck, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function useAdminCheck() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!user,
  });
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useAdminCheck();

  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  const { data: isPinSet, isLoading: pinStatusLoading, refetch: refetchPinStatus } = useQuery({
    queryKey: ["admin-pin-status"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_access_pin_is_set");
      if (error) throw error;
      return !!data;
    },
    enabled: !!isAdmin,
  });

  const handleVerifyPin = async () => {
    if (!pin.trim()) {
      toast.error("Enter your admin PIN");
      return;
    }

    setSubmittingPin(true);
    const { data, error } = await (supabase as any).rpc("verify_admin_access_pin", { _pin: pin.trim() });
    setSubmittingPin(false);

    if (error) {
      toast.error("Could not verify PIN");
      return;
    }

    if (!data) {
      toast.error("Incorrect PIN");
      return;
    }

    setPinVerified(true);
    setPin("");
    toast.success("Admin access granted");
  };

  const handleSetPin = async () => {
    const trimmedPin = newPin.trim();

    if (trimmedPin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }

    if (trimmedPin !== confirmPin.trim()) {
      toast.error("PIN confirmation does not match");
      return;
    }

    setSubmittingPin(true);
    const { error } = await (supabase as any).rpc("set_admin_access_pin", { _pin: trimmedPin });
    setSubmittingPin(false);

    if (error) {
      toast.error("Failed to save admin PIN");
      return;
    }

    await refetchPinStatus();
    setPinVerified(true);
    setNewPin("");
    setConfirmPin("");
    toast.success("Admin PIN saved");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-5">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have admin privileges to access this page.
        </p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (pinStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pinVerified) {
    const isSetupMode = !isPinSet;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              {isSetupMode ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {isSetupMode ? "Set Admin Security PIN" : "Enter Admin PIN"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isSetupMode ? "Create a second security layer for admin access." : "PIN verification is required before opening the dashboard."}
              </p>
            </div>
          </div>

          {isSetupMode ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-admin-pin">New PIN</Label>
                <Input
                  id="new-admin-pin"
                  type="password"
                  placeholder="At least 4 characters"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-admin-pin">Confirm PIN</Label>
                <Input
                  id="confirm-admin-pin"
                  type="password"
                  placeholder="Re-enter PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleSetPin} disabled={submittingPin}>
                {submittingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save PIN & Continue"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-pin">Security PIN</Label>
                <Input
                  id="admin-pin"
                  type="password"
                  placeholder="Enter admin PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyPin();
                  }}
                />
              </div>
              <Button className="w-full" onClick={handleVerifyPin} disabled={submittingPin}>
                {submittingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock Admin Dashboard"}
              </Button>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>Back to App</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

