import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  recipientId: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const MessagesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadConversations = async () => {
    if (!user) return;

    // Get all messages involving current user
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs || msgs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const convMap = new Map<string, { lastMsg: typeof msgs[0]; unread: number }>();
    for (const msg of msgs) {
      const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, { lastMsg: msg, unread: 0 });
      }
      if (msg.recipient_id === user.id && !msg.is_read) {
        convMap.get(partnerId)!.unread++;
      }
    }

    // Fetch profiles for all partners
    const partnerIds = Array.from(convMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, profile_image_url")
      .in("user_id", partnerIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const convos: Conversation[] = partnerIds.map((pid) => {
      const { lastMsg, unread } = convMap.get(pid)!;
      const profile = profileMap.get(pid);
      return {
        recipientId: pid,
        firstName: profile?.first_name || "User",
        lastName: profile?.last_name || "",
        profileImage: profile?.profile_image_url || null,
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.created_at,
        unreadCount: unread,
      };
    });

    // Sort by most recent
    convos.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    setConversations(convos);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Realtime: reload on new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === user.id || msg.recipient_id === user.id) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = conversations.filter((c) =>
    search
      ? `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="app-page">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-10 bg-muted border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            {search ? "No conversations found" : "No messages yet. Start a conversation from a match profile!"}
          </p>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.recipientId}
              onClick={() => navigate(`/messages/${conv.recipientId}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
            >
              <div className="relative flex-shrink-0">
                {conv.profileImage ? (
                  <img src={conv.profileImage} alt={conv.firstName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {conv.firstName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {conv.firstName} {conv.lastName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm truncate mt-0.5",
                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="h-5 min-w-[20px] rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </main>
    </div>
  );
};

export default MessagesList;
