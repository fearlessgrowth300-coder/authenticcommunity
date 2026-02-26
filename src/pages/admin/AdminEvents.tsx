import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Eye, Trash2, MoreHorizontal, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminEvents() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailEvent, setDetailEvent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events", search, statusFilter],
    queryFn: async () => {
      let query = supabase.from("events").select("*").order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "cancelled") query = query.eq("is_active", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id, action: "delete_event", target_type: "event", target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id, action: "cancel_event", target_type: "event", target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event cancelled");
    },
  });

  const getEventStatus = (event: any) => {
    if (!event.is_active) return { label: "Cancelled", variant: "destructive" as const };
    if (event.event_date) {
      const d = new Date(event.event_date);
      if (d < new Date()) return { label: "Completed", variant: "secondary" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Events Management</h2>
        <p className="text-muted-foreground text-sm">{events?.length ?? 0} events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((e) => {
                    const status = getEventStatus(e);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{e.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {e.event_date ? format(new Date(e.event_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>{e.attendee_count ?? 0}{e.max_attendees ? `/${e.max_attendees}` : ""}</TableCell>
                        <TableCell><Badge variant={status.variant} className="text-[10px]">{status.label}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                          {e.location || "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailEvent(e)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                              {e.is_active && (
                                <DropdownMenuItem onClick={() => cancelMutation.mutate(e.id)}>
                                  <XCircle className="h-4 w-4 mr-2" /> Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteId(e.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!events?.length && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No events found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailEvent} onOpenChange={() => setDetailEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Event Details</DialogTitle></DialogHeader>
          {detailEvent && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{detailEvent.name}</p></div>
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{detailEvent.category || "—"}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{detailEvent.event_date ? format(new Date(detailEvent.event_date), "MMM d, yyyy") : "—"}</p></div>
                <div><p className="text-muted-foreground">Time</p><p className="font-medium">{detailEvent.start_time || "—"} - {detailEvent.end_time || "—"}</p></div>
                <div><p className="text-muted-foreground">Location</p><p className="font-medium">{detailEvent.location || "—"}</p></div>
                <div><p className="text-muted-foreground">Attendees</p><p className="font-medium">{detailEvent.attendee_count ?? 0}{detailEvent.max_attendees ? ` / ${detailEvent.max_attendees}` : ""}</p></div>
              </div>
              <div><p className="text-muted-foreground">Description</p><p className="font-medium">{detailEvent.description || "No description"}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this event.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
