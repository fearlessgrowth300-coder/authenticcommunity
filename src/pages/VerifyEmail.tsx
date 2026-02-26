import { useState, useEffect, useCallback, useRef } from "react";
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

const CODE_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const RESEND_COOLDOWN = 60; // 60 seconds
const CODE_MIN_LENGTH = 6;
const CODE_MAX_LENGTH = 8;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, CODE_MAX_LENGTH);

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = (location.state as VerifyLocationState | null) ?? null;

  const initialEmail = normalizeEmail(
    locState?.email ?? sessionStorage.getItem("pending_signup_email") ?? "",
  );

  const [email] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(CODE_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const lastAttemptRef = useRef<{ code: string; at: number } | null>(null);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("pending_signup_email", email);
      return;
    }

    toast.error("Missing signup email. Please sign up again.");
    navigate("/signup", { replace: true });
  }, [email, navigate]);

  // Countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setVerifyCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = useCallback(async () => {
    const sanitizedCode = normalizeCode(code);
    if (loading || !email || sanitizedCode.length < CODE_MIN_LENGTH || verifyCooldown > 0) return;

    const now = Date.now();
    if (
      lastAttemptRef.current?.code === sanitizedCode &&
      now - lastAttemptRef.current.at < 3500
    ) {
      toast.error("Please wait a few seconds before trying that code again.");
      return;
    }
    lastAttemptRef.current = { code: sanitizedCode, at: now };

    setLoading(true);
    try {
      const otpTypes: Array<"signup" | "email"> = ["signup", "email"];
      let lastError: Error | null = null;
      let verified = false;

      for (const otpType of otpTypes) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: sanitizedCode,
          type: otpType,
        });

        if (!error && (data?.user || data?.session)) {
          verified = true;
          break;
        }

        if (error) {
          const errorMessage = (error.message || "").toLowerCase();
          if (errorMessage.includes("rate limit")) {
            setVerifyCooldown(20);
            throw new Error("Request rate limit reached. Please wait 20 seconds.");
          }

          const canTryFallbackType =
            otpType === "signup" &&
            (errorMessage.includes("invalid") ||
              errorMessage.includes("expired") ||
              errorMessage.includes("token") ||
              errorMessage.includes("otp"));

          if (!canTryFallbackType) throw error;
          lastError = error;
        }
      }

      if (!verified) {
        throw lastError || new Error("Verification could not be confirmed. Please request a new code.");
      }

      // Save signup metadata (country, DOB) to profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && locState) {
        const countryName = locState.country || null;
        const stateProv = locState.stateProv || null;
        const dob = locState.dateOfBirth || null;
        let age: number | null = null;

        if (dob) {
          const birth = new Date(dob);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }

        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              location_country: countryName,
              location_state: stateProv,
              date_of_birth: dob,
              age,
            },
            { onConflict: "user_id" },
          );
      }

      sessionStorage.removeItem("pending_signup_email");
      toast.success("Email verified! Welcome aboard.");
      navigate("/onboarding/1");
    } catch (err: any) {
      const message = (err?.message || "").toLowerCase();

      if (message.includes("rate limit")) {
        toast.error("Too many attempts. Please wait and try again.");
      } else if (message.includes("expired") || message.includes("invalid")) {
        setVerifyCooldown(3);
        toast.error("This code is invalid or expired. Please resend and use the newest code.");
      } else {
        toast.error(err?.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  }, [code, email, loading, locState, navigate, verifyCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      toast.success("New code sent to your email");
      setResendCooldown(RESEND_COOLDOWN);
      setExpirySeconds(CODE_EXPIRY_SECONDS);
      setVerifyCooldown(0);
      lastAttemptRef.current = null;
      setCode("");
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground text-sm mb-2">We sent a verification code to</p>
        <p className="text-foreground font-medium mb-2">{email}</p>

        {/* Expiry countdown */}
        <p className={`text-xs mb-6 ${expirySeconds < 120 ? "text-destructive" : "text-muted-foreground"}`}>
          ⏱️ Code expires in {formatTime(expirySeconds)}
        </p>

        <div className="mb-6">
          <InputOTP
            maxLength={CODE_MAX_LENGTH}
            inputMode="text"
            value={code}
            onChange={(value) => setCode(normalizeCode(value))}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="w-full max-w-xs"
          onClick={handleVerify}
          disabled={loading || verifyCooldown > 0 || normalizeCode(code).length < CODE_MIN_LENGTH}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...
            </>
          ) : verifyCooldown > 0 ? (
            `Try again in ${verifyCooldown}s`
          ) : (
            "Verify Email"
          )}
        </Button>

        {verifyCooldown > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Too many attempts detected. Please wait before trying again.</p>
        )}

        <div className="mt-6 space-y-2">
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
          <button
            onClick={() => navigate("/signup")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Change email address
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

