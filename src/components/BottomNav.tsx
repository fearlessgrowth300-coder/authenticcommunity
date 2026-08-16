import { NavLink, useLocation } from "react-router-dom";
import { Home, Compass, CalendarDays, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home", badgeKey: null },
  { to: "/matches", icon: Compass, label: "Discover", badgeKey: null },
  { to: "/communities", icon: Users, label: "Community", badgeKey: null },
  { to: "/events", icon: CalendarDays, label: "Events", badgeKey: null },
  { to: "/messages", icon: MessageCircle, label: "Messages", badgeKey: "messages" as const },
  { to: "/profile", icon: User, label: "Profile", badgeKey: null },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const hideOn = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  const isDMRoute = /^\/messages\/[^/]+$/.test(location.pathname);
  const shouldHide = hideOn.some(
    (path) => location.pathname === path
  ) || isDMRoute || location.pathname.startsWith("/admin") || location.pathname.startsWith("/onboarding") || (location.pathname.startsWith("/stories/") && !location.pathname.includes("/replies") && !location.pathname.includes("/viewers") && !location.pathname.includes("/create"));

  useEffect(() => {
    if (!user) return;

    const loadCounts = async () => {
      const [msgRes, notifRes] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);
      setUnreadMessages(msgRes.count || 0);
      setUnreadNotifications(notifRes.count || 0);
    };

    loadCounts();

    // Realtime for messages
    const msgChannel = supabase
      .channel("bottom-nav-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadCounts();
      })
      .subscribe();

    const notifChannel = supabase
      .channel("bottom-nav-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        loadCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  if (shouldHide) return null;

  const getBadge = (badgeKey: string | null) => {
    if (badgeKey === "messages") return unreadMessages;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const badge = getBadge(item.badgeKey);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors duration-200 text-muted-foreground",
                  isActive && "text-primary"
                )
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
