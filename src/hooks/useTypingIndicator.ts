import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTypingIndicator(recipientId?: string) {
  const { user } = useAuth();
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastBroadcastRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !recipientId) return;

    const channelName = `typing-${[user.id, recipientId].sort().join("-")}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id === recipientId) {
          setIsRecipientTyping(true);
          // Clear after 3 seconds of no typing events
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsRecipientTyping(false);
          }, 3000);
        }
      })
      .on("broadcast", { event: "stop_typing" }, ({ payload }) => {
        if (payload.user_id === recipientId) {
          setIsRecipientTyping(false);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    // Throttle: only send every 2 seconds
    if (now - lastBroadcastRef.current < 2000) return;
    lastBroadcastRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  }, [user]);

  const sendStopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "stop_typing",
      payload: { user_id: user.id },
    });
  }, [user]);

  return { isRecipientTyping, sendTyping, sendStopTyping };
}
