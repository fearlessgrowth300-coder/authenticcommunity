import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2, Calendar, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { countries, statesByCountry, detectCountryFromIP } from "@/lib/countries";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);

  useEffect(() => {
    detectCountryFromIP().then((loc) => {
      if (loc) {
        const matched = countries.find(
          (c) => c.code === loc.countryCode || c.name === loc.country
        );
        if (matched) setSelectedCountry(matched.code);
        if (loc.state) setSelectedState(loc.state);
      }
      setDetectingLocation(false);
    });
  }, []);

  const availableStates = statesByCountry[selectedCountry] || [];

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (dateOfBirth) {
      const age = getAge(dateOfBirth);
      if (age < 18) {
        toast.error("You must be at least 18 years old to sign up");
        return;
      }
    }
    if (!selectedCountry) {
      toast.error("Please select your country");
      return;
    }
    setLoading(true);
    try {
      await signUp(normalizedEmail, password, firstName, lastName);
      sessionStorage.setItem("pending_signup_email", normalizedEmail);
      toast.success("Verification code sent to your email!");
      navigate("/verify-email", {
        state: {
          email: normalizedEmail,
          dateOfBirth,
          country: selectedCountry,
          stateProv: selectedState,
        },
      });
    } catch (err: any) {

      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/onboarding/1",
      });
      if (result.error) {
        toast.error("Google sign-up failed");
      }
    } catch {
      toast.error("Google sign-up failed");
    }
  };

  const handleAppleSignup = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin + "/onboarding/1",
      });
      if (result.error) {
        toast.error("Apple sign-up failed");
      }
    } catch {
      toast.error("Apple sign-up failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors self-start mb-6">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
        <p className="text-muted-foreground mb-6">Start building authentic connections</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4 animate-slide-up">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first">First name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="first" placeholder="First" className="pl-10" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" placeholder="Last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dob"
              type="date"
              className="pl-10"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">You must be 18 or older</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedState(""); }}>
              <SelectTrigger>
                <SelectValue placeholder={detectingLocation ? "Detecting..." : "Select country"} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State / Province</Label>
            <Select value={selectedState} onValueChange={setSelectedState} disabled={availableStates.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={availableStates.length ? "Select" : "N/A"} />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="gradient" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</> : "Create Account"}
        </Button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or sign up with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" type="button" onClick={handleGoogleSignup}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </Button>
        <Button variant="outline" className="flex-1" type="button" onClick={handleAppleSignup}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Apple
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8 mb-4">
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">Sign in</button>
      </p>
    </div>
  );
};

export default Signup;
