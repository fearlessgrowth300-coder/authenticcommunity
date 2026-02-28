import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileText, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CommunityResourcesProps {
  communityId: string;
  isMember: boolean;
}

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  resource_url: string;
  resource_type: string | null;
  created_at: string;
}

const CommunityResources = ({ communityId, isMember }: CommunityResourcesProps) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("community_resources")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [communityId]);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("community_resources").insert({
      community_id: communityId,
      user_id: user.id,
      title: title.trim(),
      resource_url: url.trim(),
    });
    if (error) toast.error("Failed to add resource");
    else { setTitle(""); setUrl(""); setShowAdd(false); load(); }
    setAdding(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {isMember && (
        showAdd ? (
          <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
            <Input placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleAdd} disabled={!title.trim() || !url.trim() || adding}>
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Resource
          </Button>
        )
      )}

      {resources.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No resources shared yet</p>
      ) : resources.map((r) => (
        <a
          key={r.id}
          href={r.resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{r.resource_url}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </a>
      ))}
    </div>
  );
};

export default CommunityResources;
