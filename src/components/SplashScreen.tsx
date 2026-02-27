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
      setTimeout(onFinished, 500);
    };

    // Fallback: if video can't play (e.g. autoplay blocked), skip after 3s
    const fallback = setTimeout(() => {
      if (!fadeOut) {
        setFadeOut(true);
        setTimeout(onFinished, 500);
      }
    }, 5000);

    video.addEventListener("ended", handleEnded);
    video.play().catch(() => {
      // autoplay blocked – skip splash
      clearTimeout(fallback);
      onFinished();
    });

    return () => {
      video.removeEventListener("ended", handleEnded);
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
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default SplashScreen;
