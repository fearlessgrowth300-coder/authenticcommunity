import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // The recovery link logs the user in automatically via the hash fragment
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });
    // Also check if already in a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Password updated!</h1>
        <p className="text-muted-foreground text-sm mb-8">Your password has been reset successfully.</p>
        <Button variant="gradient" onClick={() => navigate("/dashboard")}>Continue to app</Button>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center -mt-20">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-1">Set new password</h1>
          <p className="text-muted-foreground mb-8">Choose a strong password for your account.</p>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm" type="password" placeholder="Repeat password" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <Button variant="gradient" size="lg" className="w-full" type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
