import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Tab = "followers" | "following" | "connections";
type Person = { user_id: string; first_name: string | null; last_name: string | null; profile_image_url: string | null; location_city: string | null };

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("followers");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      let ids: string[] = [];
      if (tab === "followers") {
        const { data } = await supabase.from("user_follows").select("follower_id").eq("following_id", user.id);
        ids = (data || []).map((row) => row.follower_id);
      } else if (tab === "following") {
        const { data } = await supabase.from("user_follows").select("following_id").eq("follower_id", user.id);
        ids = (data || []).map((row) => row.following_id);
      } else {
        const { data } = await supabase.from("connections").select("user_id_1, user_id_2").or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
        ids = (data || []).map((row: any) => row.user_id_1 === user.id ? row.user_id_2 : row.user_id_1);
      }
      if (!ids.length) { setPeople([]); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url, location_city").in("user_id", ids);
      setPeople(data || []);
      setLoading(false);
    };
    void load();
  }, [tab, user]);

  return <div className="app-page">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/95 px-5 py-3 backdrop-blur-lg"><div className="app-content flex items-center gap-3"><button onClick={() => navigate("/profile")} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><div><p className="text-xs text-muted-foreground">Your people</p><h1 className="text-lg font-bold">Connections</h1></div></div></header>
    <main className="app-content px-5 py-5">
      <div className="mb-5 grid grid-cols-3 rounded-xl bg-muted p-1">{(["followers", "following", "connections"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize ${tab === item ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>{item}</button>)}</div>
      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></div> : people.length ? <div className="space-y-3">{people.map((person) => { const name = `${person.first_name || ""} ${person.last_name || ""}`.trim() || "Member"; return <button key={person.user_id} onClick={() => navigate(`/matches/${person.user_id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-border/90 bg-card p-3 text-left shadow-card"><Avatar className="h-12 w-12"><AvatarImage src={person.profile_image_url || undefined} /><AvatarFallback>{name[0]}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">{person.location_city || "Authentic Community member"}</p></div><Button size="sm" variant="outline">View</Button></button>; })}</div> : <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center"><Users className="mx-auto mb-3 h-7 w-7 text-primary" /><h2 className="font-semibold">No {tab} yet</h2><p className="mt-1 text-sm text-muted-foreground">Discover people and build real connections.</p></div>}
    </main>
  </div>;
}
