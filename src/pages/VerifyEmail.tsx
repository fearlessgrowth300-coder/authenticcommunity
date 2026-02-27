import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerifyLocationState = {
  email?: string;
  country?: string;
  stateProv?: string;
  dateOfBirth?: string;
};

const RESEND_COOLDOWN = 60;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = (location.state as VerifyLocationState | null) ?? null;

  const initialEmail = normalizeEmail(
    locState?.email ?? sessionStorage.getItem("pending_signup_email") ?? "",
  );

  const [email] = useState(initialEmail);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pending_signup_email", email);
      return;
    }
    toast.error("Missing signup email. Please sign up again.");
    navigate("/signup", { replace: true });
  }, [email, navigate]);

  // Listen for auth state change (user clicked link in email and got verified)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        sessionStorage.removeItem("pending_signup_email");
        toast.success("Email verified! Welcome aboard.");
        navigate("/onboarding/1", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      toast.success("New verification email sent!");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate("/signup")} className="text-muted-foreground hover:text-foreground transition-colors self-start mb-8">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center -mt-20">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground text-sm mb-2">We sent a verification link to</p>
        <p className="text-foreground font-medium mb-6">{email}</p>

        <div className="bg-muted/50 rounded-xl p-6 mb-6 max-w-sm w-full">
          <p className="text-sm text-foreground font-medium mb-2">📧 Open your email</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click the <strong>"Verify Email"</strong> button in the email we just sent you. You'll be redirected back here automatically.
          </p>
          <p className="text-xs text-muted-foreground">
            ⏱️ The link expires in 15 minutes
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?{" "}
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
            </button>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Check your spam/junk folder if you don't see it
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="text-sm text-muted-foreground hover:text-foreground underline mt-2"
          >
            Change email address
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
