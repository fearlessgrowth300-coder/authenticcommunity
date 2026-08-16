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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Plus, MapPin, Users, Loader2, ArrowLeft, Lock } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { scoreLocalRecommendation } from "@/lib/recommendations";

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
  const [formPrivate, setFormPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    let query = supabase.from("communities").select("*").eq("is_active", true).order("member_count", { ascending: false });
    if (selectedCategory) query = query.eq("category", selectedCategory);

    try {
      const [communitiesRes, profileRes, interestsRes] = await Promise.all([
        query,
        user ? supabase.from("profiles").select("location_city").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from("user_interests").select("interest_name").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      const myInterests = (interestsRes.data || []).map((row: { interest_name: string }) => row.interest_name);
      const ranked = (communitiesRes.data || []).map((community: any) => ({
        ...community,
        recommendation: scoreLocalRecommendation({
          itemCity: community.location_city,
          itemCategory: community.category,
          memberCount: community.member_count,
          myCity: profileRes.data?.location_city,
          myInterests,
        }),
      })).sort((a: any, b: any) => b.recommendation.score - a.recommendation.score);
      setCommunities(ranked);
    } finally {
      // Discovery must remain usable even if a secondary membership request is slow.
      setLoading(false);
    }

    if (user) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      setJoinedIds(new Set(memberships?.map((m) => m.community_id) || []));
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedCategory]);

  const handleJoin = async (communityId: string, communityType?: string) => {
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
      if (!hasFeature("unlimited_communities") && joinedIds.size >= 3) {
        toast.error("Free plan is limited to 3 communities. Upgrade to join more!");
        setJoining(null);
        return;
      }
      if (communityType === "private") {
        // Navigate to detail page for private communities
        navigate(`/communities/${communityId}`);
        setJoining(null);
        return;
      }
      await supabase.from("community_members").insert({ community_id: communityId, user_id: user.id });
      setJoinedIds((prev) => new Set(prev).add(communityId));
      void track("community_joined", { community_id: communityId });
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

    const { data, error } = await supabase.from("communities").insert({
      community_name: formName.trim(),
      description: formDesc.trim() || null,
      category: formCategory || null,
      location_city: formCity.trim() || null,
      creator_id: user.id,
      community_type: formPrivate ? "private" : "public",
    }).select("id").single();

    if (error) {
      toast.error("Failed to create community");
    } else {
      // Auto-join as admin
      if (data) {
        await supabase.from("community_members").insert({
          community_id: data.id,
          user_id: user.id,
          role: "admin",
        });
      }
      toast.success("Community created!");
      setCreateOpen(false);
      setFormName(""); setFormDesc(""); setFormCategory(""); setFormCity(""); setFormPrivate(false);
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
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Private Community</Label>
                    <p className="text-xs text-muted-foreground">Members must be approved by admin</p>
                  </div>
                  <Switch checked={formPrivate} onCheckedChange={setFormPrivate} />
                </div>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{c.community_name}</h3>
                    {c.community_type === "private" && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    {c.category && <Badge variant="outline" className="text-xs">{c.category}</Badge>}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {formatCount(c.member_count || 0)}
                    </div>
                    {c.location_city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {c.location_city}
                      </div>
                    )}
                    {c.recommendation?.reason && (
                      <span className="text-[10px] font-medium text-primary">{c.recommendation.reason}</span>
                    )}
                    <Button
                      size="sm"
                      variant={joinedIds.has(c.id) ? "outline" : "gradient"}
                      className="ml-auto text-xs h-7"
                      disabled={joining === c.id || !canInteract}
                      onClick={(e) => { e.stopPropagation(); handleJoin(c.id, c.community_type); }}
                    >
                      {joining === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : joinedIds.has(c.id) ? "Joined" : c.community_type === "private" ? "Request" : "Join"}
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
