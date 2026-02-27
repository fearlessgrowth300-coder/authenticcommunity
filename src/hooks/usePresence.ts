import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  status: "online" | "offline";
  lastSeen?: string;
}

export function usePresence(trackUserId?: string) {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceState>({ status: "offline" });
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const channelName = "presence-global";
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        if (trackUserId && state[trackUserId]) {
          setPresenceState({ status: "online" });
        } else if (trackUserId) {
          setPresenceState({ status: "offline", lastSeen: new Date().toISOString() });
        }
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        if (key === trackUserId) {
          setPresenceState({ status: "offline", lastSeen: new Date().toISOString() });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, trackUserId]);

  return presenceState;
}
