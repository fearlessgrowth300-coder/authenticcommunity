import { useNavigate } from "react-router-dom";
import { mockMessages } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const MessagesList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-foreground mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10 bg-muted border-0" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {mockMessages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => navigate(`/messages/${msg.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
          >
            <div className="relative flex-shrink-0">
              <img src={msg.user.profileImage} alt={msg.user.firstName} className="h-12 w-12 rounded-full object-cover" />
              {msg.user.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{msg.user.firstName} {msg.user.lastName}</p>
                <span className="text-xs text-muted-foreground">{msg.time}</span>
              </div>
              <p className={cn("text-sm truncate mt-0.5", msg.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                {msg.lastMessage}
              </p>
            </div>
            {msg.unread > 0 && (
              <span className="h-5 min-w-[20px] rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                {msg.unread}
              </span>
            )}
          </button>
        ))}
      </main>
    </div>
  );
};

export default MessagesList;
