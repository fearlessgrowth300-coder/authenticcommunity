import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserX, Ban, Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; userId?: string; name?: string }>({ open: false });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7days");
  const [detailUser, setDetailUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("account_status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: string; reason: string; duration: string }) => {
      const suspendUntil = new Date();
      if (duration === "permanent") suspendUntil.setFullYear(2099);
      else if (duration === "7days") suspendUntil.setDate(suspendUntil.getDate() + 7);
      else if (duration === "30days") suspendUntil.setDate(suspendUntil.getDate() + 30);

      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: "suspended",
          suspended_until: suspendUntil.toISOString(),
          suspension_reason: reason,
        })
        .eq("user_id", userId);
      if (error) throw error;

      // Log action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "suspend_user",
        target_type: "user",
        target_id: userId,
        details: { reason, duration },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User suspended");
      setSuspendDialog({ open: false });
      setSuspendReason("");
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "active", suspended_until: null, suspension_reason: null })
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "reactivate_user",
        target_type: "user",
        target_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User reactivated");
    },
  });

  const getStatusBadge = (status: string | null) => {
    const s = status || "active";
    const map: Record<string, "default" | "destructive" | "secondary"> = {
      active: "default",
      suspended: "destructive",
      deleted: "secondary",
    };
    return <Badge variant={map[s] || "secondary"} className="text-[10px]">{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Users Management</h2>
        <p className="text-muted-foreground text-sm">{users?.length ?? 0} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
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
                     <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Gender</TableHead>
                    <TableHead className="hidden lg:table-cell">Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {u.first_name || "Unknown"} {u.last_name || ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {[u.location_city, u.location_state, u.location_country].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {u.gender || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {u.age || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(u.account_status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailUser(u)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {(u.account_status || "active") === "active" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setSuspendDialog({ open: true, userId: u.user_id, name: `${u.first_name} ${u.last_name}` })
                                }
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => reactivateMutation.mutate(u.user_id)}>
                                <UserX className="h-4 w-4 mr-2" /> Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {suspendDialog.name}'s account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={suspendDuration} onValueChange={setSuspendDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!suspendReason || suspendMutation.isPending}
              onClick={() => {
                if (suspendDialog.userId) {
                  suspendMutation.mutate({
                    userId: suspendDialog.userId,
                    reason: suspendReason,
                    duration: suspendDuration,
                  });
                }
              }}
            >
              {suspendMutation.isPending ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{detailUser.first_name} {detailUser.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(detailUser.account_status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{detailUser.location_city || "—"}, {detailUser.location_state || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(detailUser.created_at), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{detailUser.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{detailUser.age || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Bio</p>
                  <p className="font-medium">{detailUser.bio || "No bio"}</p>
                </div>
                {detailUser.suspension_reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Suspension Reason</p>
                    <p className="font-medium text-destructive">{detailUser.suspension_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
