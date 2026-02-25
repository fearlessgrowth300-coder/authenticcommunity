import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, Share2, MapPin, Users, Calendar, ChevronRight, Loader2 } from "lucide-react";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  bio: string | null;
  profile_image_url: string | null;
  location_city: string | null;
  location_state: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [stats, setStats] = useState({ connections: 0, communities: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, interestsRes, valuesRes, connectionsRes, membersRes, attendeesRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, age, bio, profile_image_url, location_city, location_state").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_interests").select("interest_name").eq("user_id", user.id),
        supabase.from("user_values").select("value_name").eq("user_id", user.id),
        supabase.from("connections").select("id").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase.from("community_members").select("id").eq("user_id", user.id),
        supabase.from("event_attendees").select("id").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setInterests(interestsRes.data?.map((i) => i.interest_name) || []);
      setValues(valuesRes.data?.map((v) => v.value_name) || []);
      setStats({
        connections: connectionsRes.data?.length || 0,
        communities: membersRes.data?.length || 0,
        events: attendeesRes.data?.length || 0,
      });
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : "User";
  const initials = (profile?.first_name?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
          <div className="flex gap-2">
            <button className="text-muted-foreground"><Share2 className="h-5 w-5" /></button>
            <button onClick={() => navigate("/settings")} className="text-muted-foreground"><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-5">
        {/* Profile card */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5 text-center">
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt="Your profile"
              className="h-24 w-24 rounded-full object-cover mx-auto border-4 border-primary/20"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-muted mx-auto border-4 border-primary/20 flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {initials}
            </div>
          )}
          <h2 className="text-xl font-bold text-foreground mt-3">
            {displayName}{profile?.age ? `, ${profile.age}` : ""}
          </h2>
          {(profile?.location_city || profile?.location_state) && (
            <div className="flex items-center justify-center gap-1 text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">
                {profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ""}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-3">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
          </Button>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Interests & Values */}
        {(interests.length > 0 || values.length > 0) && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
            {interests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <Badge key={i} variant="outline">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
            {values.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Values</h3>
                <div className="flex flex-wrap gap-1.5">
                  {values.map((v) => (
                    <Badge key={v} className="bg-accent text-accent-foreground border-0">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats links */}
        <div className="bg-card rounded-xl shadow-card border border-border/50 divide-y divide-border">
          {[
            { icon: Users, label: "My Connections", value: stats.connections.toString() },
            { icon: Users, label: "My Communities", value: stats.communities.toString() },
            { icon: Calendar, label: "My Events", value: stats.events.toString() },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
              <span className="text-sm text-muted-foreground mr-1">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
