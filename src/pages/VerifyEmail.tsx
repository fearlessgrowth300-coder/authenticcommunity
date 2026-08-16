import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VerifyLocationState = { email?: string };
const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 8;
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = (location.state as VerifyLocationState | null) ?? null;
  const [email] = useState(() => normalizeEmail(locState?.email ?? sessionStorage.getItem("pending_signup_email") ?? ""));
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const submittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (email) { sessionStorage.setItem("pending_signup_email", email); return; }
    toast.error("Missing signup email. Please sign up again.");
    navigate("/signup", { replace: true });
  }, [email, navigate]);

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

  useEffect(() => {
    const timer = window.setInterval(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || !email || verifying || submittedRef.current === otp) return;
    submittedRef.current = otp;
    setVerifying(true);
    try {
      const { error: emailError } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (emailError) {
        const { error: signupError } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
        if (signupError) throw signupError;
      }
      sessionStorage.removeItem("pending_signup_email");
      toast.success("Email verified! Welcome aboard.");
      navigate("/onboarding/1", { replace: true });
    } catch (error: any) {
      submittedRef.current = null;
      toast.error(error.message || "Invalid or expired code. Please try again.");
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setOtp(""); submittedRef.current = null; setResendCooldown(RESEND_COOLDOWN);
      toast.success("New verification code sent!");
    } catch (error: any) { toast.error(error.message || "Failed to resend code"); }
    finally { setResending(false); }
  };

  useEffect(() => { if (otp.length === OTP_LENGTH) void handleVerify(); }, [otp]);

  return <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
    <button onClick={() => navigate("/signup")} className="self-start mb-8 text-muted-foreground transition-colors hover:text-foreground" aria-label="Back to signup"><ArrowLeft className="h-5 w-5" /></button>
    <div className="animate-fade-in -mt-20 flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary"><Mail className="h-8 w-8 text-primary-foreground" /></div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Enter verification code</h1>
      <p className="mb-2 text-sm text-muted-foreground">We sent an 8-digit verification code to</p><p className="mb-8 font-medium text-foreground">{email}</p>
      <div className="mb-6"><InputOTP maxLength={OTP_LENGTH} value={otp} onChange={setOtp} disabled={verifying}><InputOTPGroup>{Array.from({ length: OTP_LENGTH }, (_, index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP></div>
      <Button variant="gradient" size="lg" className="mb-6 w-full max-w-xs" onClick={handleVerify} disabled={otp.length !== OTP_LENGTH || verifying}>{verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify Email"}</Button>
      <div className="space-y-2"><p className="text-sm text-muted-foreground">Didn't receive the code? <button onClick={handleResend} disabled={resending || resendCooldown > 0} className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50">{resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}</button></p><p className="mt-2 text-xs text-muted-foreground">Check your spam/junk folder if you don't see it.</p><button onClick={() => navigate("/signup")} className="mt-2 text-sm text-muted-foreground underline hover:text-foreground">Change email address</button></div>
    </div>
  </div>;
};

export default VerifyEmail;
