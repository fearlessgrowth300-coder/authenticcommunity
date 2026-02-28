import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, X, Search, Sparkles, User, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

type Tab = "trending" | "search" | "my";

const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Public beta key

const StickerPicker = ({ onSelect, onClose }: StickerPickerProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("trending");
  const [savedStickers, setSavedStickers] = useState<string[]>([]);
  const [giphyStickers, setGiphyStickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load saved stickers
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_saved_stickers")
      .select("sticker_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSavedStickers((data || []).map((s: any) => s.sticker_url));
        setLoading(false);
      });
  }, [user]);

  // Load trending Giphy stickers
  useEffect(() => {
    if (tab === "trending" && giphyStickers.length === 0) {
      fetchGiphy("trending");
    }
  }, [tab]);

  const fetchGiphy = async (type: "trending" | "search", query?: string) => {
    setGiphyLoading(true);
    try {
      const url = type === "trending"
        ? `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`
        : `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query || "")}&limit=30&rating=g`;
      
      const res = await fetch(url);
      const json = await res.json();
      const urls = (json.data || []).map((g: any) => g.images?.fixed_width?.url).filter(Boolean);
      setGiphyStickers(urls);
    } catch {
      toast.error("Failed to load stickers");
    }
    setGiphyLoading(false);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim()) {
      setTab("search");
      searchTimeoutRef.current = setTimeout(() => fetchGiphy("search", q), 400);
    } else {
      setTab("trending");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("stickers").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("stickers").getPublicUrl(path);
    await supabase.from("user_saved_stickers").insert({ user_id: user.id, sticker_url: data.publicUrl });
    setSavedStickers((prev) => [data.publicUrl, ...prev]);
    setUploading(false);
    toast.success("Sticker added!");
  };

  const handleStickerClick = (url: string) => {
    setPreview(url);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "trending", label: "Trending", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "my", label: "My Stickers", icon: <User className="h-3.5 w-3.5" /> },
  ];

  const displayStickers = tab === "my" ? savedStickers : giphyStickers;
  const isLoading = tab === "my" ? loading : giphyLoading;

  return (
    <div className="bg-card border-t border-border">
      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="bg-card rounded-2xl p-4 max-w-xs w-full mx-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="sticker preview" className="w-40 h-40 mx-auto object-contain" />
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 h-10 rounded-lg border border-border text-sm text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => { onSelect(preview); onClose(); setPreview(null); }}
                className="flex-1 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearchQuery(""); }}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              tab === t.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
        {tab === "my" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="ml-auto text-xs text-primary flex items-center gap-1"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Sticker grid */}
      <div className="h-52 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : displayStickers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              {tab === "my" ? "No custom stickers yet. Add some!" : "No stickers found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {displayStickers.map((url, i) => (
              <button
                key={`${url}-${i}`}
                onClick={() => handleStickerClick(url)}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all bg-muted"
              >
                <img src={url} alt="sticker" className="w-full h-full object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPicker;
