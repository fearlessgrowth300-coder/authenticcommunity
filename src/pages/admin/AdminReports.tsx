import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flag, CheckCircle, XCircle, Eye, Loader2, MoreHorizontal, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminReports() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; reportId?: string }>({ open: false });
  const [resolution, setResolution] = useState("");
  const [detailReport, setDetailReport] = useState<any>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; userId?: string; reportId?: string }>({ open: false });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7days");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string; reportId?: string }>({ open: false });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, resolution }: { reportId: string; resolution: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved", resolution, resolved_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "resolve_report",
        target_type: "report",
        target_id: reportId,
        details: { resolution },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report resolved");
      setResolveDialog({ open: false });
      setResolution("");
    },
    onError: () => toast.error("Failed to resolve report"),
  });

  const dismissMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "dismissed" })
        .eq("id", reportId);
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "dismiss_report",
        target_type: "report",
        target_id: reportId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report dismissed");
    },
  });

  const suspendFromReportMutation = useMutation({
    mutationFn: async ({ userId, reason, duration, reportId }: { userId: string; reason: string; duration: string; reportId: string }) => {
      const suspendUntil = new Date();
      if (duration === "permanent") suspendUntil.setFullYear(2099);
      else if (duration === "7days") suspendUntil.setDate(suspendUntil.getDate() + 7);
      else if (duration === "30days") suspendUntil.setDate(suspendUntil.getDate() + 30);
      else if (duration === "90days") suspendUntil.setDate(suspendUntil.getDate() + 90);

      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: "suspended",
          suspended_until: suspendUntil.toISOString(),
          suspension_reason: reason,
        })
        .eq("user_id", userId);
      if (error) throw error;

      // Also resolve the report
      await supabase.from("reports").update({
        status: "resolved",
        resolution: `User suspended (${duration}): ${reason}`,
        resolved_at: new Date().toISOString(),
      }).eq("id", reportId);

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "suspend_user_from_report",
        target_type: "user",
        target_id: userId,
        details: { reason, duration, reportId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("User suspended & report resolved");
      setSuspendDialog({ open: false });
      setSuspendReason("");
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const deleteFromReportMutation = useMutation({
    mutationFn: async ({ userId, reportId }: { userId: string; reportId: string }) => {
      // Permanently delete user data
      await Promise.all([
        supabase.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
        supabase.from("matches").delete().or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
        supabase.from("connections").delete().or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
        supabase.from("community_members").delete().eq("user_id", userId),
        supabase.from("user_likes").delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`),
        supabase.from("user_follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
        supabase.from("stories").delete().eq("user_id", userId),
        supabase.from("notifications").delete().eq("user_id", userId),
        supabase.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      ]);

      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "deleted", is_active: false, first_name: "Deleted", last_name: "User", bio: null, profile_image_url: null })
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("reports").update({
        status: "resolved",
        resolution: "User permanently deleted",
        resolved_at: new Date().toISOString(),
      }).eq("id", reportId);

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "delete_user_from_report",
        target_type: "user",
        target_id: userId,
        details: { permanent: true, reportId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("User permanently deleted & report resolved");
      setDeleteDialog({ open: false });
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const getSeverityBadge = (severity: string | null) => {
    const s = severity || "medium";
    const map: Record<string, "default" | "destructive" | "secondary"> = {
      low: "secondary", medium: "default", high: "destructive", critical: "destructive",
    };
    return <Badge variant={map[s] || "secondary"} className="text-[10px]">{s}</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    const s = status || "pending";
    if (s === "pending") return <Badge variant="destructive" className="text-[10px]">Pending</Badge>;
    if (s === "resolved") return <Badge variant="default" className="text-[10px]">Resolved</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports & Safety</h2>
        <p className="text-muted-foreground text-sm">{reports?.length ?? 0} reports</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.report_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{r.reason}</TableCell>
                      <TableCell>{getSeverityBadge(r.severity)}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setDetailReport(r)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {r.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setResolveDialog({ open: true, reportId: r.id })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => dismissMutation.mutate(r.id)}>
                                  <XCircle className="h-4 w-4 mr-2" /> Dismiss
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {r.reported_user_id && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSuspendReason(r.reason || "");
                                        setSuspendDialog({ open: true, userId: r.reported_user_id!, reportId: r.id });
                                      }}
                                      className="text-amber-600"
                                    >
                                      <Ban className="h-4 w-4 mr-2" /> Suspend User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDeleteDialog({ open: true, userId: r.reported_user_id!, reportId: r.id })}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete User Permanently
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!reports?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>Provide a resolution for this report.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution details..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false })}>Cancel</Button>
            <Button
              disabled={!resolution || resolveMutation.isPending}
              onClick={() => {
                if (resolveDialog.reportId) {
                  resolveMutation.mutate({ reportId: resolveDialog.reportId, resolution });
                }
              }}
            >
              {resolveMutation.isPending ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend from Report Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Reported User</DialogTitle>
            <DialogDescription>Suspend this user's account and resolve the report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={suspendDuration} onValueChange={setSuspendDuration}>
              <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason for suspension..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!suspendReason || suspendFromReportMutation.isPending}
              onClick={() => {
                if (suspendDialog.userId && suspendDialog.reportId) {
                  suspendFromReportMutation.mutate({
                    userId: suspendDialog.userId,
                    reason: suspendReason,
                    duration: suspendDuration,
                    reportId: suspendDialog.reportId,
                  });
                }
              }}
            >
              {suspendFromReportMutation.isPending ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete from Report Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Delete User Permanently</DialogTitle>
            <DialogDescription>
              This will permanently delete the reported user's account, messages, matches, and all data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteFromReportMutation.isPending}
              onClick={() => {
                if (deleteDialog.userId && deleteDialog.reportId) {
                  deleteFromReportMutation.mutate({ userId: deleteDialog.userId, reportId: deleteDialog.reportId });
                }
              }}
            >
              {deleteFromReportMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!detailReport} onOpenChange={() => setDetailReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{detailReport.report_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Severity</p>
                  {getSeverityBadge(detailReport.severity)}
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(detailReport.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(detailReport.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Reason</p>
                <p className="font-medium">{detailReport.reason}</p>
              </div>
              {detailReport.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium">{detailReport.description}</p>
                </div>
              )}
              {detailReport.resolution && (
                <div>
                  <p className="text-muted-foreground">Resolution</p>
                  <p className="font-medium">{detailReport.resolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
