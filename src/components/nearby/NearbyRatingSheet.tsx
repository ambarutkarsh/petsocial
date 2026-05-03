import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { toast } from "sonner";
import { Loader2, Star, X } from "lucide-react";
import { ensureDbListing, NormalizedListing, trackNearby } from "@/lib/nearbyHelpers";

interface Props {
  listing: NormalizedListing;
  open: boolean;
  onClose: () => void;
  onRated?: () => void;
}

const NearbyRatingSheet = ({ listing, open, onClose, onRated }: Props) => {
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!user) { triggerGuestPopup(); return; }
    if (!stars) { toast.error("Please pick a star rating"); return; }
    setSubmitting(true);
    try {
      const target = listing.isDb ? listing.id : await ensureDbListing(listing, user.id);
      if (!target) throw new Error("Could not save listing");
      const { error } = await supabase.from("nearby_ratings").upsert({
        listing_id: target,
        listing_type: listing.category,
        user_id: user.id,
        rating: stars,
        review: review.trim() || null,
      } as any, { onConflict: "listing_id,listing_type,user_id" });
      if (error) throw error;
      trackNearby("nearby_listing_rated", { category: listing.category, rating: stars });
      toast.success("Thanks for rating!");
      onRated?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Could not save rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-card rounded-t-[28px] p-5">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-bold">Rate this place</h2>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{listing.title}</p>
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(n)}
              aria-label={`${n} stars`}
              className="transition-transform active:scale-90"
            >
              <Star
                size={36}
                className={(hover || stars) >= n ? "fill-yellow-400 text-yellow-400" : "text-muted"}
              />
            </button>
          ))}
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={500}
          placeholder="Add a short review (optional)"
          className="w-full min-h-[80px] rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm font-body focus:outline-none focus:border-primary"
        />
        <button
          onClick={submit}
          disabled={submitting || !stars}
          className="w-full h-12 mt-4 rounded-full bg-primary text-primary-foreground font-heading font-bold disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Rating"}
        </button>
      </div>
    </div>
  );
};

export default NearbyRatingSheet;
