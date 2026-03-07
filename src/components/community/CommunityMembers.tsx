import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";

interface CommunityMembersProps {
  communityId: string;
  totalMemberCount?: number;
}

interface Member {
  user_id: string;
  role: string | null;
  joined_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null; location_city: string | null };
}

const CommunityMembers = ({ communityId }: CommunityMembersProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("community_members")
        .select("user_id, role, joined_at")
        .eq("community_id", communityId)
        .order("joined_at", { ascending: true });

      if (data) {
        const userIds = data.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_image_url, location_city")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        setMembers(data.map((m) => ({ ...m, profile: profileMap.get(m.user_id) })));
      }
      setLoading(false);
    };
    load();
  }, [communityId]);

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">{members.length} members</p>
      {members.map((m) => (
        <button
          key={m.user_id}
          onClick={() => navigate(`/matches/${m.user_id}`)}
          className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:bg-muted/30 transition-colors text-left"
        >
          {m.profile?.profile_image_url ? (
            <img src={m.profile.profile_image_url} className="h-10 w-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {getName(m.profile)[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{getName(m.profile)}</p>
              {m.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Admin</span>}
            </div>
            {m.profile?.location_city && (
              <p className="text-xs text-muted-foreground">{m.profile.location_city}</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">Joined {format(new Date(m.joined_at), "MMM d")}</p>
        </button>
      ))}
    </div>
  );
};

export default CommunityMembers;
