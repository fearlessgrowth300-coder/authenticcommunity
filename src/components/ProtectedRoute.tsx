import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (loading || onboardingCompleted === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isOnboarding = location.pathname.startsWith("/onboarding");
  const isAdmin = location.pathname.startsWith("/admin");

  // Allow admin routes even if onboarding not completed
  if (!onboardingCompleted && !isOnboarding && !isAdmin) {
    return <Navigate to="/onboarding/1" replace />;
  }

  return <>{children}</>;
}
