import { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Camera, Check, Loader2, Plus, Sparkles, X, Image as ImageIcon } from "lucide-react";
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
import { countries, statesByCountry } from "@/lib/countries";

const totalSteps = 6;
const stepLabels = ["Profile", "Location", "Interests", "Values", "Preferences", "Photos"];

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { step } = useParams();
  const { user, refreshOnboarding } = useAuth();
  const currentStep = parseInt(step || "1");
  const isCompleteStep = step === "complete" || location.pathname === "/onboarding/complete";

  // Step 1: Profile
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 4: Values
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // Step 5: Preferences
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 80]);
  const [maxDistance, setMaxDistance] = useState(100);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [matchNotifs, setMatchNotifs] = useState(true);

  // Step 6: Photos
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const photoRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [saving, setSaving] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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
        toast.error("Permission denied. Please enter manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const toggleValue = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : prev.length < 5 ? [...prev, value] : prev
    );
  };

  const toggleTargetCountry = (code: string) => {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handlePhotoSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newPhotos = [...photos];
    newPhotos[index] = file;
    setPhotos(newPhotos);
    const newPreviews = [...photoPreviews];
    newPreviews[index] = URL.createObjectURL(file);
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
    const newPreviews = [...photoPreviews];
    newPreviews[index] = null;
    setPhotoPreviews(newPreviews);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upload avatar
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      // Upsert profile to guarantee row exists for OAuth and email signups
      const profilePayload = {
        user_id: user.id,
        location_city: city || null,
        location_state: state || null,
        location_country: country || null,
        bio: bio || null,
        gender: gender || null,
        age: age ? parseInt(age) : null,
        onboarding_completed: true,
        ...(avatarUrl ? { profile_image_url: avatarUrl } : {}),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "user_id" });
      if (profileError) throw profileError;

      // Preferences were introduced after the original profiles table. Save
      // them separately so a newly provisioned project can still complete
      // onboarding while its schema cache catches up.
      const { error: preferenceError } = await supabase
        .from("profiles")
        .update({
          occupation: occupation || null,
          looking_for: lookingFor || null,
          target_countries: targetCountries.length > 0 ? targetCountries : null,
          min_age: ageRange[0],
          max_age: ageRange[1],
          max_distance_km: maxDistance,
          onboarding_step: 6,
        })
        .eq("user_id", user.id);
      if (preferenceError && preferenceError.code !== "PGRST204") throw preferenceError;
      if (preferenceError) console.warn("Optional onboarding preferences will be saved after the database schema refresh.", preferenceError.message);

      // Save interests
      await supabase.from("user_interests").delete().eq("user_id", user.id);
      if (selectedInterests.length > 0) {
        const interestRows = selectedInterests.map((name) => {
          const cat = interestCategories.find((c) => c.interests.includes(name));
          return { user_id: user.id, interest_name: name, interest_category: cat?.name || null };
        });
        await supabase.from("user_interests").insert(interestRows);
      }

      // Save values
      await supabase.from("user_values").delete().eq("user_id", user.id);
      if (selectedValues.length > 0) {
        const valueRows = selectedValues.map((name) => ({ user_id: user.id, value_name: name }));
        await supabase.from("user_values").insert(valueRows);
      }

      // Save notification settings
      const { data: existingSettings } = await supabase.from("notification_settings").select("id").eq("user_id", user.id).maybeSingle();
      if (existingSettings) {
        await supabase.from("notification_settings").update({
          email_notifications: emailNotifs,
          notify_matches: matchNotifs,
        }).eq("user_id", user.id);
      } else {
        await supabase.from("notification_settings").insert({
          user_id: user.id,
          email_notifications: emailNotifs,
          notify_matches: matchNotifs,
        });
      }

      // Refresh onboarding state and navigate
      await refreshOnboarding();
      navigate("/onboarding/complete", { replace: true });
    } catch (err: any) {
      console.error("Onboarding save error:", err);
      toast.error(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
      saveProfile();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) navigate(`/onboarding/${currentStep - 1}`);
    else navigate("/signup");
  };

  // Complete screen
  if (isCompleteStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
        <div className="animate-fade-in space-y-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-foreground">You're all set!</h1>
          <p className="text-muted-foreground">Welcome to Authentic Community</p>
          <div className="space-y-3 text-left bg-card rounded-xl p-6 shadow-card border border-border/50">
            {[
              "AI-powered matching",
              "Real communities near you",
              "Authentic connections",
              "Local events",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-sm text-foreground">{feat}</span>
              </div>
            ))}
          </div>
          <Button variant="gradient" size="lg" className="w-full" onClick={async () => {
            try {
              await refreshOnboarding();
            } catch {}
            navigate("/dashboard", { replace: true });
          }}>
            <Sparkles className="h-4 w-4 mr-2" /> Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevStep} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
        {currentStep < totalSteps ? (
          <button onClick={nextStep} className="text-sm text-primary font-medium">Skip</button>
        ) : <div className="w-8" />}
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {stepLabels.map((_, i) => (
          <div key={i} className={cn("h-1 rounded-full flex-1 transition-colors", i < currentStep ? "gradient-primary" : "bg-muted")} />
        ))}
      </div>

      <div className="animate-fade-in flex-1 overflow-y-auto pb-2">
        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Complete your profile</h2>
            <p className="text-muted-foreground text-sm mb-6">Tell us about yourself</p>
            <div className="space-y-5">
              <div className="flex justify-center">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
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
              <div className="space-y-2">
                <Label>Bio <span className="text-muted-foreground text-xs">({bio.length}/500)</span></Label>
                <Textarea
                  placeholder="Tell people what makes you, you..."
                  className="min-h-[100px] resize-none"
                  value={bio}
                  maxLength={500}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                <Label>Occupation</Label>
                <Input placeholder="e.g. Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>What do you want to build?</Label>
                <Select value={lookingFor} onValueChange={setLookingFor}>
                  <SelectTrigger><SelectValue placeholder="Choose your connection goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friends">Make new friends</SelectItem>
                    <SelectItem value="activity-partners">Find activity partners</SelectItem>
                    <SelectItem value="small-group">Join a consistent small group</SelectItem>
                    <SelectItem value="new-to-city">Meet people after moving</SelectItem>
                    <SelectItem value="community">Find a local community</SelectItem>
                    <SelectItem value="networking">Build a professional network</SelectItem>
                    <SelectItem value="all">Open to connection</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">We use this to make introductions that fit what you want—not to rank your popularity.</p>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Set your location</h2>
            <p className="text-muted-foreground text-sm mb-6">Help us find people near you</p>
            <div className="space-y-4">
              <Button variant="outline" className="w-full gap-2" onClick={detectLocation} disabled={detectingLocation}>
                {detectingLocation ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Detecting...</>
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
              <p className="text-xs text-muted-foreground">Tap the map to set your location</p>
            </div>
          </>
        )}

        {/* Step 3: Interests */}
        {currentStep === 3 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">What are you into?</h2>
            <p className="text-muted-foreground text-sm mb-2">Pick up to 5 interests ({selectedInterests.length}/5)</p>
            <p className="text-xs text-primary mb-6">These choices personalize the posts, videos, stories, people, communities, and events you see. You can change them later.</p>
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

        {/* Step 4: Values */}
        {currentStep === 4 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">What do you value most?</h2>
            <p className="text-muted-foreground text-sm mb-6">Choose 3-5 values ({selectedValues.length}/5)</p>
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

        {/* Step 5: Preferences */}
        {currentStep === 5 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Set your preferences</h2>
            <p className="text-muted-foreground text-sm mb-6">Customize your experience</p>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Show me people from</Label>
                <p className="text-xs text-muted-foreground">Select countries (leave empty for your country only)</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {countries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => toggleTargetCountry(c.code)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        targetCountries.includes(c.code)
                          ? "gradient-primary text-primary-foreground border-transparent"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Age range: {ageRange[0]} - {ageRange[1]}</Label>
                <Slider
                  min={18}
                  max={80}
                  step={1}
                  value={ageRange}
                  onValueChange={(v) => setAgeRange(v as [number, number])}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Max distance: {maxDistance} km</Label>
                <Slider
                  min={1}
                  max={500}
                  step={5}
                  value={[maxDistance]}
                  onValueChange={(v) => setMaxDistance(v[0])}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Email notifications</Label>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Match notifications</Label>
                  <Switch checked={matchNotifs} onCheckedChange={setMatchNotifs} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 6: Photos */}
        {currentStep === 6 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Add more photos</h2>
            <p className="text-muted-foreground text-sm mb-6">Show your authentic self (optional)</p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((_, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => { photoRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoSelect(index, e)}
                  />
                  <button
                    onClick={() => photoRefs.current[index]?.click()}
                    className="w-full aspect-square rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 transition-colors overflow-hidden"
                  >
                    {photoPreviews[index] ? (
                      <img src={photoPreviews[index]!} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        {index === 0 && avatarPreview ? (
                          <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1">Photo {index + 1}</span>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                  {photoPreviews[index] && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="py-6">
        <Button variant="gradient" size="lg" className="w-full" onClick={nextStep} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
          ) : currentStep === totalSteps ? "Complete Onboarding" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
