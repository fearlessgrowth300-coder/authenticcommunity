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
      await signUp(email, password, firstName, lastName);
      toast.success("Verification code sent to your email!");
      navigate("/verify-email", {
        state: {
          email,
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
        <Button variant="outline" className="flex-1" type="button" onClick={handleGoogleSignup}>Google</Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8 mb-4">
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">Sign in</button>
      </p>
    </div>
  );
};

export default Signup;
