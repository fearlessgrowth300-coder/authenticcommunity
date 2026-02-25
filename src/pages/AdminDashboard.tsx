import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Mail, Clock, Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  // Fetch contact submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast.success("Submission deleted");
    },
    onError: () => toast.error("Failed to delete submission"),
  });

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background safe-bottom">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
          </div>
        </header>
        <main className="px-5 py-16 max-w-2xl mx-auto text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {submissions?.length ?? 0} submissions
          </Badge>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !submissions?.length ? (
          <div className="text-center py-12">
            <Mail className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No contact submissions yet</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{sub.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(sub.created_at), "MMM d, h:mm a")}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this contact submission.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(sub.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{sub.message}</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
