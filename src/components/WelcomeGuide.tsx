import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Calendar, Heart, MapPin, ArrowRight } from "lucide-react";

const slides = [
  {
    icon: Users,
    title: "Discover Communities",
    description: "Find and join communities that match your interests. Connect with like-minded people near you.",
  },
  {
    icon: Heart,
    title: "Get Matched",
    description: "Our smart matching finds people who share your values and interests. Accept matches to start connecting.",
  },
  {
    icon: MessageCircle,
    title: "Chat & Connect",
    description: "Send messages to your matches and community members. Build real friendships and relationships.",
  },
  {
    icon: Calendar,
    title: "Join Events",
    description: "Discover local events and meetups. RSVP and meet your community in person.",
  },
  {
    icon: MapPin,
    title: "Explore Nearby",
    description: "See what's happening around you. Events, communities, and people — all on the map.",
  },
];

interface WelcomeGuideProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeGuide({ open, onClose }: WelcomeGuideProps) {
  const [step, setStep] = useState(0);
  const current = slides[step];
  const Icon = current.icon;

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="flex flex-col items-center text-center p-8 pb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="p-6 pt-2 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button variant="gradient" className="flex-1 gap-2" onClick={next}>
            {step < slides.length - 1 ? (
              <>Next <ArrowRight className="h-4 w-4" /></>
            ) : (
              "Get Started!"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
