import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HubSubLayout from "@/components/HubSubLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";

const statusBadge = (s: string) => {
  if (s === "pending_vet_confirmation") return { label: "⏳ Awaiting confirmation", cls: "bg-amber-50 text-amber-900 border-amber-200" };
  if (s === "confirmed") return { label: "✅ Confirmed", cls: "bg-green-50 text-green-900 border-green-200" };
  if (s.startsWith("cancelled")) return { label: "❌ Cancelled", cls: "bg-red-50 text-red-900 border-red-200" };
  if (s === "completed") return { label: "✔ Completed", cls: "bg-blue-50 text-blue-900 border-blue-200" };
  return { label: s, cls: "bg-muted text-muted-foreground border-border" };
};

const MyBookingsScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [reviewFor, setReviewFor] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [anon, setAnon] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("*, vets(full_name, clinic_name, clinic_address), pets(name), vet_slots(slot_date, start_time)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as any[]) ?? [];
    },
  });

  const upcoming = bookings.filter((b) => ["pending_vet_confirmation", "confirmed"].includes(b.status));
  const past = bookings.filter((b) => !["pending_vet_confirmation", "confirmed"].includes(b.status));
  const list = tab === "upcoming" ? upcoming : past;

  const submitReview = async () => {
    if (!user || !reviewFor) return;
    const { error } = await supabase.from("vet_reviews").insert({
      booking_id: reviewFor.id,
      vet_id: reviewFor.vet_id,
      reviewer_id: user.id,
      rating,
      review_text: reviewText || null,
      is_anonymous: anon,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast("Thanks for your review!");
    setReviewFor(null);
    setReviewText("");
    setRating(5);
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
  };

  return (
    <HubSubLayout title="My Bookings" emoji="📅">
      <div className="flex border-b border-border">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-heading font-bold capitalize ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {t === "upcoming" ? "📅 Upcoming" : "✅ Past"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground font-body text-center py-6">No {tab} bookings.</p>
        )}
        {list.map((b: any) => {
          const sb = statusBadge(b.status);
          return (
            <div key={b.id} className="paw-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm">Dr. {b.vets?.full_name}</p>
                  <p className="text-[11px] font-body text-muted-foreground">{b.vets?.clinic_name}</p>
                  <p className="text-xs font-body mt-1">
                    {b.vet_slots?.slot_date} at {String(b.vet_slots?.start_time ?? "").slice(0, 5)}
                  </p>
                  <p className="text-[11px] font-body">🐾 {b.pets?.name}</p>
                  <p className="text-[10px] font-body text-muted-foreground">Ref: {b.booking_reference}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap ${sb.cls}`}>{sb.label}</span>
              </div>
              {tab === "upcoming" && b.status === "confirmed" && (
                <div className="mt-2 flex gap-2">
                  {b.vets?.clinic_address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(b.vets.clinic_address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-heading font-bold text-primary"
                    >
                      Get Directions
                    </a>
                  )}
                </div>
              )}
              {tab === "past" && b.status === "completed" && (
                <button
                  onClick={() => setReviewFor(b)}
                  className="mt-2 text-[11px] font-heading font-bold text-primary"
                >
                  Rate this vet →
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={!!reviewFor} onOpenChange={(o) => !o && setReviewFor(null)}>
        <SheetContent side="bottom" className="rounded-t-[22px]">
          <SheetHeader>
            <SheetTitle>How was your experience with Dr. {reviewFor?.vets?.full_name}?</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className="text-3xl">
                  {n <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience to help other pet parents"
              className="w-full p-2.5 text-xs rounded-[12px] border border-border bg-card font-body"
              rows={4}
            />
            <label className="flex items-center gap-2 text-xs font-body">
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
              Post anonymously
            </label>
            <button
              onClick={submitReview}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm"
            >
              Submit Review
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </HubSubLayout>
  );
};

export default MyBookingsScreen;
