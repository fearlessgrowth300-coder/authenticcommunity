import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground transition-colors self-start mb-8">
        <ArrowLeft className="h-5 w-5" />
      </button>

      {sent ? (
        <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center -mt-20">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground text-sm mb-2">
            We sent a password reset link to
          </p>
          <p className="text-foreground font-medium mb-8">{email}</p>
          <Button variant="outline" onClick={() => navigate("/login")}>Back to login</Button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-1">Forgot password?</h1>
          <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <Button variant="gradient" size="lg" className="w-full" type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{" "}
            <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">Sign in</button>
          </p>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
