import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EventReviewsProps {
  eventId: string;
  isAttendee: boolean;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; profile_image_url: string | null };
}

const EventReviews = ({ eventId, isAttendee }: EventReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("event_reviews").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, profile_image_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setReviews(data.map((r) => ({ ...r, profile: profileMap.get(r.user_id) })));
      
      if (user) {
        const myExisting = data.find((r) => r.user_id === user.id);
        if (myExisting) {
          setHasReviewed(true);
          setMyRating(myExisting.rating);
          setMyReview(myExisting.review_text || "");
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);

  const handleSubmit = async () => {
    if (!user || myRating === 0) return;
    setSubmitting(true);

    const payload = { event_id: eventId, user_id: user.id, rating: myRating, review_text: myReview.trim() || null };
    
    if (hasReviewed) {
      await supabase.from("event_reviews").update({ rating: myRating, review_text: myReview.trim() || null }).eq("event_id", eventId).eq("user_id", user.id);
    } else {
      await supabase.from("event_reviews").insert(payload);
    }

    toast.success(hasReviewed ? "Review updated" : "Review submitted!");
    setHasReviewed(true);
    load();
    setSubmitting(false);
  };

  const getName = (profile?: any) => {
    if (!profile) return "User";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Average rating */}
      {avgRating && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(avgRating)) ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{avgRating}</span>
          <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      )}

      {/* Write review form */}
      {isAttendee && (
        <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{hasReviewed ? "Update your review" : "Write a review"}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setMyRating(s)}>
                <Star className={cn("h-6 w-6 transition-colors", s <= myRating ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Share your experience..." value={myReview} onChange={(e) => setMyReview(e.target.value)} rows={2} className="resize-none" />
          <Button variant="gradient" size="sm" onClick={handleSubmit} disabled={myRating === 0 || submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            {hasReviewed ? "Update" : "Submit"}
          </Button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.filter((r) => r.user_id !== user?.id).map((r) => (
        <div key={r.id} className="flex gap-3">
          {r.profile?.profile_image_url ? (
            <img src={r.profile.profile_image_url} className="h-9 w-9 rounded-full object-cover flex-shrink-0" alt="" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
              {getName(r.profile)[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{getName(r.profile)}</p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("h-3 w-3", s <= r.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
                ))}
              </div>
            </div>
            {r.review_text && <p className="text-sm text-muted-foreground mt-0.5">{r.review_text}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
      ))}

      {reviews.length === 0 && !isAttendee && (
        <p className="text-center text-sm text-muted-foreground py-8">No reviews yet</p>
      )}
    </div>
  );
};

export default EventReviews;
