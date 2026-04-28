import { useEffect, useState } from "react";
import { BackIcon } from "@/components/icons/PetosauraIcons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PageWrapper from "@/components/PageWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

const SYMPTOMS = [
  "Vomiting", "Diarrhoea", "Skin/Itching", "Fever", "Not Eating",
  "Injury", "Coughing", "Routine Checkup", "Vaccination", "Other",
];

const ConfirmBookingScreen = () => {
  const { vetId } = useParams<{ vetId: string }>();
  const [params] = useSearchParams();
  const slotId = params.get("slot");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [petId, setPetId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [shareRecords, setShareRecords] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [confirming, setConfirming] = useState(false);

  const { data: vet } = useQuery({
    queryKey: ["vet", vetId],
    enabled: !!vetId,
    queryFn: async () => (await supabase.from("vets").select("*").eq("id", vetId!).single()).data,
  });
  const { data: slot } = useQuery({
    queryKey: ["slot", slotId],
    enabled: !!slotId,
    queryFn: async () => (await supabase.from("vet_slots").select("*").eq("id", slotId!).single()).data,
  });
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("pets").select("*").eq("owner_id", user!.id)).data ?? [],
  });

  useEffect(() => {
    if (pets.length > 0 && !petId) setPetId(pets[0].id);
  }, [pets, petId]);

  // Lock the slot
  useEffect(() => {
    if (!slotId || !user) return;
    (async () => {
      await supabase
        .from("vet_slots")
        .update({ status: "locked", locked_by: user.id, locked_at: new Date().toISOString() })
        .eq("id", slotId)
        .eq("status", "available");
    })();
  }, [slotId, user]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (secondsLeft <= 0 && slotId) {
      supabase
        .from("vet_slots")
        .update({ status: "available", locked_by: null, locked_at: null })
        .eq("id", slotId)
        .then(() => {
          toast("Your slot has been released. Please select again.");
          navigate(`/hub/book-a-vet/${vetId}`);
        });
    }
  }, [secondsLeft, slotId, vetId, navigate]);

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleConfirm = async () => {
    if (!user || !slotId || !vetId || !petId) {
      toast.error("Missing pet or slot");
      return;
    }
    setConfirming(true);
    try {
      // Verify slot still locked by this user
      const { data: chk } = await supabase
        .from("vet_slots")
        .select("locked_by, status")
        .eq("id", slotId)
        .single();
      if (chk?.status !== "locked" || chk.locked_by !== user.id) {
        toast.error("Slot no longer available");
        navigate(`/hub/book-a-vet/${vetId}`);
        return;
      }

      const { data: booking, error } = await supabase
        .from("vet_bookings")
        .insert({
          slot_id: slotId,
          vet_id: vetId,
          user_id: user.id,
          pet_id: petId,
          consultation_type: "in_clinic",
          is_emergency: !!slot?.is_emergency,
          status: "pending_vet_confirmation",
          reason_for_visit: symptoms.join(", "),
          symptoms,
          share_health_records: shareRecords,
          user_notes: notes,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("vet_slots")
        .update({ status: "booked" })
        .eq("id", slotId);

      // Fire notify-vet-booking (don't block UI on failures)
      supabase.functions.invoke("notify-vet-booking", { body: { booking_id: booking.id } }).catch(() => {});

      navigate(`/hub/book-a-vet/success?ref=${booking.booking_reference}`);
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally {
      setConfirming(false);
    }
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/hub/book-a-vet/${vetId}`)}
            aria-label="Back"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center"
          >
            <BackIcon className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <h1 className="font-heading font-bold text-[18px] flex-1">Confirm Booking</h1>
          <span className="text-xs font-body bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-full">
            Slot held: {mm}:{ss}
          </span>
        </header>

        {/* Summary */}
        <div className="mt-4 paw-card p-3 space-y-1 text-xs font-body">
          <p>🩺 Dr. {vet?.full_name}</p>
          <p>📅 {slot?.slot_date} · ⏰ {String(slot?.start_time ?? "").slice(0, 5)}</p>
          <p>🏥 {vet?.clinic_name ?? ""}{vet?.clinic_address ? `, ${vet.clinic_address}` : ""}</p>
          <p>💰 Free booking (pay clinic directly)</p>
        </div>

        {/* Pet selector */}
        <div className="mt-4">
          <p className="font-heading font-bold text-sm mb-2">Which pet?</p>
          {pets.length === 0 ? (
            <button onClick={() => navigate("/mypet")} className="paw-card p-3 text-xs font-body w-full text-left">
              Add a pet in MyPet first →
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {pets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setPetId(p.id)}
                  className={`px-3 py-2 rounded-full border text-xs font-body ${
                    petId === p.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                  }`}
                >
                  {p.avatar_emoji ?? "🐾"} {p.name} {p.species ? `— ${p.species}` : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Symptoms */}
        <div className="mt-4">
          <p className="font-heading font-bold text-sm mb-2">Why are you visiting the vet?</p>
          <div className="flex gap-1.5 flex-wrap">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-full border text-[11px] font-body ${
                  symptoms.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="Any other details for the vet..."
            className="mt-2 w-full p-2.5 text-xs rounded-[12px] border border-border bg-card font-body"
            rows={3}
          />
        </div>

        {/* Share records */}
        <div className="mt-4 paw-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-heading font-bold text-sm">📋 Share pet's health records with vet</p>
              <p className="text-[11px] font-body text-muted-foreground mt-1">
                The vet will receive vaccination records, recent weight logs, past vet visit notes, and known allergies.
              </p>
              <p className="text-[10px] font-body text-muted-foreground mt-1">Shared with this vet for this appointment only.</p>
            </div>
            <Switch checked={shareRecords} onCheckedChange={setShareRecords} />
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={confirming || !petId}
          className="mt-5 w-full py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50"
        >
          {confirming ? "Confirming…" : "Confirm Booking"}
        </button>
        <div className="h-20" />
      </PageWrapper>
      <BottomNav />
    </MobileLayout>
  );
};

export default ConfirmBookingScreen;
