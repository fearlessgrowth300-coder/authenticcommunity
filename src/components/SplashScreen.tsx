import { useState, useRef, useEffect } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen = ({ onFinished }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setFadeOut(true);
      setTimeout(onFinished, 600);
    };

    // Minimum display time of 6 seconds
    const minTime = 6000;
    const startedAt = Date.now();

    const endWithMinTime = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minTime - elapsed);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinished, 600);
      }, remaining);
    };

    // Fallback: if video can't play, still show splash for 6s
    const fallback = setTimeout(() => {
      if (!fadeOut) endWithMinTime();
    }, 8000);

    video.addEventListener("ended", () => endWithMinTime());
    video.play().catch(() => {
      // autoplay blocked – still hold splash for 6s then skip
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinished, 600);
      }, minTime);
    });

    return () => {
      clearTimeout(fallback);
    };
  }, [onFinished, fadeOut]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src="/splash.mp4"
        muted
        playsInline
        loop
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default SplashScreen;
