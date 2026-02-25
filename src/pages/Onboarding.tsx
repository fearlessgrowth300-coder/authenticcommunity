import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { interestCategories, valueOptions } from "@/lib/mockData";

const steps = ["Location", "Interests", "Values", "Photo & Bio"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { step } = useParams();
  const currentStep = parseInt(step || "1");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleValue = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const nextStep = () => {
    if (currentStep < 4) navigate(`/onboarding/${currentStep + 1}`);
    else navigate("/dashboard");
  };

  const prevStep = () => {
    if (currentStep > 1) navigate(`/onboarding/${currentStep - 1}`);
    else navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevStep} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
        {currentStep < 4 ? (
          <button onClick={nextStep} className="text-sm text-primary font-medium">Skip</button>
        ) : <div className="w-8" />}
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-1 rounded-full flex-1 transition-colors", i < currentStep ? "gradient-primary" : "bg-muted")} />
        ))}
      </div>

      <div className="animate-fade-in flex-1">
        {currentStep === 1 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Where are you located?</h2>
            <p className="text-muted-foreground text-sm mb-6">We'll find communities and connections near you.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="San Francisco" className="pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="California" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="United States" />
                </div>
              </div>
              {/* Placeholder map */}
              <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center border border-border">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Map will appear here</p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">What are you into?</h2>
            <p className="text-muted-foreground text-sm mb-6">Pick at least 3 interests so we can find your people.</p>
            <div className="space-y-5">
              {interestCategories.map((cat) => (
                <div key={cat.name}>
                  <p className="text-sm font-semibold text-foreground mb-2">{cat.emoji} {cat.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.interests.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                          selectedInterests.includes(interest)
                            ? "gradient-primary text-primary-foreground border-transparent"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        )}
                      >
                        {selectedInterests.includes(interest) && <Check className="h-3 w-3 inline mr-1" />}
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">What do you value most?</h2>
            <p className="text-muted-foreground text-sm mb-6">Choose 3-5 values that define you.</p>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => toggleValue(value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                    selectedValues.includes(value)
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  )}
                >
                  {selectedValues.includes(value) && <Check className="h-3 w-3 inline mr-1" />}
                  {value}
                </button>
              ))}
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Almost there!</h2>
            <p className="text-muted-foreground text-sm mb-6">Add a photo and tell people about yourself.</p>
            <div className="space-y-5">
              <div className="flex justify-center">
                <button className="w-28 h-28 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-primary/40 transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </button>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea placeholder="Tell people what makes you, you..." className="min-h-[120px] resize-none" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="py-6">
        <Button variant="gradient" size="lg" className="w-full" onClick={nextStep}>
          {currentStep === 4 ? "Complete Profile" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
