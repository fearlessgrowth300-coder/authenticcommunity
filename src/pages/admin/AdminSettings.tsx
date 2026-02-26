import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";

type SettingsMap = Record<string, any>;

function useAdminSetting(key: string, defaultValue: any) {
  return useQuery({
    queryKey: ["admin-setting", key],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .maybeSingle();
      return (data as any)?.setting_value ?? defaultValue;
    },
  });
}

function useSaveSetting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data: existing } = await (supabase as any)
        .from("admin_settings")
        .select("id")
        .eq("setting_key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("admin_settings")
          .update({ setting_value: value, updated_by: user!.id, updated_at: new Date().toISOString() })
          .eq("setting_key", key);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("admin_settings")
          .insert({ setting_key: key, setting_value: value, updated_by: user!.id });
        if (error) throw error;
      }

      await supabase.from("admin_logs").insert({
        admin_id: user!.id,
        action: "update_setting",
        target_type: "setting",
        details: { key, value },
      });
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-setting", key] });
      toast.success("Setting saved");
    },
    onError: () => toast.error("Failed to save setting"),
  });
}

function GeneralSettings() {
  const { data: general } = useAdminSetting("general", { appName: "Community Connect", supportEmail: "", description: "" });
  const saveMutation = useSaveSetting();
  const [appName, setAppName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [description, setDescription] = useState("");

  const loaded = general && appName === "";
  if (loaded) {
    setAppName(general.appName || "Community Connect");
    setSupportEmail(general.supportEmail || "");
    setDescription(general.description || "");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General Settings</CardTitle>
        <CardDescription>Basic application configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>App Name</Label>
          <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="App Name" />
        </div>
        <div className="space-y-2">
          <Label>Support Email</Label>
          <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@example.com" />
        </div>
        <div className="space-y-2">
          <Label>App Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your application..." />
        </div>
        <Button
          onClick={() => saveMutation.mutate({ key: "general", value: { appName, supportEmail, description } })}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function FeatureToggles() {
  const { data: features } = useAdminSetting("features", {
    matching: true, communities: true, events: true, messaging: true, premium: false,
  });
  const saveMutation = useSaveSetting();
  const [state, setState] = useState<Record<string, boolean> | null>(null);

  const current = state || features || {};

  const toggle = (key: string) => {
    const updated = { ...current, [key]: !current[key] };
    setState(updated);
  };

  const items = [
    { key: "matching", label: "Matching", desc: "Enable AI-powered friend matching" },
    { key: "communities", label: "Communities", desc: "Allow users to create and join communities" },
    { key: "events", label: "Events", desc: "Enable event creation and attendance" },
    { key: "messaging", label: "Messaging", desc: "Allow direct messaging between users" },
    { key: "premium", label: "Premium Subscriptions", desc: "Enable paid subscription features" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Toggles</CardTitle>
        <CardDescription>Enable or disable app features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, i) => (
          <div key={item.key}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={current[item.key] ?? true} onCheckedChange={() => toggle(item.key)} />
            </div>
            {i < items.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        <Button
          onClick={() => saveMutation.mutate({ key: "features", value: state || current })}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Feature Toggles"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ModerationSettings() {
  const { data: moderation } = useAdminSetting("moderation", {
    autoModeration: false, profanityFilter: false, spamDetection: false,
  });
  const saveMutation = useSaveSetting();
  const [state, setState] = useState<Record<string, boolean> | null>(null);

  const current = state || moderation || {};

  const toggle = (key: string) => {
    const updated = { ...current, [key]: !current[key] };
    setState(updated);
  };

  const items = [
    { key: "autoModeration", label: "Auto-Moderation", desc: "Automatically flag suspicious content" },
    { key: "profanityFilter", label: "Profanity Filter", desc: "Block messages containing profanity" },
    { key: "spamDetection", label: "Spam Detection", desc: "Detect and block spam messages" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Moderation Rules</CardTitle>
        <CardDescription>Configure content moderation behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, i) => (
          <div key={item.key}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={current[item.key] ?? false} onCheckedChange={() => toggle(item.key)} />
            </div>
            {i < items.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        <Button
          onClick={() => saveMutation.mutate({ key: "moderation", value: state || current })}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Moderation Rules"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-logs-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Recent Admin Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : logs?.length ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <Badge variant="outline" className="text-[10px] mr-2">{log.action}</Badge>
                  <span className="text-muted-foreground">{log.target_type}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No admin activity yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState("general");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Settings</h2>
        <p className="text-muted-foreground text-sm">Configure application settings</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeatureToggles />
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <ModerationSettings />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
