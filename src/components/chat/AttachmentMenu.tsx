import { useRef, useState } from "react";
import { Image as ImageIcon, Camera, MapPin, FileText, Headphones, BarChart3, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LocationPicker from "./LocationPicker";

interface AttachmentMenuProps {
  recipientId: string;
  onClose: () => void;
  onStickerOpen: () => void;
  onImageSent: (url: string) => void;
}

const AttachmentMenu = ({ recipientId, onClose, onStickerOpen, onImageSent }: AttachmentMenuProps) => {
  const { user } = useAuth();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [showLocation, setShowLocation] = useState(false);

  const handleFileUpload = async (file: File, type: string) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const bucket = "stickers"; // reuse stickers bucket for attachments

    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast.error(`Failed to upload ${type}`);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    // Send as message
    await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: `📎 ${type}: ${file.name}`,
      message_type: type === "image" ? "image" : "file",
      sticker_url: data.publicUrl,
    });
    onImageSent(data.publicUrl);
    onClose();
  };

  const items = [
    {
      icon: ImageIcon,
      label: "Gallery",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      action: () => galleryRef.current?.click(),
    },
    {
      icon: Camera,
      label: "Camera",
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      action: () => cameraRef.current?.click(), // uses capture="environment" on the input
    },
    {
      icon: FileText,
      label: "Document",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      action: () => docRef.current?.click(),
    },
    {
      icon: Headphones,
      label: "Audio",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      action: () => audioRef.current?.click(),
    },
    {
      icon: MapPin,
      label: "Location",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      action: () => setShowLocation(true),
    },
    {
      icon: User,
      label: "Contact",
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      action: () => { toast.info("Contact sharing coming soon"); onClose(); },
    },
    {
      icon: BarChart3,
      label: "Poll",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      action: () => { toast.info("Polls coming soon"); onClose(); },
    },
    {
      icon: Calendar,
      label: "Event",
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      action: () => { toast.info("Event sharing coming soon"); onClose(); },
    },
  ];

  if (showLocation) {
    return (
      <LocationPicker
        recipientId={recipientId}
        onClose={() => setShowLocation(false)}
        onSent={() => onClose()}
      />
    );
  }

  return (
    <div className="bg-card border-t border-border px-4 py-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`h-14 w-14 rounded-2xl ${item.bg} flex items-center justify-center border border-border/30`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFileUpload(f, "image");
      }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFileUpload(f, "image");
      }} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFileUpload(f, "document");
      }} />
      <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFileUpload(f, "audio");
      }} />
    </div>
  );
};

export default AttachmentMenu;
