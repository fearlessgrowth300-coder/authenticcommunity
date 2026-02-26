import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Camera, Check, Loader2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { interestCategories, valueOptions } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocationMap } from "@/components/LocationMap";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/constants";

const steps = ["Location", "Interests", "Values", "Photo & Bio"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { step } = useParams();
  const { user, refreshOnboarding } = useAuth();
  const currentStep = parseInt(step || "1");

  // Step 1: Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&types=place,region,country`
          );
          const data = await res.json();
          for (const feat of data.features || []) {
            if (feat.place_type?.includes("place")) setCity(feat.text);
            if (feat.place_type?.includes("region")) setState(feat.text);
            if (feat.place_type?.includes("country")) setCountry(feat.text);
          }
          setLocationDetected(true);
          toast.success("Location detected!");
        } catch {
          toast.error("Could not determine your city");
        }
        setDetectingLocation(false);
      },
      () => {
        toast.error("Permission denied. Please enter your location manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Step 2: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 3: Values
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Step 4: Bio, Photo, Gender & Age
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upload avatar if selected
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      // Update profile with location, bio, and avatar
      const updateData: any = {
        location_city: city || null,
        location_state: state || null,
        location_country: country || null,
        bio: bio || null,
        gender: gender || null,
        age: age ? parseInt(age) : null,
        onboarding_completed: true,
      };
      if (avatarUrl) updateData.profile_image_url = avatarUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Save interests (delete old, insert new)
      await supabase.from("user_interests").delete().eq("user_id", user.id);
      if (selectedInterests.length > 0) {
        const interestRows = selectedInterests.map((name) => {
          const cat = interestCategories.find((c) => c.interests.includes(name));
          return {
            user_id: user.id,
            interest_name: name,
            interest_category: cat?.name || null,
          };
        });
        const { error: interestsError } = await supabase
          .from("user_interests")
          .insert(interestRows);
        if (interestsError) throw interestsError;
      }

      // Save values (delete old, insert new)
      await supabase.from("user_values").delete().eq("user_id", user.id);
      if (selectedValues.length > 0) {
        const valueRows = selectedValues.map((name) => ({
          user_id: user.id,
          value_name: name,
        }));
        const { error: valuesError } = await supabase
          .from("user_values")
          .insert(valueRows);
        if (valuesError) throw valuesError;
      }

      refreshOnboarding();
      toast.success("Profile complete! Let's find your community.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
      saveProfile();
    }
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
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={detectLocation}
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Detecting location...</>
                ) : locationDetected ? (
                  <><Check className="h-4 w-4 text-green-500" /> Location detected</>
                ) : (
                  <><MapPin className="h-4 w-4" /> Use my current location</>
                )}
              </Button>
              <div className="relative flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or enter manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="San Francisco" className="pl-10" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="California" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
              <LocationMap
                onLocationSelect={(_lat, _lng, c, s, co) => {
                  if (c) setCity(c);
                  if (s) setState(s);
                  if (co) setCountry(co);
                }}
                initialLat={mapCenter.lat}
                initialLng={mapCenter.lng}
                className="w-full h-48 rounded-xl overflow-hidden border border-border"
              />
              <p className="text-xs text-muted-foreground">Tap the map or drag the pin to set your location</p>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-primary/40 transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add Photo</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell people what makes you, you..."
                  className="min-h-[120px] resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="py-6">
        <Button variant="gradient" size="lg" className="w-full" onClick={nextStep} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
          ) : currentStep === 4 ? "Complete Profile" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
