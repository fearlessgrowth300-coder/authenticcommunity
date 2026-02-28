import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, Pause, Play, Trash2, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  recipientId: string;
  onClose: () => void;
  onSent: () => void;
}

type RecordingState = "recording" | "paused" | "preview" | "sending";

const VoiceRecorder = ({ recipientId, onClose, onSent }: VoiceRecorderProps) => {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>("recording");
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for waveform
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        audioUrlRef.current = URL.createObjectURL(blob);
      };

      recorder.start(100);
      setState("recording");

      // Timer
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      // Waveform animation
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from(data.slice(0, 20)).map((v) => v / 255);
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch {
      toast.error("Microphone access denied");
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [startRecording]);

  const handlePause = () => {
    if (state === "recording") {
      mediaRecorderRef.current?.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setState("paused");
    } else if (state === "paused") {
      mediaRecorderRef.current?.resume();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setWaveform(Array.from(data.slice(0, 20)).map((v) => v / 255));
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
      setState("recording");
    }
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    setState("preview");
  };

  const handleDelete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    onClose();
  };

  const handlePlayPreview = () => {
    if (!audioUrlRef.current) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrlRef.current);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!user || !audioBlobRef.current) return;
    setState("sending");

    const path = `${user.id}/${Date.now()}.webm`;
    const { error } = await supabase.storage.from("voice-messages").upload(path, audioBlobRef.current);
    if (error) { toast.error("Upload failed"); setState("preview"); return; }

    const { data } = supabase.storage.from("voice-messages").getPublicUrl(path);

    await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: "🎤 Voice message",
      message_type: "voice",
      voice_url: data.publicUrl,
      voice_duration: duration,
    });

    onSent();
    onClose();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="sticky bottom-0 border-t border-border bg-card px-3 py-3">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Delete */}
        <button onClick={handleDelete} className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Waveform / Preview */}
        <div className="flex-1 flex items-center gap-2">
          {state === "preview" || state === "sending" ? (
            <>
              <button onClick={handlePlayPreview} className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 flex items-center gap-[2px] h-8">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-primary/30 rounded-full" style={{ height: `${20 + Math.random() * 80}%` }} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={cn("h-3 w-3 rounded-full flex-shrink-0", state === "recording" ? "bg-destructive animate-pulse" : "bg-muted-foreground")} />
              <div className="flex-1 flex items-center gap-[2px] h-8">
                {waveform.map((v, i) => (
                  <div key={i} className="flex-1 bg-primary rounded-full transition-all duration-75" style={{ height: `${Math.max(10, v * 100)}%` }} />
                ))}
                {waveform.length === 0 && Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-muted rounded-full" style={{ height: "10%" }} />
                ))}
              </div>
            </>
          )}
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-10 text-right">{formatTime(duration)}</span>
        </div>

        {/* Actions */}
        {state === "recording" || state === "paused" ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handlePause} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground">
              {state === "recording" ? <Pause className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button onClick={handleStop} className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={handleSend} disabled={state === "sending"} className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50 flex-shrink-0">
            {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
