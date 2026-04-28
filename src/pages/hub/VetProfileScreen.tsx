import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PageWrapper from "@/components/PageWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "lucide-react";
import { BackIcon, StarIcon, VerifiedIcon } from "@/components/icons/PetosauraIcons";

const VetProfileScreen = () => {
  const { vetId } = useParams<{ vetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"about" | "reviews">("about");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);

  const { data: vet } = useQuery({
    queryKey: ["vet", vetId],
    enabled: !!vetId,
    queryFn: async () => {
      const { data } = await supabase.from("vets").select("*").eq("id", vetId!).single();
      return data;
    },
  });

  const { data: slots = [], refetch: refetchSlots } = useQuery({
    queryKey: ["vet-slots", vetId, selectedDate, emergency],
    enabled: !!vetId,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_slots")
        .select("*")
        .eq("vet_id", vetId!)
        .eq("slot_date", selectedDate)
        .eq("consultation_type", "in_clinic")
        .eq("is_emergency", emergency)
        .order("start_time");
      return data ?? [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["vet-reviews", vetId],
    enabled: !!vetId && tab === "reviews",
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_reviews")
        .select("*")
        .eq("vet_id", vetId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Real-time slot updates
  useEffect(() => {
    if (!vetId) return;
    const channel = supabase
      .channel(`slots-${vetId}-${selectedDate}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vet_slots", filter: `vet_id=eq.${vetId}` },
        () => refetchSlots(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vetId, selectedDate, refetchSlots]);

  const week = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        day: d.getDate(),
      };
    });
  }, []);

  const initials = vet?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const proceed = async () => {
    if (!selectedSlotId || !user) return;
    navigate(`/hub/book-a-vet/${vetId}/confirm?slot=${selectedSlotId}`);
  };

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hub/book-a-vet")}
            aria-label="Back"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center"
          >
            <BackIcon className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <h1 className="font-heading font-bold text-[18px] flex-1 truncate">{vet?.clinic_name ?? "Vet Profile"}</h1>
        </header>

        {/* Header card */}
        <div className="mt-4 paw-card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
          <div className="px-4 pb-4 -mt-10">
            <div className="w-20 h-20 rounded-full bg-primary-light border-4 border-card flex items-center justify-center font-heading font-extrabold text-primary text-xl overflow-hidden">
              {vet?.profile_photo_url ? <img src={vet.profile_photo_url} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <p className="mt-2 font-heading font-bold flex items-center gap-1.5">
              Dr. {vet?.full_name}
              {vet?.is_verified && <VerifiedIcon className="w-4 h-4 text-blue-600" />}
            </p>
            {vet?.clinic_name && <p className="text-xs font-body">{vet.clinic_name}</p>}
            {vet?.clinic_address && <p className="text-[11px] text-muted-foreground font-body">{vet.clinic_address}</p>}
            <p className="text-xs font-body mt-1 flex items-center gap-1">
              <StarIcon className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(vet?.avg_rating ?? 0).toFixed(1)} · {vet?.total_reviews ?? 0} reviews
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-border">
          {(["about", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-heading font-bold capitalize ${
                tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "about" ? (
          <div className="mt-4 space-y-3">
            {vet?.bio && <p className="text-xs font-body">{vet.bio}</p>}
            {vet?.specialisations && (
              <div className="flex flex-wrap gap-1.5">
                {vet.specialisations.map((s: string) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-body">{s}</span>
                ))}
              </div>
            )}
            <p className="text-xs font-body">{vet?.years_experience ?? 0} years of experience</p>
            <div className="paw-card p-3 bg-primary-light/50">
              <p className="text-xs font-heading font-bold">Consultation booking is free</p>
              <p className="text-[11px] font-body text-muted-foreground">Pay the vet directly at the clinic.</p>
            </div>
            {vet?.is_verified && (
              <div className="paw-card p-3 border border-blue-200 bg-blue-50">
                <p className="text-xs font-heading font-bold text-blue-900">✅ VCI Verified Veterinarian</p>
                {vet.vc_india_registration && (
                  <p className="text-[11px] font-body text-blue-800">Registration: {vet.vc_india_registration}</p>
                )}
                <p className="text-[10px] font-body text-blue-700">Verified by Petosauras team</p>
              </div>
            )}

            {/* Slot selection */}
            <div>
              <p className="font-heading font-bold text-sm mb-2">Select a Date & Time</p>
              <label className="flex items-center gap-2 text-[11px] font-body mb-2">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
                Show emergency slots only
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {week.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setSelectedSlotId(null);
                    }}
                    className={`flex flex-col items-center px-3 py-2 rounded-[12px] border min-w-[52px] ${
                      selectedDate === d.date ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                    }`}
                  >
                    <span className="text-[10px] font-body">{d.label}</span>
                    <span className="text-base font-heading font-bold">{d.day}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {slots.length === 0 && (
                  <p className="col-span-2 text-xs text-muted-foreground font-body py-4 text-center">
                    No available slots on this date. Try another date or check back later.
                  </p>
                )}
                {slots.map((s: any) => {
                  const disabled = s.status !== "available";
                  return (
                    <button
                      key={s.id}
                      disabled={disabled}
                      onClick={() => setSelectedSlotId(s.id)}
                      className={`px-3 py-2 rounded-full border text-xs font-body ${
                        s.is_emergency ? "border-amber-400" : ""
                      } ${
                        selectedSlotId === s.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : disabled
                            ? "bg-muted line-through text-muted-foreground"
                            : "bg-card border-border"
                      }`}
                    >
                      {s.is_emergency ? "⚡ " : ""}
                      {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="paw-card p-3">
              <p className="font-heading font-bold text-sm">⭐ {Number(vet?.avg_rating ?? 0).toFixed(1)} out of 5</p>
              <p className="text-[11px] font-body text-muted-foreground">Based on {vet?.total_reviews ?? 0} reviews</p>
            </div>
            {reviews.length === 0 && (
              <p className="text-xs text-muted-foreground font-body text-center py-4">No reviews yet.</p>
            )}
            {reviews.map((r: any) => (
              <div key={r.id} className="paw-card p-3">
                <p className="text-amber-400 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                {r.review_text && <p className="text-xs font-body mt-1">{r.review_text}</p>}
                <p className="text-[10px] font-body text-muted-foreground mt-1">
                  {r.is_anonymous ? "A Petosauras user" : "Pet parent"} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="h-20" />
      </PageWrapper>

      {tab === "about" && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-2 z-30">
          <button
            disabled={!selectedSlotId}
            onClick={proceed}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50 shadow-petosauras-md"
          >
            {selectedSlotId
              ? `Proceed to Book · ${slots.find((s: any) => s.id === selectedSlotId)?.start_time?.slice(0, 5)}`
              : "Select a slot to continue"}
          </button>
        </div>
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default VetProfileScreen;
