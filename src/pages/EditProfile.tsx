import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { interestCategories, valueOptions } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, interestsRes, valuesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_interests").select("interest_name").eq("user_id", user.id),
        supabase.from("user_values").select("value_name").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setFirstName(p.first_name || "");
        setLastName(p.last_name || "");
        setAge(p.age?.toString() || "");
        setBio(p.bio || "");
        setCity(p.location_city || "");
        setState(p.location_state || "");
        setProfileImageUrl(p.profile_image_url);
        setGender(p.gender || "");
      }

      setSelectedInterests(interestsRes.data?.map((i) => i.interest_name) || []);
      setSelectedValues(valuesRes.data?.map((v) => v.value_name) || []);
      setLoading(false);
    };

    load();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload photo");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Add cache buster
    const url = `${publicUrl}?t=${Date.now()}`;
    setProfileImageUrl(url);
    setUploading(false);
    toast.success("Photo uploaded!");
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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profile
      await supabase.from("profiles").update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        age: age ? parseInt(age) : null,
        bio: bio.trim() || null,
        gender: gender || null,
        location_city: city.trim() || null,
        location_state: state.trim() || null,
        profile_image_url: profileImageUrl,
      }).eq("user_id", user.id);

      // Update interests: delete then insert
      await supabase.from("user_interests").delete().eq("user_id", user.id);
      if (selectedInterests.length > 0) {
        await supabase.from("user_interests").insert(
          selectedInterests.map((name) => ({ user_id: user.id, interest_name: name }))
        );
      }

      // Update values: delete then insert
      await supabase.from("user_values").delete().eq("user_id", user.id);
      if (selectedValues.length > 0) {
        await supabase.from("user_values").insert(
          selectedValues.map((name) => ({ user_id: user.id, value_name: name }))
        );
      }

      toast.success("Profile updated!");
      navigate("/profile");
    } catch {
      toast.error("Failed to save profile");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
          </div>
          <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile" className="h-28 w-28 rounded-full object-cover border-4 border-primary/20" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {(firstName[0] || "U").toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full gradient-primary flex items-center justify-center border-2 border-background"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Camera className="h-4 w-4 text-primary-foreground" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
        </div>

        {/* Basic info */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Age</Label>
              <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gender</Label>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>

        {/* Bio */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">About You</h3>
          <Textarea
            placeholder="Tell others about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        {/* Interests */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Interests</h3>
          {interestCategories.map((cat) => (
            <div key={cat.name}>
              <p className="text-xs text-muted-foreground mb-1.5">{cat.emoji} {cat.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                      selectedInterests.includes(interest)
                        ? "gradient-primary text-primary-foreground border-transparent"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Values</h3>
          <div className="flex flex-wrap gap-1.5">
            {valueOptions.map((value) => (
              <button
                key={value}
                onClick={() => toggleValue(value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  selectedValues.includes(value)
                    ? "bg-accent text-accent-foreground border-transparent"
                    : "bg-background text-muted-foreground border-border hover:border-accent/50"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
