import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Image as ImageIcon, Loader2, Flag, Ban, BellOff, Timer, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import EmojiPicker from "@/components/chat/EmojiPicker";
import StickerPicker from "@/components/chat/StickerPicker";

const VideoCall = lazy(() => import("@/components/chat/VideoCall"));

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  sticker_url?: string;
  disappears_at?: string;
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
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showDisappearSettings, setShowDisappearSettings] = useState(false);
  const [disappearingEnabled, setDisappearingEnabled] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState<string>("86400");
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

  // Load conversation settings
  useEffect(() => {
    if (!user || !recipientId) return;
    supabase
      .from("conversation_settings")
      .select("disappearing_duration")
      .eq("user_id", user.id)
      .eq("other_user_id", recipientId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.disappearing_duration) {
          setDisappearingEnabled(true);
          setDisappearingDuration(String(data.disappearing_duration));
        }
      });
  }, [user, recipientId]);

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

      // Filter out expired disappearing messages
      const now = new Date();
      const filtered = (data || []).filter((m: any) => {
        if (m.disappears_at && new Date(m.disappears_at) < now) return false;
        return true;
      });
      setMessages(filtered);
      setLoading(false);

      // Mark unread as read
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
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
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (type: string = "text", stickerUrl?: string) => {
    if (type === "text" && !message.trim()) return;
    if (!user || !recipientId || sending) return;
    setSending(true);
    const content = type === "sticker" ? "🖼️ Sticker" : message.trim();
    if (type === "text") setMessage("");

    const insertData: any = {
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      message_type: type,
      sticker_url: type === "sticker" ? stickerUrl : null,
    };

    if (disappearingEnabled) {
      const dur = parseInt(disappearingDuration);
      insertData.disappears_at = new Date(Date.now() + dur * 1000).toISOString();
    }

    const { error } = await supabase.from("messages").insert(insertData);
    if (error) {
      toast.error("Failed to send message");
      if (type === "text") setMessage(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveSticker = async (url: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_saved_stickers").insert({ user_id: user.id, sticker_url: url } as any);
    if (!error) toast.success("Sticker saved!");
    else if (error.code === "23505") toast.info("Already saved");
    else toast.error("Failed to save");
  };

  const handleBlock = async () => {
    if (!user || !recipientId) return;
    try {
      await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: recipientId });
      toast.success("User blocked");
      navigate("/messages", { replace: true });
    } catch { toast.error("Failed to block user"); }
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
      toast.success("Report submitted.");
    } catch { toast.error("Failed to submit report"); }
  };

  const saveDisappearSettings = async () => {
    if (!user || !recipientId) return;
    const dur = disappearingEnabled ? parseInt(disappearingDuration) : null;
    await supabase.from("conversation_settings").upsert({
      user_id: user.id,
      other_user_id: recipientId,
      disappearing_duration: dur,
    } as any, { onConflict: "user_id,other_user_id" });
    setShowDisappearSettings(false);
    toast.success(disappearingEnabled ? `Disappearing messages: ${formatDuration(dur!)}` : "Disappearing messages off");
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  };

  const displayName = recipientProfile
    ? `${recipientProfile.first_name || ""} ${recipientProfile.last_name || ""}`.trim() || "User"
    : "User";

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => navigate(`/matches/${recipientId}`)} className="flex items-center gap-2 flex-1 min-w-0">
            {recipientProfile?.profile_image_url ? (
              <img src={recipientProfile.profile_image_url} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              {disappearingEnabled && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Timer className="h-2.5 w-2.5" /> Disappearing messages on
                </p>
              )}
            </div>
          </button>
          <button onClick={() => setShowCall(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <Video className="h-4.5 w-4.5" />
          </button>
          <button onClick={() => setShowCall(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <Phone className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate(`/matches/${recipientId}`)}>View Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDisappearSettings(true)}>
                <Timer className="h-4 w-4 mr-2" /> Disappearing Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Notifications muted")}>
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
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const showDate = idx === 0 || !isSameDay(new Date(msg.created_at), new Date(messages[idx - 1].created_at));
            const isSticker = msg.message_type === "sticker" && msg.sticker_url;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                      {getDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
                  {isSticker ? (
                    <button
                      onClick={() => !isMe && handleSaveSticker(msg.sticker_url!)}
                      className="max-w-[140px] group relative"
                      title={!isMe ? "Tap to save sticker" : undefined}
                    >
                      <img src={msg.sticker_url!} alt="sticker" className="w-full rounded-lg" />
                      <p className={cn("text-[10px] mt-0.5 text-right", isMe ? "text-muted-foreground" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                      {!isMe && (
                        <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-background/80 rounded-full p-1 text-[9px] text-primary">
                          Save
                        </span>
                      )}
                    </button>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 relative",
                        isMe
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={cn("flex items-center gap-1 justify-end mt-0.5")}>
                        {msg.disappears_at && <Timer className={cn("h-2.5 w-2.5", isMe ? "text-primary-foreground/50" : "text-muted-foreground/50")} />}
                        <p className={cn("text-[10px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                        {isMe && (
                          <span className={cn("text-[10px]", msg.is_read ? "text-blue-300" : "text-primary-foreground/50")}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Emoji / Sticker pickers */}
      {showEmoji && (
        <EmojiPicker
          onSelect={(emoji) => setMessage((prev) => prev + emoji)}
          onClose={() => setShowEmoji(false)}
        />
      )}
      {showStickers && (
        <StickerPicker
          onSelect={(url) => handleSend("sticker", url)}
          onClose={() => setShowStickers(false)}
        />
      )}

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={() => {
              setShowAttachments(!showAttachments);
              setShowEmoji(false);
              setShowStickers(false);
            }}
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            {showAttachments ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
          <div className="flex-1 flex items-center bg-muted rounded-full px-3">
            <button
              onClick={() => {
                setShowEmoji(!showEmoji);
                setShowStickers(false);
                setShowAttachments(false);
              }}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <Smile className="h-5 w-5" />
            </button>
            <input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 outline-none py-2 px-2 text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={() => {
                setShowStickers(!showStickers);
                setShowEmoji(false);
                setShowAttachments(false);
              }}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!message.trim() || sending}
            className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50 flex-shrink-0"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        {/* Attachment options */}
        {showAttachments && (
          <div className="flex gap-4 justify-center py-3 max-w-lg mx-auto">
            <button
              onClick={() => { setShowStickers(true); setShowAttachments(false); }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">Stickers</span>
            </button>
          </div>
        )}
      </div>

      {/* Disappearing Messages Dialog */}
      <Dialog open={showDisappearSettings} onOpenChange={setShowDisappearSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Disappearing Messages</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label>Enable</Label>
              <Switch checked={disappearingEnabled} onCheckedChange={setDisappearingEnabled} />
            </div>
            {disappearingEnabled && (
              <div className="space-y-2">
                <Label>Messages disappear after</Label>
                <Select value={disappearingDuration} onValueChange={setDisappearingDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="86400">24 hours</SelectItem>
                    <SelectItem value="604800">7 days</SelectItem>
                    <SelectItem value="2592000">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <button onClick={saveDisappearSettings} className="w-full h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Call */}
      {showCall && (
        <Suspense fallback={null}>
          <VideoCall
            recipientId={recipientId!}
            recipientName={displayName}
            onClose={() => setShowCall(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DirectMessage;
