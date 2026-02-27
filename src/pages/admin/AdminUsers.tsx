import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserX, Ban, Eye, Loader2, Trash2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; userId?: string; name?: string }>({ open: false });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7days");
  const [detailUser, setDetailUser] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string; name?: string }>({ open: false });

  // Swipe state
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const touchStartRef = useRef<Record<string, number>>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search, statusFilter, genderFilter, ageFilter],
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
      if (genderFilter !== "all") {
        query = query.eq("gender", genderFilter);
      }
      if (ageFilter !== "all") {
        if (ageFilter === "under18") query = query.lt("age", 18);
        else if (ageFilter === "18-25") query = query.gte("age", 18).lte("age", 25);
        else if (ageFilter === "26-35") query = query.gte("age", 26).lte("age", 35);
        else if (ageFilter === "36-50") query = query.gte("age", 36).lte("age", 50);
        else if (ageFilter === "50+") query = query.gt("age", 50);
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

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "deleted", is_active: false })
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "delete_user",
        target_type: "user",
        target_id: userId,
        details: { permanent: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User permanently deleted");
      setDeleteDialog({ open: false });
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "active", suspended_until: null, suspension_reason: null, is_active: true })
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

  const handleTouchStart = (userId: string, x: number) => {
    touchStartRef.current[userId] = x;
  };

  const handleTouchMove = (userId: string, x: number) => {
    const startX = touchStartRef.current[userId];
    if (startX === undefined) return;
    const diff = x - startX;
    setSwipeStates((prev) => ({ ...prev, [userId]: Math.max(-120, Math.min(120, diff)) }));
  };

  const handleTouchEnd = (userId: string, name: string, status: string | null) => {
    const offset = swipeStates[userId] || 0;
    if (offset < -60) {
      // Swipe left → delete (only if suspended)
      if ((status || "active") === "suspended") {
        setDeleteDialog({ open: true, userId, name });
      } else {
        toast.info("Suspend the user first before deleting");
      }
    } else if (offset > 60) {
      // Swipe right → suspend/reactivate
      if ((status || "active") === "active") {
        setSuspendDialog({ open: true, userId, name });
      } else {
        reactivateMutation.mutate(userId);
      }
    }
    setSwipeStates((prev) => ({ ...prev, [userId]: 0 }));
    delete touchStartRef.current[userId];
  };

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
        <p className="text-muted-foreground text-sm">{users?.length ?? 0} total users · Swipe right to suspend, left to delete</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Non-binary">Non-binary</SelectItem>
            <SelectItem value="Prefer not to say">Not specified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Age" /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="under18">Under 18</SelectItem>
            <SelectItem value="18-25">18–25</SelectItem>
            <SelectItem value="26-35">26–35</SelectItem>
            <SelectItem value="36-50">36–50</SelectItem>
            <SelectItem value="50+">50+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Cards - swipeable */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !users?.length ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => {
                const name = `${u.first_name || "Unknown"} ${u.last_name || ""}`.trim();
                const offset = swipeStates[u.user_id] || 0;
                const isSwiping = Math.abs(offset) > 10;
                
                return (
                  <div key={u.id} className="relative overflow-hidden">
                    {/* Background actions revealed on swipe */}
                    <div className="absolute inset-0 flex">
                      {/* Right side (swipe left reveals delete) */}
                      <div className="flex-1" />
                      <div className={cn(
                        "w-28 flex items-center justify-center transition-opacity",
                        offset < -30 ? "opacity-100" : "opacity-0",
                        (u.account_status || "active") === "suspended" ? "bg-destructive" : "bg-muted"
                      )}>
                        <div className="text-center">
                          <Trash2 className="h-5 w-5 mx-auto text-destructive-foreground" />
                          <span className="text-[10px] text-destructive-foreground font-medium">Delete</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "absolute inset-0 flex",
                      offset > 30 ? "opacity-100" : "opacity-0"
                    )}>
                      <div className={cn(
                        "w-28 flex items-center justify-center transition-opacity",
                        (u.account_status || "active") === "active" ? "bg-amber-500" : "bg-green-500"
                      )}>
                        <div className="text-center">
                          {(u.account_status || "active") === "active" ? (
                            <>
                              <Ban className="h-5 w-5 mx-auto text-primary-foreground" />
                              <span className="text-[10px] text-primary-foreground font-medium">Suspend</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-5 w-5 mx-auto text-primary-foreground" />
                              <span className="text-[10px] text-primary-foreground font-medium">Reactivate</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card content */}
                    <div
                      className="relative bg-card flex items-center gap-3 px-4 py-3.5 transition-transform touch-pan-y cursor-grab active:cursor-grabbing"
                      style={{ transform: `translateX(${offset}px)` }}
                      onTouchStart={(e) => handleTouchStart(u.user_id, e.touches[0].clientX)}
                      onTouchMove={(e) => handleTouchMove(u.user_id, e.touches[0].clientX)}
                      onTouchEnd={() => handleTouchEnd(u.user_id, name, u.account_status)}
                      onMouseDown={(e) => handleTouchStart(u.user_id, e.clientX)}
                      onMouseMove={(e) => { if (touchStartRef.current[u.user_id] !== undefined) handleTouchMove(u.user_id, e.clientX); }}
                      onMouseUp={() => handleTouchEnd(u.user_id, name, u.account_status)}
                      onMouseLeave={() => { if (touchStartRef.current[u.user_id] !== undefined) handleTouchEnd(u.user_id, name, u.account_status); }}
                    >
                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0 overflow-hidden">
                        {u.profile_image_url ? (
                          <img src={u.profile_image_url} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          (u.first_name?.[0] || "?").toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <button
                        onClick={() => !isSwiping && setDetailUser(u)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                          {getStatusBadge(u.account_status)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {u.location_city && <span className="text-[11px] text-muted-foreground truncate">{u.location_city}</span>}
                          {u.age && <span className="text-[11px] text-muted-foreground">· {u.age}y</span>}
                          {u.gender && <span className="text-[11px] text-muted-foreground">· {u.gender}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Joined {format(new Date(u.created_at), "MMM d, yyyy")}
                        </p>
                      </button>

                      {/* Quick actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDetailUser(u)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(u.account_status || "active") === "active" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:text-amber-600"
                            onClick={() => setSuspendDialog({ open: true, userId: u.user_id, name })}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (u.account_status || "active") === "suspended" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-600"
                              onClick={() => reactivateMutation.mutate(u.user_id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, userId: u.user_id, name })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>Suspend {suspendDialog.name}'s account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={suspendDuration} onValueChange={setSuspendDuration}>
              <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason for suspension..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!suspendReason || suspendMutation.isPending}
              onClick={() => {
                if (suspendDialog.userId) {
                  suspendMutation.mutate({ userId: suspendDialog.userId, reason: suspendReason, duration: suspendDuration });
                }
              }}
            >
              {suspendMutation.isPending ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Delete User Permanently</DialogTitle>
            <DialogDescription>
              This will permanently mark <strong>{deleteDialog.name}</strong>'s account as deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => { if (deleteDialog.userId) deleteMutation.mutate(deleteDialog.userId); }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {detailUser.profile_image_url ? (
                    <img src={detailUser.profile_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {(detailUser.first_name?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{detailUser.first_name} {detailUser.last_name}</p>
                  {getStatusBadge(detailUser.account_status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
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
