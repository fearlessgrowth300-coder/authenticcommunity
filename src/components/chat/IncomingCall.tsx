import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallProps {
  callerName: string;
  callerImage?: string | null;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCall = ({ callerName, callerImage, onAccept, onReject }: IncomingCallProps) => {
  return (
    <div className="fixed inset-0 z-[60] bg-foreground/95 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing ring */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute -inset-3 rounded-full bg-primary/30 animate-pulse" />
          {callerImage ? (
            <img src={callerImage} alt={callerName} className="relative h-28 w-28 rounded-full object-cover border-4 border-card/30" />
          ) : (
            <div className="relative h-28 w-28 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground border-4 border-card/30">
              {callerName[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-card text-2xl font-bold">{callerName}</p>
          <p className="text-card/60 text-sm mt-1">Incoming call...</p>
        </div>

        {/* Accept / Reject */}
        <div className="flex items-center gap-16 mt-8">
          <button onClick={onReject} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-destructive flex items-center justify-center shadow-lg">
              <PhoneOff className="h-7 w-7 text-card" />
            </div>
            <span className="text-card/70 text-xs">Decline</span>
          </button>
          <button onClick={onAccept} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-bounce">
              <Phone className="h-7 w-7 text-card" />
            </div>
            <span className="text-card/70 text-xs">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
