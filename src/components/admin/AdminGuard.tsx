import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function useAdminCheck() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-role", user?.id],
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
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have admin privileges to access this page.
        </p>
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
