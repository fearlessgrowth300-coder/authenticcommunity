import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Type, Image, Video, Smile, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createTextStory, createImageStory, createVideoStory } from "@/lib/stories";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const bgColors = ["#3b82f6", "#ec4899", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#1f2937", "#6366f1"];

type StoryType = "text" | "image" | "video";

const CreateStory = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<StoryType>("text");
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState(bgColors[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: interests } = await supabase.from("user_interests").select("interest_name").eq("user_id", data.user.id);
      setAvailableTags((interests || []).map((interest) => interest.interest_name));
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      if (type === "text") {
        if (!text.trim()) { toast.error("Write something first"); setPosting(false); return; }
        await createTextStory(text, bgColor, selectedTags);
      } else if (type === "image") {
        if (!file) { toast.error("Select an image first"); setPosting(false); return; }
        await createImageStory(file, selectedTags);
      } else {
        if (!file) { toast.error("Select a video first"); setPosting(false); return; }
        await createVideoStory(file, selectedTags);
      }
      toast.success("Story posted!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to post story");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold text-foreground">Create Story</h1>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="px-5 py-5 max-w-lg mx-auto space-y-5">
        {/* Type tabs */}
        <div className="flex gap-2">
          {([
            { key: "text" as StoryType, icon: Type, label: "Text" },
            { key: "image" as StoryType, icon: Image, label: "Image" },
            { key: "video" as StoryType, icon: Video, label: "Video" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => { setType(t.key); setFile(null); setPreview(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                type === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/50 hover:bg-muted"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Text story editor */}
        {type === "text" && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-6 min-h-[300px] flex items-center justify-center"
              style={{ backgroundColor: bgColor }}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your story..."
                className="bg-transparent border-none text-white text-xl text-center placeholder:text-white/60 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={5}
              />
            </div>
            <div className="flex gap-2 justify-center">
              {bgColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={cn("h-8 w-8 rounded-full transition-transform", bgColor === c && "ring-2 ring-offset-2 ring-primary scale-110")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Image/Video upload */}
        {(type === "image" || type === "video") && (
          <div className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="hidden"
            />
            {preview ? (
              <div className="rounded-2xl overflow-hidden bg-muted min-h-[300px] flex items-center justify-center">
                {type === "image" ? (
                  <img src={preview} alt="Preview" className="w-full max-h-[400px] object-contain" />
                ) : (
                  <video src={preview} controls className="w-full max-h-[400px]" />
                )}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border min-h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                {type === "image" ? <Image className="h-10 w-10" /> : <Video className="h-10 w-10" />}
                <span className="text-sm font-medium">Tap to upload {type}</span>
              </button>
            )}
            {preview && (
              <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                Change {type}
              </Button>
            )}
          </div>
        )}

        {availableTags.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tag this for the right people</p>
            <p className="mb-3 text-xs text-muted-foreground">Tagged stories and videos are recommended to members who chose the same interests.</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button key={tag} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", selectedTags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                  {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
          <Button className="flex-1" onClick={handlePost} disabled={posting}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Story"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateStory;
