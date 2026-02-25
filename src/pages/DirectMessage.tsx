import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockUsers } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, MoreVertical, Send, Smile, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleMessages = [
  { id: "1", sender: "them", text: "Hey! I saw we matched. Love that you're into hiking too!", time: "2:30 PM" },
  { id: "2", sender: "me", text: "Hi Sarah! Yes, I just did the Lands End trail last weekend. It was amazing!", time: "2:32 PM" },
  { id: "3", sender: "them", text: "Oh I love that trail! Want to check out the new one in Marin this weekend?", time: "2:33 PM" },
  { id: "4", sender: "me", text: "That sounds great! I'm free Saturday morning.", time: "2:35 PM" },
  { id: "5", sender: "them", text: "Perfect! Let's meet at 9am. I'll send you the trailhead location 🥾", time: "2:36 PM" },
];

const DirectMessage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = mockUsers.find((u) => u.id === id) || mockUsers[0];
  const [message, setMessage] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/messages")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={user.profileImage} alt={user.firstName} className="h-9 w-9 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-primary">Online</p>
          </div>
          <button className="text-muted-foreground"><Phone className="h-4 w-4" /></button>
          <button className="text-muted-foreground"><MoreVertical className="h-4 w-4" /></button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-3">
        {sampleMessages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[75%] rounded-2xl px-4 py-2.5",
              msg.sender === "me"
                ? "gradient-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}>
              <p className="text-sm">{msg.text}</p>
              <p className={cn("text-[10px] mt-1", msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</p>
            </div>
          </div>
        ))}
      </main>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button className="text-muted-foreground"><Smile className="h-5 w-5" /></button>
          <button className="text-muted-foreground"><Image className="h-5 w-5" /></button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-muted border-0"
          />
          <button className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
