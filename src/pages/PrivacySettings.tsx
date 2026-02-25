import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, MapPin, MessageCircle, Mail, UserX, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PrivacyState {
  show_in_search: boolean;
  show_location: boolean;
  allow_messages: boolean;
  allow_invitations: boolean;
}

interface BlockedUser {
  blocked_id: string;
  id: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState<PrivacyState>({
    show_in_search: true, show_location: true, allow_messages: true, allow_invitations: true,
  });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, blockedRes] = await Promise.all([
        supabase.from("profiles").select("show_in_search, show_location, allow_messages, allow_invitations").eq("user_id", user.id).single(),
        supabase.from("blocked_users").select("id, blocked_id").eq("blocker_id", user.id),
      ]);

      if (profileRes.data) {
        setPrivacy({
          show_in_search: (profileRes.data as any).show_in_search ?? true,
          show_location: (profileRes.data as any).show_location ?? true,
          allow_messages: (profileRes.data as any).allow_messages ?? true,
          allow_invitations: (profileRes.data as any).allow_invitations ?? true,
        });
      }

      if (blockedRes.data) {
        // Fetch profiles for blocked users
        const ids = blockedRes.data.map((b) => b.blocked_id);
        if (ids.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url").in("user_id", ids);
          const mapped = blockedRes.data.map((b) => ({
            ...b,
            profile: profiles?.find((p) => p.user_id === b.blocked_id) || undefined,
          }));
          setBlockedUsers(mapped);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleToggle = async (key: keyof PrivacyState) => {
    const newVal = !privacy[key];
    setPrivacy((prev) => ({ ...prev, [key]: newVal }));
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ [key]: newVal } as any).eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      setPrivacy((prev) => ({ ...prev, [key]: !newVal }));
      toast.error("Failed to update setting");
    }
  };

  const handleUnblock = async (blockedId: string, rowId: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("id", rowId);
    if (error) return toast.error("Failed to unblock user");
    setBlockedUsers((prev) => prev.filter((b) => b.id !== rowId));
    toast.success("User unblocked");
  };

  const toggleItems = [
    { key: "show_in_search" as const, icon: Eye, label: "Show in Search", desc: "Allow others to find you in search results" },
    { key: "show_location" as const, icon: MapPin, label: "Show Location", desc: "Display your city on your profile" },
    { key: "allow_messages" as const, icon: MessageCircle, label: "Allow Messages", desc: "Let others send you direct messages" },
    { key: "allow_invitations" as const, icon: Mail, label: "Allow Invitations", desc: "Receive community and event invitations" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Privacy & Safety</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* Privacy Toggles */}
        <section className="bg-card rounded-xl shadow-card border border-border/50 divide-y divide-border">
          {toggleItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch checked={privacy[item.key]} onCheckedChange={() => handleToggle(item.key)} />
            </div>
          ))}
        </section>

        {/* Blocked Users */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Blocked Users</p>
          <div className="bg-card rounded-xl shadow-card border border-border/50">
            {blockedUsers.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <UserX className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No blocked users</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {blockedUsers.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {b.profile?.profile_image_url ? (
                          <img src={b.profile.profile_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {b.profile?.first_name || "Unknown"} {b.profile?.last_name || "User"}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleUnblock(b.blocked_id, b.id)}>
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacySettings;
