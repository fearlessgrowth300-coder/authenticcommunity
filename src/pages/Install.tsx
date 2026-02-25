import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Share, Check, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm mx-auto space-y-6 animate-fade-in">
        <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-soft">
          <Smartphone className="h-10 w-10 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Install Commune</h1>
          <p className="text-muted-foreground text-sm">
            Add Commune to your home screen for the best experience — instant access, offline support, and a native app feel.
          </p>
        </div>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Check className="h-5 w-5" />
            <span>App is installed!</span>
          </div>
        ) : deferredPrompt ? (
          <Button variant="gradient" size="lg" className="w-full" onClick={handleInstall}>
            <Download className="h-4 w-4 mr-2" /> Install App
          </Button>
        ) : isIOS ? (
          <div className="bg-card rounded-xl border border-border/50 p-4 text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">To install on iPhone:</p>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                Tap the <Share className="h-4 w-4 inline text-primary" /> Share button in Safari
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                Tap <strong>"Add"</strong> to confirm
              </li>
            </ol>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/50 p-4 text-left">
            <p className="text-sm text-muted-foreground">
              Open this page in Chrome or Edge on your phone, then use the browser menu to "Add to Home Screen" or "Install App".
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
          Continue in browser
        </Button>
      </div>
    </div>
  );
};

export default Install;
