import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isMe: boolean;
}

const VoiceMessagePlayer = ({ url, duration, isMe }: VoiceMessagePlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
      audio.onloadedmetadata = () => {
        audio.play();
        setPlaying(true);
        updateProgress();
      };
      return;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
      updateProgress();
    }
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (!audio.paused) {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      setCurrentTime(Math.floor(audio.currentTime));
      animRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const displayDuration = duration || 0;

  // Generate static waveform bars
  const bars = Array.from({ length: 24 }, (_, i) => {
    const seed = (i * 7 + 3) % 10;
    return 20 + seed * 8;
  });

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button onClick={togglePlay} className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        isMe ? "bg-primary-foreground/20" : "bg-primary/10"
      )}>
        {playing ? (
          <Pause className={cn("h-3.5 w-3.5", isMe ? "text-primary-foreground" : "text-primary")} />
        ) : (
          <Play className={cn("h-3.5 w-3.5", isMe ? "text-primary-foreground" : "text-primary")} />
        )}
      </button>
      <div className="flex-1 space-y-1">
        <div className="flex items-end gap-[2px] h-5">
          {bars.map((h, i) => {
            const filled = progress > (i / bars.length) * 100;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  filled
                    ? isMe ? "bg-primary-foreground/80" : "bg-primary"
                    : isMe ? "bg-primary-foreground/30" : "bg-primary/30"
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <p className={cn("text-[10px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {playing ? formatTime(currentTime) : formatTime(displayDuration)}
        </p>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
