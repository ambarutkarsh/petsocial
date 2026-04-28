import HubSubLayout from "@/components/HubSubLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

type ConsultType = "in_clinic" | "home" | "tele";

const SPECS = [
  "All Specialisations",
  "General Practice",
  "Dermatology",
  "Surgery",
  "Dentistry",
  "Cardiology",
  "Ophthalmology",
  "Exotics",
];

const BookAVetScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [type, setType] = useState<ConsultType>("in_clinic");
  const [emergency, setEmergency] = useState(false);
  const [spec, setSpec] = useState("All Specialisations");
  const [sortBy, setSortBy] = useState<"rating" | "availability">("rating");

  useEffect(() => {
    if (!user) triggerGuestPopup();
  }, [user, triggerGuestPopup]);

  const { data: vets = [], isLoading } = useQuery({
    queryKey: ["vets-chennai", spec, sortBy],
    queryFn: async () => {
      let q = supabase
        .from("vets")
        .select("*")
        .eq("is_active", true)
        .eq("is_verified", true)
        .eq("city", "Chennai");
      if (spec !== "All Specialisations") q = q.contains("specialisations", [spec]);
      const { data } = await q.order("avg_rating", { ascending: false });
      return data ?? [];
    },
  });

  if (!user) {
    return (
      <HubSubLayout title="Book a Vet" emoji="🩺" subtitle="Login required">
        <p className="text-sm text-muted-foreground font-body">Please sign in to book a vet appointment.</p>
      </HubSubLayout>
    );
  }

  const onTypeClick = (t: ConsultType) => {
    if (t === "home") {
      toast("Home visit bookings launching soon!");
      return;
    }
    if (t === "tele") {
      toast("Video consultations launching soon!");
      navigate("/hub/book-a-vet/coming-soon?type=tele");
      return;
    }
    setType(t);
  };

  return (
    <HubSubLayout title="Book a Vet" emoji="🩺" subtitle="Chennai · Verified vets only">
      {/* Consultation type selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { k: "in_clinic", label: "🏥 In-Clinic", soon: false },
          { k: "home", label: "🏠 Home Visit", soon: true },
          { k: "tele", label: "📹 Teleconsult", soon: true },
        ].map((p) => (
          <button
            key={p.k}
            onClick={() => onTypeClick(p.k as ConsultType)}
            className={`relative whitespace-nowrap px-4 py-2 rounded-full border text-xs font-body font-semibold transition ${
              type === p.k
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground"
            } ${p.soon ? "opacity-60" : ""}`}
          >
            {p.label}
            {p.soon && (
              <span className="ml-1.5 text-[9px] uppercase bg-muted px-1.5 py-0.5 rounded-full">Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Emergency toggle */}
      <div className="mt-3 flex items-center justify-between paw-card p-3">
        <div>
          <p className="font-heading font-bold text-sm flex items-center gap-1.5">⚡ Emergency / Same-day</p>
          <p className="text-[11px] text-muted-foreground font-body">Filter to emergency slots only</p>
        </div>
        <Switch checked={emergency} onCheckedChange={setEmergency} />
      </div>
      {emergency && (
        <div className="mt-2 p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-xs font-body text-amber-900">
          Emergency slots available for same-day urgent care. Higher consultation priority.
        </div>
      )}

      {/* Filters */}
      <div className="mt-3 flex gap-2">
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="flex-1 px-3 py-2 rounded-full border border-border bg-card text-xs font-body"
        >
          {SPECS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-full border border-border bg-card text-xs font-body"
        >
          <option value="rating">Sort: Rating</option>
          <option value="availability">Sort: Availability</option>
        </select>
      </div>

      {/* Vet list */}
      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-xs text-muted-foreground font-body">Loading vets…</p>}
        {!isLoading && vets.length === 0 && (
          <div className="paw-card p-5 text-center">
            <p className="text-3xl mb-2">🐾</p>
            <p className="font-heading font-bold text-sm">No verified vets in your city yet</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Coming soon to your city. We're onboarding vets in Chennai first.</p>
          </div>
        )}
        {vets.map((v: any) => {
          const initials = v.full_name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          return (
            <button
              key={v.id}
              onClick={() => navigate(`/hub/book-a-vet/${v.id}`)}
              className="w-full text-left paw-card p-4 hover:shadow-petosauras-md transition"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center font-heading font-extrabold text-primary overflow-hidden shrink-0">
                  {v.profile_photo_url ? (
                    <img src={v.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm flex items-center gap-1.5">
                    Dr. {v.full_name}
                    {v.is_verified && <VerifiedIcon className="w-4 h-4 text-blue-600" />}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {Number(v.avg_rating ?? 0).toFixed(1)} ({v.total_reviews ?? 0})
                  </p>
                  {v.clinic_name && <p className="text-xs font-body mt-1">{v.clinic_name}</p>}
                  {v.clinic_address && (
                    <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1">
                      <LocationPinIcon className="w-3 h-3" />
                      {v.clinic_address}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-body mt-1">
                    {v.specialisations?.[0] ?? "General Practice"} · {v.years_experience ?? 0} yrs exp
                  </p>
                  {v.specialisations && v.specialisations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.specialisations.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-body">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs font-heading font-bold text-primary">View Profile & Book →</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </HubSubLayout>
  );
};

export default BookAVetScreen;
