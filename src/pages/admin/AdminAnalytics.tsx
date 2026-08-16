import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(330, 81%, 60%)", "hsl(260, 80%, 55%)", "hsl(150, 60%, 50%)", "hsl(40, 80%, 55%)"];

export default function AdminAnalytics() {
  const [tab, setTab] = useState("overview");

  // User growth data (last 30 days)
  const { data: userGrowth, isLoading: loadingGrowth } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

      const days = eachDayOfInterval({ start: subDays(new Date(), 30), end: new Date() });
      const grouped = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = data?.filter((p) => format(new Date(p.created_at), "yyyy-MM-dd") === dayStr).length ?? 0;
        return { date: format(day, "MMM d"), users: count };
      });
      return grouped;
    },
  });

  // Community stats
  const { data: communityStats } = useQuery({
    queryKey: ["admin-community-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("communities")
        .select("category, member_count");

      const byCategory: Record<string, number> = {};
      data?.forEach((c) => {
        const cat = c.category || "Other";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    },
  });

  // Engagement stats
  const { data: engagement } = useQuery({
    queryKey: ["admin-engagement"],
    queryFn: async () => {
      const [msgs, connections, eventAttendees, communities] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("connections").select("*", { count: "exact", head: true }),
        supabase.from("event_attendees").select("*", { count: "exact", head: true }),
        supabase.from("community_members").select("*", { count: "exact", head: true }),
      ]);
      return [
        { name: "Messages", value: msgs.count ?? 0 },
        { name: "Connections", value: connections.count ?? 0 },
        { name: "Event RSVPs", value: eventAttendees.count ?? 0 },
        { name: "Community Joins", value: communities.count ?? 0 },
      ];
    },
  });

  // Event attendance trend
  const { data: eventTrend } = useQuery({
    queryKey: ["admin-event-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("events")
        .select("event_date, attendee_count")
        .gte("created_at", thirtyDaysAgo)
        .order("event_date", { ascending: true });

      return data?.map((e) => ({
        date: e.event_date ? format(new Date(e.event_date), "MMM d") : "TBD",
        attendees: e.attendee_count ?? 0,
      })) ?? [];
    },
  });

  // The launch funnel is event-based, so it measures actual member activation
  // instead of treating account creation as success.
  const { data: activation } = useQuery({
    queryKey: ["admin-activation-funnel"],
    queryFn: async () => {
      const events = ["profile_completed", "community_joined", "first_story_created", "event_rsvp_going"];
      const { data } = await (supabase as any).from("analytics_events").select("event_name, user_id").in("event_name", events);
      return events.map((event_name) => ({
        name: event_name.replaceAll("_", " "),
        value: new Set((data || []).filter((event: any) => event.event_name === event_name).map((event: any) => event.user_id)).size,
      }));
    },
  });

  const { data: reliability } = useQuery({
    queryKey: ["admin-reliability"],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();
      const { count } = await (supabase as any).from("client_errors").select("*", { count: "exact", head: true }).gte("created_at", since);
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics & Insights</h2>
        <p className="text-muted-foreground text-sm">Platform performance metrics</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Client errors (7 days)</p><p className="text-2xl font-bold text-foreground">{reliability ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Captured by the production error boundary.</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Activation measurement</p><p className="text-sm font-medium text-foreground mt-1">Profile → community → story/message → RSVP</p><p className="mt-1 text-xs text-muted-foreground">Use the funnel below to find where new members drop off.</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Invite Cohort Activation Funnel</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activation?.map((step) => <div key={step.name} className="rounded-lg bg-muted/50 p-3"><p className="text-xs capitalize text-muted-foreground">{step.name}</p><p className="mt-1 text-2xl font-bold">{step.value}</p></div>)}
            </CardContent>
          </Card>
          {/* Engagement Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {engagement?.map((e, i) => (
              <Card key={e.name}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{e.name}</p>
                  <p className="text-2xl font-bold text-foreground">{e.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">User Growth (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              {loadingGrowth ? <Skeleton className="h-[250px]" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">New User Signups (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              {loadingGrowth ? <Skeleton className="h-[300px]" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="users" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communities" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Communities by Category</CardTitle></CardHeader>
              <CardContent>
                {communityStats?.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={communityStats} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {communityStats.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No community data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {communityStats?.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <span className="text-sm font-medium">{c.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Event Attendance Trend</CardTitle></CardHeader>
            <CardContent>
              {eventTrend?.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="attendees" fill="hsl(330, 81%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No event data</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {engagement?.map((e) => (
              <Card key={e.name}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{e.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{e.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
