import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const submittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pending_signup_email", email);
      return;
    }
    toast.error("Missing signup email. Please sign up again.");
    navigate("/signup", { replace: true });
  }, [email, navigate]);

  // Listen for auth state change (fallback if user clicks a link)
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

  const handleVerify = async () => {
    if (!otp || otp.length < 6 || !email || verifying) return;
    if (submittedRef.current === otp) return;
    submittedRef.current = otp;

    setVerifying(true);
    try {
      // Try email type first, then signup type
      const { error: emailError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (emailError) {
        // Fallback to signup type
        const { error: signupError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "signup",
        });
        if (signupError) throw signupError;
      }

      sessionStorage.removeItem("pending_signup_email");
      toast.success("Email verified! Welcome aboard.");
      navigate("/onboarding/1", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code. Please try again.");
      submittedRef.current = null;
    } finally {
      setVerifying(false);
    }
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      toast.success("New verification code sent!");
      setResendCooldown(RESEND_COOLDOWN);
      setOtp("");
      submittedRef.current = null;
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Enter verification code</h1>
        <p className="text-muted-foreground text-sm mb-2">We sent a 6-digit code to</p>
        <p className="text-foreground font-medium mb-8">{email}</p>

        <div className="mb-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={verifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {verifying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}

        <Button
          variant="gradient"
          size="lg"
          className="w-full max-w-xs mb-6"
          onClick={handleVerify}
          disabled={otp.length < 6 || verifying}
        >
          {verifying ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
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
