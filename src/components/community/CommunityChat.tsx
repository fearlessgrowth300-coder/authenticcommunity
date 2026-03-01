import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CommunityMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

interface CommunityProps {
  communityId: string;
  isMember: boolean;
}

const CommunityChat = ({ communityId, isMember }: CommunityProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef<Map<string, any>>(new Map());

  const fetchProfiles = async (userIds: string[]) => {
    const uncached = userIds.filter((id) => !profileCache.current.has(id));
    if (uncached.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, profile_image_url")
        .in("user_id", uncached);
      (data || []).forEach((p) => profileCache.current.set(p.user_id, p));
    }
  };

  const enrichMessages = (msgs: any[]): CommunityMessage[] =>
    msgs.map((m) => ({ ...m, profile: profileCache.current.get(m.sender_id) }));

  const loadMessages = async () => {
    const { data } = await supabase
      .from("community_messages")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) {
      const userIds = [...new Set(data.map((m) => m.sender_id))];
      await fetchProfiles(userIds);
      setMessages(enrichMessages(data));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [communityId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
        filter: `community_id=eq.${communityId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        if (!profileCache.current.has(msg.sender_id)) {
          await fetchProfiles([msg.sender_id]);
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, profile: profileCache.current.get(msg.sender_id) }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [communityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("community_messages").insert({
      community_id: communityId,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast.error("Failed to send message");
      setNewMessage(content);
    }
    setSending(false);
  };

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Join this community to participate in the chat</p>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col h-[60vh] bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">No messages yet. Start the conversation!</p>
        ) : messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                msg.profile?.profile_image_url ? (
                  <img src={msg.profile.profile_image_url} className="h-7 w-7 rounded-full object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0">
                    {getName(msg.profile)[0]?.toUpperCase()}
                  </div>
                )
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{getName(msg.profile)}</p>}
                <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.content}
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-3 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none border-0"
        />
        <Button
          size="icon"
          variant="gradient"
          className="rounded-full h-9 w-9 flex-shrink-0"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CommunityChat;
