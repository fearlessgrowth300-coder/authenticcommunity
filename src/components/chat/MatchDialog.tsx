import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchedUser: { name: string; imageUrl: string | null; userId: string };
  onMessage: () => void;
}

const MatchDialog = ({ open, onOpenChange, matchedUser, onMessage }: MatchDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs text-center p-8 rounded-3xl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-destructive via-destructive/80 to-accent opacity-30 blur-xl animate-pulse" />
            {matchedUser.imageUrl ? (
              <img
                src={matchedUser.imageUrl}
                alt={matchedUser.name}
                className="relative h-24 w-24 rounded-full object-cover border-4 border-background"
              />
            ) : (
              <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground border-4 border-background">
                {matchedUser.name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-destructive text-destructive animate-bounce" />
            <Heart className="h-6 w-6 fill-destructive text-destructive animate-bounce" style={{ animationDelay: "0.1s" }} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">It's a Match!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You and {matchedUser.name} liked each other
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Keep Swiping
            </Button>
            <Button variant="gradient" className="flex-1" onClick={onMessage}>
              <MessageCircle className="h-4 w-4 mr-1" /> Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDialog;
