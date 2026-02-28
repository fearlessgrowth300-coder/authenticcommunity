import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface EventPhotosProps {
  eventId: string;
  isAttendee: boolean;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  user_id: string;
  created_at: string;
}

const EventPhotos = ({ eventId, isAttendee }: EventPhotosProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("event_photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${eventId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-photos").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }

    const { data } = supabase.storage.from("event-photos").getPublicUrl(path);
    await supabase.from("event_photos").insert({ event_id: eventId, user_id: user.id, photo_url: data.publicUrl });
    load();
    setUploading(false);
    toast.success("Photo uploaded!");
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white"><X className="h-6 w-6" /></button>
          <img src={selectedPhoto} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
      )}

      {isAttendee && (
        <div className="mb-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-sm text-primary"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Upload Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No photos yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <button key={p.id} onClick={() => setSelectedPhoto(p.photo_url)} className="aspect-square rounded-lg overflow-hidden">
              <img src={p.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventPhotos;
