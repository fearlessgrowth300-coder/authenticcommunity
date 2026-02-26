import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Eye, Trash2, MoreHorizontal, Loader2, ShieldAlert } from "lucide-react";
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
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminMessages() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailMessage, setDetailMessage] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-messages", search],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike("content", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Also load sender profiles for display
  const senderIds = [...new Set(messages?.map((m) => m.sender_id) ?? [])];
  const { data: profiles } = useQuery({
    queryKey: ["admin-msg-profiles", senderIds],
    queryFn: async () => {
      if (!senderIds.length) return {};
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", senderIds);
      const map: Record<string, string> = {};
      data?.forEach((p) => { map[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"; });
      return map;
    },
    enabled: senderIds.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: currentUser!.id, action: "delete_message", target_type: "message", target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success("Message deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete message"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Messages Moderation</h2>
        <p className="text-muted-foreground text-sm">Review and moderate messages</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                    <TableHead>Sender</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm font-medium">{profiles?.[m.sender_id] || m.sender_id.slice(0, 8)}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{m.content}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(m.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailMessage(m)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(m.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!messages?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No messages found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailMessage} onOpenChange={() => setDetailMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Message Details</DialogTitle></DialogHeader>
          {detailMessage && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Sender</p><p className="font-medium">{profiles?.[detailMessage.sender_id] || "Unknown"}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{format(new Date(detailMessage.created_at), "MMM d, yyyy h:mm a")}</p></div>
                <div><p className="text-muted-foreground">Read</p><p className="font-medium">{detailMessage.is_read ? "Yes" : "No"}</p></div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Content</p>
                <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap">{detailMessage.content}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this message.</AlertDialogDescription>
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
