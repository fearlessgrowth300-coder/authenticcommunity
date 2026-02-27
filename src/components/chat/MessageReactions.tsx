import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
}

interface MessageReactionsProps {
  messageId: string;
  isMe: boolean;
}

const MessageReactions = ({ messageId, isMe }: MessageReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("message_reactions")
        .select("id, emoji, user_id")
        .eq("message_id", messageId);
      setReactions((data as Reaction[]) || []);
    };
    load();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions", filter: `message_id=eq.${messageId}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messageId]);

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.emoji === emoji && r.user_id === user.id);
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("message_reactions")
        .insert({ message_id: messageId, user_id: user.id, emoji } as any)
        .select("id, emoji, user_id")
        .single();
      if (data) setReactions((prev) => [...prev, data as Reaction]);
    }
    setShowPicker(false);
  };

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; hasMe: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
    acc[r.emoji].count++;
    if (r.user_id === user?.id) acc[r.emoji].hasMe = true;
    return acc;
  }, {});

  return (
    <div className={cn("flex flex-wrap gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
      {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all",
            hasMe
              ? "bg-primary/20 border border-primary/40"
              : "bg-muted/80 border border-border/50 hover:bg-muted"
          )}
        >
          <span className="text-xs">{emoji}</span>
          {count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="h-5 w-5 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-[10px] text-muted-foreground transition-colors"
        >
          +
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className={cn(
              "absolute z-50 bottom-7 bg-card border border-border rounded-full shadow-lg px-2 py-1.5 flex gap-1 animate-in fade-in zoom-in-95",
              isMe ? "right-0" : "left-0"
            )}>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
