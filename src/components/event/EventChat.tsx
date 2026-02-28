import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EventChatProps {
  eventId: string;
  isAttendee: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

const EventChat = ({ eventId, isAttendee }: EventChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("event_chat_messages")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setMessages(data.map((m) => ({ ...m, profile: profileMap.get(m.user_id) })));
    }
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_chat_messages", filter: `event_id=eq.${eventId}` }, async (payload) => {
        const msg = payload.new as any;
        const { data: profile } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url").eq("user_id", msg.user_id).single();
        setMessages((prev) => [...prev, { ...msg, profile }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("event_chat_messages").insert({ event_id: eventId, user_id: user.id, message: content });
    setSending(false);
  };

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Start the conversation!</p>
        ) : messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "")}>
              {!isMe && (
                msg.profile?.profile_image_url ? (
                  <img src={msg.profile.profile_image_url} className="h-7 w-7 rounded-full object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                    {getName(msg.profile)[0]?.toUpperCase()}
                  </div>
                )
              )}
              <div className={cn("max-w-[75%]", isMe ? "items-end" : "items-start")}>
                {!isMe && <p className="text-[10px] text-muted-foreground mb-0.5">{getName(msg.profile)}</p>}
                <div className={cn("rounded-2xl px-3 py-2 text-sm", isMe ? "gradient-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md")}>
                  {msg.message}
                </div>
                <p className={cn("text-[10px] mt-0.5", isMe ? "text-right" : "")} style={{ color: "var(--muted-foreground)" }}>
                  {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isAttendee ? (
        <div className="flex gap-2 p-2 border-t border-border/50">
          <input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3 border-t border-border/50">RSVP to join the conversation</p>
      )}
    </div>
  );
};

export default EventChat;
