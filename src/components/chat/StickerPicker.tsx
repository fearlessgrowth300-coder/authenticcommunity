import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

const StickerPicker = ({ onSelect, onClose }: StickerPickerProps) => {
  const { user } = useAuth();
  const [savedStickers, setSavedStickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Sticker must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("stickers").upload(path, file);
    if (uploadError) {
      toast.error("Failed to upload sticker");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("stickers").getPublicUrl(path);
    const url = urlData.publicUrl;

    await supabase.from("user_saved_stickers").insert({ user_id: user.id, sticker_url: url });
    setSavedStickers((prev) => [url, ...prev]);
    setUploading(false);
    toast.success("Sticker added!");
  };

  return (
    <div className="bg-card border-t border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs font-medium text-foreground">My Stickers</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-primary flex items-center gap-1"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      <div className="h-48 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : savedStickers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No stickers yet. Add some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {savedStickers.map((url, i) => (
              <button
                key={i}
                onClick={() => { onSelect(url); onClose(); }}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all bg-muted"
              >
                <img src={url} alt="sticker" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPicker;
