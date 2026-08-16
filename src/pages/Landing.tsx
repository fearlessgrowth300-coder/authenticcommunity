import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, MapPin, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-community.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Diverse people connecting in a community"
          className="w-full h-64 sm:h-80 object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <main className="flex-1 px-6 -mt-8 relative z-10 max-w-lg mx-auto w-full">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient">Authentic Community</span>{" "}
            <span className="text-foreground">Connection</span>
          </h1>
          <p className="text-muted-foreground text-base mb-8">
            Find your people. Build genuine friendships and communities that feel like home.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up">
          {[
            { icon: Sparkles, label: "Connection fit", desc: "Clear reasons, not guesswork" },
            { icon: Users, label: "Communities", desc: "Find your tribe" },
            { icon: MapPin, label: "Local", desc: "Near you" },
            { icon: Heart, label: "Authentic", desc: "Real connections" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-card rounded-xl p-4 shadow-card border border-border/50"
            >
              <f.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3 animate-slide-up">
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            I already have an account
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 mb-8">
          By continuing, you agree to our <Link className="underline" to="/community-guidelines">Community Guidelines</Link> and <Link className="underline" to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
};

export default Landing;
