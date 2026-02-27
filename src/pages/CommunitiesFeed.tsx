import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAccountRestrictions } from "@/hooks/useAccountRestrictions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MapPin, Users, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = ["Outdoors", "Food & Drink", "Arts & Culture", "Wellness", "Tech", "Social", "Sports", "Learning"];

const CommunitiesFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const { canInteract, restrictionMessage } = useAccountRestrictions();
  const [communities, setCommunities] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCity, setFormCity] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    let query = supabase.from("communities").select("*").eq("is_active", true).order("member_count", { ascending: false });
    if (selectedCategory) query = query.eq("category", selectedCategory);

    const { data } = await query;
    setCommunities(data || []);

    if (user) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      setJoinedIds(new Set(memberships?.map((m) => m.community_id) || []));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedCategory]);

  const handleJoin = async (communityId: string) => {
    if (!user) return;
    if (!canInteract) {
      toast.error(restrictionMessage || "This action is disabled for your account.");
      return;
    }
    setJoining(communityId);

    if (joinedIds.has(communityId)) {
      await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", user.id);
      setJoinedIds((prev) => { const n = new Set(prev); n.delete(communityId); return n; });
      toast.success("Left community");
    } else {
      // Check free tier community limit
      if (!hasFeature("unlimited_communities") && joinedIds.size >= 3) {
        toast.error("Free plan is limited to 3 communities. Upgrade to join more!");
        setJoining(null);
        return;
      }
      await supabase.from("community_members").insert({ community_id: communityId, user_id: user.id });
      setJoinedIds((prev) => new Set(prev).add(communityId));
      toast.success("Joined community!");
    }
    setJoining(null);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !user) return;
    if (!canInteract) {
      toast.error(restrictionMessage || "This action is disabled for your account.");
      return;
    }
    setCreating(true);

    const { error } = await supabase.from("communities").insert({
      community_name: formName.trim(),
      description: formDesc.trim() || null,
      category: formCategory || null,
      location_city: formCity.trim() || null,
      creator_id: user.id,
    });

    if (error) {
      toast.error("Failed to create community");
    } else {
      toast.success("Community created!");
      setCreateOpen(false);
      setFormName(""); setFormDesc(""); setFormCategory(""); setFormCity("");
      loadData();
    }
    setCreating(false);
  };

  const filtered = communities.filter((c) =>
    search ? c.community_name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/50 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Communities</h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50" disabled={!canInteract}>
                <Plus className="h-4 w-4 text-primary-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Community</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Community name *" value={formName} onChange={(e) => setFormName(e.target.value)} />
                <Textarea placeholder="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Input placeholder="City" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                <Button variant="gradient" className="w-full" onClick={handleCreate} disabled={!formName.trim() || creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities..." className="pl-10 bg-muted border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>

      <main className="px-5 py-4 max-w-lg mx-auto">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              !selectedCategory ? "gradient-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat ? "gradient-primary text-primary-foreground border-transparent" : "bg-card text-muted-foreground border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            {search ? "No communities found" : "No communities yet. Create one!"}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => navigate(`/communities/${c.id}`)}
              >
                {c.profile_image_url && (
                  <img src={c.profile_image_url} alt={c.community_name} className="w-full h-36 object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{c.community_name}</h3>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {c.category && <Badge variant="outline" className="text-xs">{c.category}</Badge>}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {c.member_count || 0}
                    </div>
                    {c.location_city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {c.location_city}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={joinedIds.has(c.id) ? "outline" : "gradient"}
                      className="ml-auto text-xs h-7"
                      disabled={joining === c.id || !canInteract}
                      onClick={(e) => { e.stopPropagation(); handleJoin(c.id); }}
                    >
                      {joining === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : joinedIds.has(c.id) ? "Joined" : "Join"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunitiesFeed;
