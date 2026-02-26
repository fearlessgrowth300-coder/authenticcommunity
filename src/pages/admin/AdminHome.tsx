import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, Calendar, Flag, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function StatCard({ title, value, icon: Icon, loading }: {
  title: string; value: number | string; icon: any; loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, communities, events, reports, messages] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("communities").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("messages").select("*", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: users.count ?? 0,
        totalCommunities: communities.count ?? 0,
        totalEvents: events.count ?? 0,
        pendingReports: reports.count ?? 0,
        totalMessages: messages.count ?? 0,
      };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, created_at, profile_image_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: recentReports } = useQuery({
    queryKey: ["admin-recent-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, report_type, reason, status, created_at, severity")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: recentAlerts } = useQuery({
    queryKey: ["admin-system-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground text-sm">Platform metrics at a glance</p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={isLoading} />
        <StatCard title="Communities" value={stats?.totalCommunities ?? 0} icon={Building2} loading={isLoading} />
        <StatCard title="Events" value={stats?.totalEvents ?? 0} icon={Calendar} loading={isLoading} />
        <StatCard title="Pending Reports" value={stats?.pendingReports ?? 0} icon={Flag} loading={isLoading} />
        <StatCard title="Messages" value={stats?.totalMessages ?? 0} icon={MessageSquare} loading={isLoading} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers?.length ? recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {u.first_name || "Unknown"} {u.last_name || ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(u.created_at), "MMM d, yyyy")}
                </span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No users yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReports?.length ? recentReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === "pending" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.status}
                  </Badge>
                  <span className="text-foreground truncate max-w-[150px]">{r.reason}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "MMM d")}
                </span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No reports yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {recentAlerts && recentAlerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">System Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <Badge variant={a.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                  {a.severity}
                </Badge>
                <span className="text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(a.created_at), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
