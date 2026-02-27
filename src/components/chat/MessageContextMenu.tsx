import { Copy, Reply, Forward, Trash2, Pin, Bookmark, MoreHorizontal, Info, Globe } from "lucide-react";
import { toast } from "sonner";

interface MessageContextMenuProps {
  isMe: boolean;
  content: string;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡", "👏"];

const MessageContextMenu = ({ isMe, content, onClose, onReply, onDelete, position }: MessageContextMenuProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
    onClose();
  };

  const menuItems = [
    { icon: Reply, label: "Reply", action: () => { onReply(); onClose(); } },
    { icon: Forward, label: "Forward", action: () => { toast.info("Forward coming soon"); onClose(); } },
    { icon: Copy, label: "Copy", action: handleCopy },
    { icon: Bookmark, label: "Keep", action: () => { toast.info("Message saved"); onClose(); } },
    ...(isMe ? [{ icon: Trash2, label: "Delete", action: () => { onDelete(); onClose(); }, destructive: true }] : []),
    { icon: Pin, label: "Pin", action: () => { toast.info("Message pinned"); onClose(); } },
    { icon: Globe, label: "Translate", action: () => { toast.info("Translation coming soon"); onClose(); } },
    { icon: Info, label: "Info", action: () => { toast.info("Message info coming soon"); onClose(); } },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 w-56 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ top: Math.min(position.y, window.innerHeight - 400), left: Math.min(position.x, window.innerWidth - 240) }}
      >
        {/* Quick reactions */}
        <div className="flex items-center gap-1 px-3 py-2.5 border-b border-border/50">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { toast.success(`Reacted ${emoji}`); onClose(); }}
              className="text-xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="py-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                (item as any).destructive ? "text-destructive" : "text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MessageContextMenu;
