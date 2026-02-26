import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flag, CheckCircle, XCircle, Eye, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
        .update({
          status: "resolved",
          resolution,
          resolved_at: new Date().toISOString(),
        })
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

  const getSeverityBadge = (severity: string | null) => {
    const s = severity || "medium";
    const map: Record<string, "default" | "destructive" | "secondary"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive",
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

      {/* Filter */}
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

      {/* Reports Table */}
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
                          <DropdownMenuContent align="end">
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
            <Button variant="outline" onClick={() => setResolveDialog({ open: false })}>
              Cancel
            </Button>
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
