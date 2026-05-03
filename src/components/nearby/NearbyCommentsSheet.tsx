import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { toast } from "sonner";
import { Loader2, X, Send } from "lucide-react";
import { ensureDbListing, NormalizedListing, trackNearby } from "@/lib/nearbyHelpers";
import { formatDistanceToNow } from "date-fns";

interface Props {
  listing: NormalizedListing;
  open: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const NearbyCommentsSheet = ({ listing, open, onClose, onCommentAdded }: Props) => {
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dbId, setDbId] = useState<string | null>(listing.isDb ? listing.id : null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      const targetId = listing.isDb ? listing.id : null;
      if (!targetId) {
        setComments([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("nearby_comments")
        .select("id, comment, created_at, user_id")
        .eq("listing_id", targetId)
        .eq("listing_type", listing.category)
        .order("created_at", { ascending: false });
      if (!active) return;
      setComments(data || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [open, listing.id, listing.isDb, listing.category]);

  if (!open) return null;

  const submit = async () => {
    if (!user) { triggerGuestPopup(); return; }
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) { toast.error("Comments must be 500 characters or fewer"); return; }
    setSubmitting(true);
    try {
      let target = dbId;
      if (!target) {
        target = await ensureDbListing(listing, user.id);
        if (!target) throw new Error("Could not save listing");
        setDbId(target);
      }
      const { error } = await supabase.from("nearby_comments").insert({
        listing_id: target,
        listing_type: listing.category,
        user_id: user.id,
        comment: trimmed,
      } as any);
      if (error) throw error;
      setText("");
      const { data } = await supabase
        .from("nearby_comments")
        .select("id, comment, created_at, user_id")
        .eq("listing_id", target)
        .eq("listing_type", listing.category)
        .order("created_at", { ascending: false });
      setComments(data || []);
      trackNearby("nearby_listing_comment_added", { category: listing.category });
      onCommentAdded?.();
      toast.success("Comment added");
    } catch (e: any) {
      toast.error(e?.message || "Could not add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-card rounded-t-[28px] p-5 max-h-[80vh] flex flex-col">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-bold">Comments</h2>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-6"><Loader2 className="inline w-4 h-4 animate-spin mr-2" />Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No comments yet. Be the first to comment.</p>
          ) : comments.map((c) => (
            <div key={c.id} className="bg-muted/40 rounded-2xl p-3">
              <p className="text-sm font-body text-foreground whitespace-pre-wrap">{c.comment}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 h-11 px-4 rounded-full bg-muted border border-border text-sm font-body focus:outline-none focus:border-primary"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
          <button
            onClick={submit}
            disabled={submitting || !text.trim()}
            className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            aria-label="Send"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NearbyCommentsSheet;
