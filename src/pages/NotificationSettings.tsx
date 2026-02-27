import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageCircle, Heart, CalendarDays, Newspaper, Clock, Mail, Loader2, BellRing } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotifSettings {
  notify_matches: boolean;
  notify_messages: boolean;
  notify_communities: boolean;
  notify_events: boolean;
  notify_digest: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  email_notifications: boolean;
}

const defaults: NotifSettings = {
  notify_matches: true, notify_messages: true, notify_communities: true,
  notify_events: true, notify_digest: true, quiet_hours_start: "", quiet_hours_end: "",
  email_notifications: true,
};

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotifSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("notification_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setSettings({
          notify_matches: (data as any).notify_matches ?? true,
          notify_messages: (data as any).notify_messages ?? true,
          notify_communities: (data as any).notify_communities ?? true,
          notify_events: (data as any).notify_events ?? true,
          notify_digest: (data as any).notify_digest ?? true,
          quiet_hours_start: (data as any).quiet_hours_start || "",
          quiet_hours_end: (data as any).quiet_hours_end || "",
          email_notifications: (data as any).email_notifications ?? true,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const save = async (partial: Partial<NotifSettings>) => {
    if (!user) return;
    setSaving(true);
    const updated = { ...settings, ...partial };
    setSettings(updated);

    const payload: any = { ...updated, user_id: user.id };
    const { error } = await supabase.from("notification_settings").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setSettings(settings); // revert
      toast.error("Failed to save");
    }
  };

  const toggleItems = [
    { key: "notify_matches" as const, icon: Heart, label: "Match Suggestions", desc: "New match recommendations" },
    { key: "notify_messages" as const, icon: MessageCircle, label: "Messages", desc: "New direct messages" },
    { key: "notify_communities" as const, icon: Users, label: "Communities", desc: "Community activity and updates" },
    { key: "notify_events" as const, icon: CalendarDays, label: "Events", desc: "Event reminders and updates" },
    { key: "notify_digest" as const, icon: Newspaper, label: "Weekly Digest", desc: "Summary of activity" },
    { key: "email_notifications" as const, icon: Mail, label: "Email Notifications", desc: "Receive notifications via email" },
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
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* Push Notification Section */}
        {isSupported && (
          <section className="bg-card rounded-xl shadow-card border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BellRing className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Get alerts even when the app is closed</p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    const ok = await subscribe();
                    if (ok) toast.success("Push notifications enabled!");
                    else toast.error("Permission denied");
                  } else {
                    await unsubscribe();
                    toast.success("Push notifications disabled");
                  }
                }}
              />
            </div>
          </section>
        )}

        {/* Toggle Section */}
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
              <Switch
                checked={settings[item.key]}
                onCheckedChange={(checked) => save({ [item.key]: checked })}
              />
            </div>
          ))}
        </section>

        {/* Quiet Hours */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Quiet Hours</p>
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Do Not Disturb</p>
            </div>
            <p className="text-xs text-muted-foreground">Mute push notifications during these hours.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start</Label>
                <Input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => save({ quiet_hours_start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => save({ quiet_hours_end: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NotificationSettings;
