import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface VideoCallProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  isIncoming?: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
}

const VideoCall = ({ recipientId, recipientName, onClose, isIncoming, incomingOffer }: VideoCallProps) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
  }, []);

  // Get media FIRST (must be in user gesture context from parent click)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const init = async () => {
      try {
        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        // Add all tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote tracks
        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
          setCallState("connected");
        };

        // Handle ICE candidates
        pc.onicecandidate = (e) => {
          if (e.candidate && user) {
            supabase.from("call_signals").insert({
              caller_id: user.id,
              callee_id: recipientId,
              signal_type: "ice-candidate",
              signal_data: e.candidate.toJSON(),
            } as any);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            setCallState("connected");
          } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            toast.error("Connection lost");
          }
        };

        if (isIncoming && incomingOffer) {
          // Answer the call
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
          
          // Flush queued ICE candidates
          for (const candidate of iceCandidateQueue.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
          }
          iceCandidateQueue.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await supabase.from("call_signals").insert({
            caller_id: user.id,
            callee_id: recipientId,
            signal_type: "answer",
            signal_data: answer,
          } as any);

          setCallState("connected");
        } else {
          // Create offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          await supabase.from("call_signals").insert({
            caller_id: user.id,
            callee_id: recipientId,
            signal_type: "offer",
            signal_data: offer,
          } as any);

          setCallState("ringing");
        }
      } catch (err: any) {
        console.error("Call setup error:", err);
        toast.error("Camera/microphone access denied. Check browser permissions.");
        onClose();
      }
    };

    init();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Listen for signaling
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`call-signal-${user.id}-${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "call_signals",
        filter: `callee_id=eq.${user.id}`,
      }, async (payload) => {
        const signal = payload.new as any;
        if (signal.caller_id !== recipientId) return;
        const pc = pcRef.current;

        if (signal.signal_type === "answer" && pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
            // Flush queued ICE candidates
            for (const candidate of iceCandidateQueue.current) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
            }
            iceCandidateQueue.current = [];
            setCallState("connected");
          } catch (e) {
            console.error("Error setting remote description:", e);
          }
        } else if (signal.signal_type === "ice-candidate") {
          if (pc && pc.remoteDescription) {
            try { await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data)); } catch {}
          } else {
            // Queue if remote description not set yet
            iceCandidateQueue.current.push(signal.signal_data);
          }
        } else if (signal.signal_type === "hangup") {
          setCallState("ended");
          cleanup();
          setTimeout(onClose, 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  const hangUp = async () => {
    if (user) {
      await supabase.from("call_signals").insert({
        caller_id: user.id,
        callee_id: recipientId,
        signal_type: "hangup",
        signal_data: {},
      } as any);
    }
    cleanup();
    setCallState("ended");
    setTimeout(onClose, 500);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/95 flex flex-col">
      {/* Remote video */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {callState !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground mb-4">
              {recipientName[0]?.toUpperCase()}
            </div>
            <p className="text-card text-lg font-semibold">{recipientName}</p>
            <p className="text-card/70 text-sm mt-1">
              {callState === "connecting" ? "Connecting..." : callState === "ringing" ? "Ringing..." : "Call ended"}
            </p>
          </div>
        )}
        {/* Local video PiP */}
        <div className="absolute top-4 right-4 w-28 h-40 rounded-xl overflow-hidden shadow-lg border-2 border-card/50">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 py-8 bg-foreground/80 backdrop-blur">
        <button onClick={toggleMute} className={cn("h-14 w-14 rounded-full flex items-center justify-center", isMuted ? "bg-destructive" : "bg-card/20")}>
          {isMuted ? <MicOff className="h-6 w-6 text-card" /> : <Mic className="h-6 w-6 text-card" />}
        </button>
        <button onClick={hangUp} className="h-16 w-16 rounded-full bg-destructive flex items-center justify-center">
          <PhoneOff className="h-7 w-7 text-card" />
        </button>
        <button onClick={toggleVideo} className={cn("h-14 w-14 rounded-full flex items-center justify-center", isVideoOff ? "bg-destructive" : "bg-card/20")}>
          {isVideoOff ? <VideoOff className="h-6 w-6 text-card" /> : <Video className="h-6 w-6 text-card" />}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
