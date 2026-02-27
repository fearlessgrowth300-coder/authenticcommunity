import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MoreVertical, Send, Smile, Image, Loader2, Flag, Ban, BellOff, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

const DirectMessage = () => {
  const navigate = useNavigate();
  const { id: recipientId } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load recipient profile
  useEffect(() => {
    if (!recipientId) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, profile_image_url")
      .eq("user_id", recipientId)
      .single()
      .then(({ data }) => {
        if (data) setRecipientProfile(data);
      });
  }, [recipientId]);

  // Load existing messages
  useEffect(() => {
    if (!user || !recipientId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
      setLoading(false);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", recipientId)
        .eq("recipient_id", user.id)
        .eq("is_read", false);
    };

    loadMessages();
  }, [user, recipientId]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !recipientId) return;

    const channel = supabase
      .channel(`dm-${user.id}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.recipient_id === user.id) {
              supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user || !recipientId || sending) return;
    setSending(true);
    const content = message.trim();
    setMessage("");

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content,
    });

    if (error) {
      toast.error("Failed to send message");
      setMessage(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlock = async () => {
    if (!user || !recipientId) return;
    try {
      await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: recipientId });
      toast.success("User blocked");
      navigate("/messages", { replace: true });
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleReport = async () => {
    if (!user || !recipientId) return;
    try {
      await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: recipientId,
        reason: "Inappropriate behavior in messages",
        report_type: "user",
      });
      toast.success("Report submitted. We'll review it shortly.");
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const displayName = recipientProfile
    ? `${recipientProfile.first_name || ""} ${recipientProfile.last_name || ""}`.trim() || "User"
    : "User";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/matches/${recipientId}`)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {recipientProfile?.profile_image_url ? (
              <img src={recipientProfile.profile_image_url} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          </button>
          <button
            onClick={() => toast.info("Voice/video calls coming soon!")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/matches/${recipientId}`)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Notifications muted for this chat")}>
                <BellOff className="h-4 w-4 mr-2" /> Mute
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" /> Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" /> Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isMe
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(msg.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input - always visible */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-muted border-0"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
