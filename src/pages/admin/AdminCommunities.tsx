import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Eye, Ban, Trash2, MoreHorizontal, Loader2, Building2 } from "lucide-react";
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminCommunities() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [detailCommunity, setDetailCommunity] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: communities, isLoading } = useQuery({
    queryKey: ["admin-communities", search, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("community_name", `%${search}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["community-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("communities")
        .select("category")
        .not("category", "is", null);
      const unique = [...new Set(data?.map((d) => d.category).filter(Boolean))];
      return unique as string[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communities").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: "delete_community",
        target_type: "community",
        target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("Community deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete community"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("communities")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id,
        action: active ? "activate_community" : "suspend_community",
        target_type: "community",
        target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      toast.success("Community updated");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Communities Management</h2>
        <p className="text-muted-foreground text-sm">{communities?.length ?? 0} communities</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
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
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.community_name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{c.category || "—"}</Badge>
                      </TableCell>
                      <TableCell>{c.member_count ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "destructive"} className="text-[10px]">
                          {c.is_active ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailCommunity(c)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActiveMutation.mutate({ id: c.id, active: !c.is_active })}>
                              <Ban className="h-4 w-4 mr-2" /> {c.is_active ? "Suspend" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!communities?.length && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No communities found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailCommunity} onOpenChange={() => setDetailCommunity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Community Details</DialogTitle></DialogHeader>
          {detailCommunity && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{detailCommunity.community_name}</p></div>
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{detailCommunity.community_type || "public"}</p></div>
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{detailCommunity.category || "—"}</p></div>
                <div><p className="text-muted-foreground">Members</p><p className="font-medium">{detailCommunity.member_count ?? 0}</p></div>
                <div><p className="text-muted-foreground">Location</p><p className="font-medium">{detailCommunity.location_city || "—"}, {detailCommunity.location_state || "—"}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium">{format(new Date(detailCommunity.created_at), "MMM d, yyyy")}</p></div>
              </div>
              <div><p className="text-muted-foreground">Description</p><p className="font-medium">{detailCommunity.description || "No description"}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this community and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
