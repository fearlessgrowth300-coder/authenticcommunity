import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

// Routes that suspended users can still browse (view-only)
const BROWSE_ONLY_ROUTES = ["/dashboard", "/events", "/communities", "/matches", "/profile", "/settings", "/notifications", "/stories"];

function isAllowedForSuspended(pathname: string): boolean {
  return BROWSE_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted, accountStatus, accountStatusLoading } = useAuth();
  const location = useLocation();

  if (loading || onboardingCompleted === null || accountStatusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isOnboarding = location.pathname.startsWith("/onboarding");
  const isAdmin = location.pathname.startsWith("/admin");
  const isSuspendedPage = location.pathname === "/suspended";

  // Permanently deleted accounts → force sign out
  if (accountStatus === "deleted") {
    return <Navigate to="/login" replace />;
  }

  // Suspended accounts
  if (accountStatus === "suspended" && !isAdmin) {
    // Already on suspended page, allow
    if (isSuspendedPage) return <>{children}</>;

    // Allow browse-only routes but not interactive ones
    if (isAllowedForSuspended(location.pathname)) {
      return <>{children}</>;
    }

    // Redirect all other routes to suspended screen
    return <Navigate to="/suspended" replace />;
  }

  // Allow admin routes even if onboarding not completed
  if (!onboardingCompleted && !isOnboarding && !isAdmin) {
    return <Navigate to="/onboarding/1" replace />;
  }

  return <>{children}</>;
}
