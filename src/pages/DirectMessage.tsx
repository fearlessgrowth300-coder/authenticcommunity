import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Camera, Mic, Loader2, Flag, Ban, BellOff, Timer, Plus, X, MicOff, Search, Image, Palette } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import EmojiPicker from "@/components/chat/EmojiPicker";
import StickerPicker from "@/components/chat/StickerPicker";
import AttachmentMenu from "@/components/chat/AttachmentMenu";
import MessageContextMenu from "@/components/chat/MessageContextMenu";
import IncomingCall from "@/components/chat/IncomingCall";
import ChatStoryViewer from "@/components/chat/ChatStoryViewer";
import TypingIndicator from "@/components/chat/TypingIndicator";
import LinkPreview, { extractUrls, renderMessageWithLinks } from "@/components/chat/LinkPreview";
import MessageReactions from "@/components/chat/MessageReactions";
import { usePresence } from "@/hooks/usePresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useAccountRestrictions } from "@/hooks/useAccountRestrictions";
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
  account_status?: string | null;
  suspended_until?: string | null;
  is_active?: boolean | null;
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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [chatBg, setChatBg] = useState<{ type: "color" | "image"; value: string }>(() => {
    const saved = localStorage.getItem(`chat-bg-${recipientId}`);
    return saved ? JSON.parse(saved) : { type: "color", value: "" };
  });
  const { canInteract, restrictionMessage } = useAccountRestrictions();
  const [blockState, setBlockState] = useState<{ iBlocked: boolean; blockedByOther: boolean; blockRowId: string | null }>({
    iBlocked: false,
    blockedByOther: false,
    blockRowId: null,
  });
  const [recipientRestricted, setRecipientRestricted] = useState(false);
  
  // Real presence tracking
  const presence = usePresence(recipientId);

  // Typing indicator
  const { isRecipientTyping, sendTyping, sendStopTyping } = useTypingIndicator(recipientId);

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; offer: RTCSessionDescriptionInit } | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load recipient profile and block state
  useEffect(() => {
    if (!recipientId) return;

    const loadRecipientState = async () => {
      const [{ data: profileData }, { data: storyData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, profile_image_url, account_status, suspended_until, is_active")
          .eq("user_id", recipientId)
          .single(),
        supabase
          .from("stories")
          .select("id")
          .eq("user_id", recipientId)
          .eq("is_deleted", false)
          .gt("expires_at", new Date().toISOString())
          .limit(1),
      ]);

      if (profileData) {
        const now = Date.now();
        const suspendedUntil = profileData.suspended_until ? new Date(profileData.suspended_until).getTime() : null;
        const suspended =
          profileData.account_status === "suspended" &&
          (suspendedUntil === null || Number.isNaN(suspendedUntil) || suspendedUntil > now);
        const deleted = profileData.account_status === "deleted" || profileData.is_active === false;
        const restricted = suspended || deleted;

        setRecipientRestricted(restricted);
        setRecipientProfile({
          ...profileData,
          profile_image_url: restricted ? null : profileData.profile_image_url,
        });
      }

      setHasStory((storyData || []).length > 0);

      if (user) {
        const [{ data: iBlockedRow }, { data: blockedByRow }] = await Promise.all([
          supabase.from("blocked_users").select("id").eq("blocker_id", user.id).eq("blocked_id", recipientId).maybeSingle(),
          supabase.from("blocked_users").select("id").eq("blocker_id", recipientId).eq("blocked_id", user.id).maybeSingle(),
        ]);

        setBlockState({
          iBlocked: !!iBlockedRow,
          blockedByOther: !!blockedByRow,
          blockRowId: iBlockedRow?.id || null,
        });
      }
    };

    loadRecipientState();
  }, [recipientId, user]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`incoming-call-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "call_signals",
        filter: `callee_id=eq.${user.id}`,
      }, (payload) => {
        const signal = payload.new as any;
        if (signal.signal_type === "offer") {
          setIncomingCall({ callerId: signal.caller_id, offer: signal.signal_data });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

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

      const now = new Date();
      const filtered = (data || []).filter((m: any) => {
        if (m.disappears_at && new Date(m.disappears_at) < now) return false;
        return true;
      });
      setMessages(filtered);
      setLoading(false);

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
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (type: string = "text", stickerUrl?: string) => {
    if (type === "text" && !message.trim()) return;
    if (!user || !recipientId || sending) return;

    if (!canInteract) {
      toast.error(restrictionMessage || "Your account cannot send messages right now.");
      return;
    }

    if (recipientRestricted || blockState.iBlocked || blockState.blockedByOther) {
      toast.error("Messaging is unavailable in this conversation.");
      return;
    }

    setSending(true);
    const content = type === "sticker" ? "🖼️ Sticker" : message.trim();
    if (type === "text") setMessage("");
    setReplyTo(null);

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

  const handleDeleteMessage = async (msgId: string) => {
    if (!user) return;
    await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", user.id);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast.success("Message deleted");
  };

  const handleBlock = async () => {
    if (!user || !recipientId) return;
    try {
      if (blockState.iBlocked) {
        if (blockState.blockRowId) {
          await supabase.from("blocked_users").delete().eq("id", blockState.blockRowId);
        } else {
          await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", recipientId);
        }
        setBlockState((prev) => ({ ...prev, iBlocked: false, blockRowId: null }));
        toast.success("User unblocked");
      } else {
        const { data } = await supabase
          .from("blocked_users")
          .insert({ blocker_id: user.id, blocked_id: recipientId })
          .select("id")
          .maybeSingle();
        setBlockState((prev) => ({ ...prev, iBlocked: true, blockRowId: data?.id || prev.blockRowId }));
        toast.success("User blocked");
      }
    } catch {
      toast.error("Failed to update block status");
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

  // Voice note recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (!user || !recipientId) return;

        const path = `${user.id}/${Date.now()}.webm`;
        const { error } = await supabase.storage.from("stickers").upload(path, blob);
        if (error) { toast.error("Failed to upload voice note"); return; }
        const { data } = supabase.storage.from("stickers").getPublicUrl(path);

        await supabase.from("messages").insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: "🎤 Voice note",
          message_type: "audio",
          sticker_url: data.publicUrl,
        });
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Camera capture
  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !user || !recipientId) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("stickers").upload(path, file);
      if (error) { toast.error("Failed to upload"); return; }
      const { data } = supabase.storage.from("stickers").getPublicUrl(path);
      await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: "📷 Photo",
        message_type: "image",
        sticker_url: data.publicUrl,
      });
    };
    input.click();
  };

  const handleMessageLongPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ msg, x: clientX, y: clientY });
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setIsIncomingCall(true);
    setIncomingOffer(incomingCall.offer);
    setShowCall(true);
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCall || !user) return;
    await supabase.from("call_signals").insert({
      caller_id: user.id,
      callee_id: incomingCall.callerId,
      signal_type: "hangup",
      signal_data: {},
    } as any);
    setIncomingCall(null);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  };

  const isChatBlocked = recipientRestricted || blockState.iBlocked || blockState.blockedByOther;
  const chatRestrictionMessage =
    restrictionMessage ||
    (recipientRestricted
      ? "This account is suspended or deleted."
      : blockState.iBlocked
      ? "You blocked this user. Unblock to message again."
      : blockState.blockedByOther
      ? "You cannot message this user because they blocked you."
      : null);

  const getTickSymbol = (msg: Message) => {
    if (msg.is_read) return "✓✓";
    if (presence.status === "online") return "✓✓";
    return "✓";
  };

  const displayName = recipientProfile
    ? `${recipientProfile.first_name || ""} ${recipientProfile.last_name || ""}`.trim() || "User"
    : "User";

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d");
  };

  const closeAllPickers = () => {
    setShowEmoji(false);
    setShowStickers(false);
    setShowAttachments(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Incoming Call */}
      {incomingCall && (
        <IncomingCall
          callerName={displayName}
          callerImage={recipientProfile?.profile_image_url}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-4 py-2.5">
        {showSearch ? (
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-muted border-0 h-9"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/messages")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              if (hasStory) {
                e.stopPropagation();
                setShowStoryViewer(true);
              } else {
                navigate(`/matches/${recipientId}`);
              }
            }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="relative">
              {/* Story ring */}
              <div className={cn(
                "rounded-full p-[2px]",
                hasStory ? "bg-gradient-to-r from-primary to-accent" : "bg-transparent"
              )}>
                {recipientProfile?.profile_image_url ? (
                  <img src={recipientProfile.profile_image_url} alt={displayName} className="h-9 w-9 rounded-full object-cover border-2 border-background" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border-2 border-background">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              {presence.status === "online" && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">
                {disappearingEnabled && <Timer className="h-2.5 w-2.5 inline mr-0.5" />}
                {presence.status === "online" ? "Online" : "Last seen recently"}
              </p>
            </div>
          </button>
          <button onClick={() => setShowCall(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <Video className="h-5 w-5" />
          </button>
          <button onClick={() => setShowCall(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
            <Phone className="h-4.5 w-4.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4 mr-2" /> Search
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBgSettings(true)}>
                <Palette className="h-4 w-4 mr-2" /> Chat Background
              </DropdownMenuItem>
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
                <Ban className="h-4 w-4 mr-2" /> {blockState.iBlocked ? "Unblock" : "Block"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}
      </header>

      {/* Messages */}
      <main
        className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-1"
        style={chatBg.value ? (
          chatBg.type === "color"
            ? { backgroundColor: chatBg.value }
            : { backgroundImage: `url(${chatBg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
        ) : undefined}
      >
        {chatRestrictionMessage && (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {chatRestrictionMessage}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (() => {
          const filtered = searchQuery
            ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
            : messages;
          if (filtered.length === 0 && searchQuery) {
            return (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No messages matching "{searchQuery}"</p>
              </div>
            );
          }
          return filtered.map((msg, idx, arr) => {
            const isMe = msg.sender_id === user?.id;
            const showDate = idx === 0 || !isSameDay(new Date(msg.created_at), new Date(arr[idx - 1].created_at));
            const isSticker = msg.message_type === "sticker" && msg.sticker_url;
            const isImage = msg.message_type === "image" && msg.sticker_url;
            const isAudio = msg.message_type === "audio" && msg.sticker_url;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                      {getDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={cn("flex flex-col mb-1", isMe ? "items-end" : "items-start")}>
                  {isSticker ? (
                    <button
                      onClick={() => !isMe && handleSaveSticker(msg.sticker_url!)}
                      onContextMenu={(e) => handleMessageLongPress(e, msg)}
                      className="max-w-[140px] group relative"
                      title={!isMe ? "Tap to save sticker" : undefined}
                    >
                      <img src={msg.sticker_url!} alt="sticker" className="w-full rounded-lg" />
                      <p className="text-[10px] mt-0.5 text-right text-muted-foreground">
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </button>
                  ) : isImage ? (
                    <div
                      onContextMenu={(e) => handleMessageLongPress(e, msg)}
                      className={cn("max-w-[75%] rounded-2xl overflow-hidden", isMe ? "rounded-br-md" : "rounded-bl-md")}
                    >
                      <img src={msg.sticker_url!} alt="shared" className="w-full max-h-64 object-cover" />
                      <div className={cn("px-3 py-1", isMe ? "gradient-primary" : "bg-muted")}>
                        <p className={cn("text-[10px] text-right", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), "h:mm a")}
                          {isMe && <span className={cn("ml-1 transition-colors duration-500", msg.is_read ? "text-green-500" : "text-primary-foreground/50")}>{getTickSymbol(msg)}</span>}
                        </p>
                      </div>
                    </div>
                  ) : isAudio ? (
                    <div
                      onContextMenu={(e) => handleMessageLongPress(e, msg)}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe ? "gradient-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <audio src={msg.sticker_url!} controls className="max-w-full h-8" />
                      <p className={cn("text-[10px] text-right mt-0.5", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "h:mm a")}
                        {isMe && <span className={cn("ml-1 transition-colors duration-500", msg.is_read ? "text-green-500" : "text-primary-foreground/50")}>{getTickSymbol(msg)}</span>}
                      </p>
                    </div>
                  ) : (
                    <div
                      onContextMenu={(e) => handleMessageLongPress(e, msg)}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 relative cursor-pointer select-none",
                        isMe
                          ? "gradient-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{renderMessageWithLinks(msg.content, isMe)}</p>
                      {extractUrls(msg.content).length > 0 && (
                        <LinkPreview url={extractUrls(msg.content)[0]} />
                      )}
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {msg.disappears_at && <Timer className={cn("h-2.5 w-2.5", isMe ? "text-primary-foreground/50" : "text-muted-foreground/50")} />}
                        <p className={cn("text-[10px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                        {isMe && (
                          <span className={cn("text-[10px] transition-colors duration-500", msg.is_read ? "text-green-500" : "text-primary-foreground/50")}>
                            {getTickSymbol(msg)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <MessageReactions messageId={msg.id} isMe={isMe} />
                </div>
              </div>
            );
          });
        })()}
        {isRecipientTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          isMe={contextMenu.msg.sender_id === user?.id}
          content={contextMenu.msg.content}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onReply={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}
          onDelete={() => handleDeleteMessage(contextMenu.msg.id)}
        />
      )}

      {/* Emoji / Sticker / Attachment pickers */}
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
      {showAttachments && (
        <AttachmentMenu
          recipientId={recipientId!}
          onClose={() => setShowAttachments(false)}
          onStickerOpen={() => { setShowAttachments(false); setShowStickers(true); }}
          onImageSent={() => setShowAttachments(false)}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="border-t border-border bg-muted/50 px-4 py-2 flex items-center gap-2 max-w-lg mx-auto w-full">
          <div className="flex-1 border-l-2 border-primary pl-2">
            <p className="text-[10px] text-primary font-medium">
              {replyTo.sender_id === user?.id ? "You" : displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input bar - WhatsApp style */}
      <div className="sticky bottom-0 border-t border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* + button */}
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

          {/* Text input area */}
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
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) sendTyping();
                else sendStopTyping();
              }}
              onKeyDown={handleKeyDown}
              onBlur={sendStopTyping}
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
              <Smile className="h-5 w-5 rotate-12" />
            </button>
          </div>

          {/* Right side: camera + mic OR send */}
          {message.trim() ? (
            <button
              onClick={() => handleSend()}
              disabled={sending}
              className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={handleCameraCapture} className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Camera className="h-5 w-5" />
              </button>
              {isRecording ? (
                <button onClick={stopRecording} className="h-10 w-10 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                  <MicOff className="h-4 w-4 text-card" />
                </button>
              ) : (
                <button onClick={startRecording} className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
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

      {/* Chat Background Settings */}
      <Dialog open={showBgSettings} onOpenChange={setShowBgSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Chat Background</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-2 block">Background Color</Label>
              <div className="flex flex-wrap gap-2">
                {["", "#0f172a", "#1e293b", "#1a1a2e", "#16213e", "#0d1b2a", "#1b1b3a", "#2d1b69", "#1a3c34", "#3c1a1a", "#2c1810"].map((color) => (
                  <button
                    key={color || "default"}
                    onClick={() => {
                      const bg = color ? { type: "color" as const, value: color } : { type: "color" as const, value: "" };
                      setChatBg(bg);
                      localStorage.setItem(`chat-bg-${recipientId}`, JSON.stringify(bg));
                    }}
                    className={cn(
                      "h-10 w-10 rounded-full border-2 transition-all",
                      chatBg.value === color ? "border-primary scale-110" : "border-border"
                    )}
                    style={{ backgroundColor: color || "hsl(var(--background))" }}
                  >
                    {!color && <span className="text-[10px] text-muted-foreground">Def</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Background Image</Label>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const bg = { type: "image" as const, value: reader.result as string };
                      setChatBg(bg);
                      localStorage.setItem(`chat-bg-${recipientId}`, JSON.stringify(bg));
                      setShowBgSettings(false);
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                className="w-full h-10 rounded-lg border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Image className="h-4 w-4" /> Choose Image
              </button>
            </div>
            {chatBg.value && (
              <button
                onClick={() => {
                  const bg = { type: "color" as const, value: "" };
                  setChatBg(bg);
                  localStorage.removeItem(`chat-bg-${recipientId}`);
                  setShowBgSettings(false);
                }}
                className="w-full h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Reset to Default
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Call */}
      {showCall && (
        <Suspense fallback={null}>
          <VideoCall
            recipientId={recipientId!}
            recipientName={displayName}
            onClose={() => { setShowCall(false); setIsIncomingCall(false); setIncomingOffer(null); }}
            isIncoming={isIncomingCall}
            incomingOffer={incomingOffer || undefined}
          />
        </Suspense>
      )}

      {/* Story Viewer */}
      {showStoryViewer && recipientId && (
        <ChatStoryViewer
          userId={recipientId}
          userName={displayName}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </div>
  );
};

export default DirectMessage;
