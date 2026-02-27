import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Clock, Eye, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";

const SuspendedAccount = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("suspension_reason, suspended_until, account_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSuspensionReason(data.suspension_reason || null);
        setSuspendedUntil(data.suspended_until || null);

        // If no longer suspended, redirect to dashboard
        if (data.account_status !== "suspended") {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Check if suspension expired
        if (data.suspended_until) {
          const until = new Date(data.suspended_until).getTime();
          if (!Number.isNaN(until) && until <= Date.now()) {
            // Auto-reactivate
            await supabase
              .from("profiles")
              .update({ account_status: "active", suspended_until: null, suspension_reason: null })
              .eq("user_id", user.id);
            navigate("/dashboard", { replace: true });
            return;
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const untilDate = suspendedUntil ? new Date(suspendedUntil) : null;
  const isValidDate = untilDate && !Number.isNaN(untilDate.getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground">Account Suspended</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto w-full text-center">
        {/* Icon */}
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">Your Account is Temporarily Suspended</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Your account has been suspended due to a policy violation. During this period, you can only browse feeds.
        </p>

        {/* Suspension Details Card */}
        <div className="w-full bg-card rounded-xl border border-border/50 shadow-card p-5 space-y-4 mb-8">
          {/* Reason */}
          {suspensionReason && (
            <div className="text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
              <p className="text-sm text-foreground">{suspensionReason}</p>
            </div>
          )}

          {/* End Date */}
          {isValidDate && (
            <div className="text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Suspension Ends</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(untilDate!, "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatDistanceToNow(untilDate!, { addSuffix: true })})
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isValidDate && !suspensionReason && (
            <p className="text-sm text-muted-foreground">
              Your suspension details are not available. Please contact support.
            </p>
          )}

          {/* What you can do */}
          <div className="text-left border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What you can do</p>
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">Browse feeds and view content only</p>
            </div>
          </div>

          {/* What you can't do */}
          <div className="text-left border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Restricted actions</p>
            <ul className="space-y-1.5">
              {["Send or receive messages", "Like or match with users", "Join or create communities", "RSVP to events", "Create stories"].map((item) => (
                <li key={item} className="text-sm text-destructive/80 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive/60 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Support */}
        <Button
          className="w-full max-w-xs mb-3"
          onClick={() => navigate("/help-support")}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Support to Appeal
        </Button>

        {/* Browse feeds button */}
        <Button
          variant="outline"
          className="w-full max-w-xs"
          onClick={() => navigate("/dashboard")}
        >
          <Eye className="h-4 w-4 mr-2" />
          Browse Feeds (View Only)
        </Button>
      </main>
    </div>
  );
};

export default SuspendedAccount;
