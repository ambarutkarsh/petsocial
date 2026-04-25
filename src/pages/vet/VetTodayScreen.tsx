import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";

const VetTodayInner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rxFor, setRxFor] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [meds, setMeds] = useState<{ name: string; dose: string; freq: string; dur: string }[]>([]);
  const [instructions, setInstructions] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followDate, setFollowDate] = useState("");
  const [followNotes, setFollowNotes] = useState("");
  const [rxFile, setRxFile] = useState<File | null>(null);

  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vets").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: appts = [] } = useQuery({
    queryKey: ["vet-today", vet?.id, today],
    enabled: !!vet,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("*, pets(name, species), public_profiles!vet_bookings_user_id_fkey(full_name), vet_slots!inner(slot_date, start_time, end_time)")
        .eq("vet_id", vet!.id)
        .eq("vet_slots.slot_date", today)
        .order("vet_slots(start_time)" as any, { ascending: true });
      return (data as any[]) ?? [];
    },
  });

  const stats = {
    todayCount: appts.length,
    pending: appts.filter((a) => a.status === "pending_vet_confirmation").length,
  };

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("vet_bookings").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["vet-today"] });
  };

  const markComplete = async (b: any) => {
    await update(b.id, { status: "completed", completed_at: new Date().toISOString() });
    await supabase.from("notifications").insert({
      user_id: b.user_id,
      type: "booking",
      title: "Appointment complete",
      body: `Your appointment with Dr. ${vet?.full_name} is complete. Please rate your experience.`,
    });
  };

  const addMed = () => setMeds([...meds, { name: "", dose: "", freq: "", dur: "" }]);

  const savePrescription = async () => {
    if (!rxFor || !user || !vet) return;
    let docUrl: string | null = null;
    if (rxFile) {
      const path = `${vet.id}/${rxFor.id}-${Date.now()}-${rxFile.name}`;
      const { error: upErr } = await supabase.storage.from("prescriptions").upload(path, rxFile, { upsert: false });
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      const { data: signed } = await supabase.storage.from("prescriptions").createSignedUrl(path, 60 * 60 * 24 * 365);
      docUrl = signed?.signedUrl ?? null;
    }
    const { error } = await supabase.from("vet_prescriptions").insert({
      booking_id: rxFor.id,
      vet_id: vet.id,
      pet_id: rxFor.pet_id,
      owner_id: rxFor.user_id,
      diagnosis,
      medications: meds,
      instructions,
      follow_up_date: followUp ? followDate : null,
      follow_up_notes: followUp ? followNotes : null,
      document_url: docUrl,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (docUrl) {
      await supabase.from("pet_records").insert({
        pet_id: rxFor.pet_id,
        owner_id: rxFor.user_id,
        record_type: "prescription",
        file_url: docUrl,
        document_date: today,
        notes: `Prescription from Dr. ${vet.full_name} - ${diagnosis}`,
      });
    }
    await supabase.from("notifications").insert({
      user_id: rxFor.user_id,
      type: "prescription",
      title: "Prescription added to DigiLocker",
      body: `Dr. ${vet.full_name} has added ${rxFor.pets?.name ?? "your pet"}'s prescription.`,
    });
    if (followUp && followDate) {
      await supabase.from("notifications").insert({
        user_id: rxFor.user_id,
        type: "followup",
        title: "Follow-up appointment reminder",
        body: `Dr. ${vet.full_name} recommends a follow-up visit on ${followDate}. ${followNotes ?? ""}`,
      });
    }
    toast("Prescription saved");
    setRxFor(null);
    setDiagnosis("");
    setMeds([]);
    setInstructions("");
    setFollowUp(false);
    setRxFile(null);
  };

  return (
    <VetDashboardLayout title={`Good day, Dr. ${vet?.full_name?.split(" ")[0] ?? ""} 🐾`}>
      <div className="grid grid-cols-2 gap-2">
        <div className="paw-card p-3">
          <p className="text-[10px] font-body text-muted-foreground uppercase">Today</p>
          <p className="font-heading font-bold text-2xl">{stats.todayCount}</p>
        </div>
        <div className="paw-card p-3">
          <p className="text-[10px] font-body text-muted-foreground uppercase">Pending</p>
          <p className="font-heading font-bold text-2xl">{stats.pending}</p>
        </div>
      </div>

      <p className="font-heading font-bold text-sm mt-4 mb-2">Today's Schedule</p>
      <div className="space-y-2">
        {appts.length === 0 && <p className="text-xs font-body text-muted-foreground">No appointments today.</p>}
        {appts.map((b: any) => (
          <div key={b.id} className={`paw-card p-3 ${b.is_emergency ? "border-l-4 border-l-amber-400" : ""}`}>
            <p className="text-xs font-body text-muted-foreground">
              {String(b.vet_slots?.start_time ?? "").slice(0, 5)} · {b.consultation_type}
            </p>
            <p className="font-heading font-bold text-sm">🐾 {b.pets?.name} ({b.pets?.species ?? "—"})</p>
            <p className="text-[11px] font-body">Owner: {b.profiles?.full_name ?? "—"}</p>
            <p className="text-[11px] font-body">Reason: {b.reason_for_visit ?? "—"}</p>
            <p className="text-[10px] font-body text-muted-foreground">Ref: {b.booking_reference}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {b.status === "pending_vet_confirmation" && (
                <>
                  <button
                    onClick={() => update(b.id, { status: "confirmed", confirmed_at: new Date().toISOString() })}
                    className="px-3 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-heading font-bold"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => update(b.id, { status: "cancelled_by_vet", cancelled_at: new Date().toISOString(), cancelled_by: "vet", cancellation_reason: "Doctor unavailable" })}
                    className="px-3 py-1.5 rounded-full border border-red-300 text-red-700 text-[11px] font-heading font-bold"
                  >
                    Cancel
                  </button>
                </>
              )}
              {b.status === "confirmed" && (
                <>
                  <button
                    onClick={() => markComplete(b)}
                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-heading font-bold"
                  >
                    Mark Complete
                  </button>
                </>
              )}
              {b.status === "completed" && (
                <button
                  onClick={() => setRxFor(b)}
                  className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-heading font-bold"
                >
                  Add Prescription
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!rxFor} onOpenChange={(o) => !o && setRxFor(null)}>
        <SheetContent side="bottom" className="rounded-t-[22px] max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Prescription for {rxFor?.pets?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-3">
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnosis"
              className="w-full p-2.5 text-xs rounded-[12px] border border-border font-body"
              rows={2}
            />
            <div>
              <p className="text-xs font-heading font-bold mb-1">Medications</p>
              {meds.map((m, i) => (
                <div key={i} className="grid grid-cols-2 gap-1 mb-1">
                  <input value={m.name} onChange={(e) => { const c = [...meds]; c[i].name = e.target.value; setMeds(c); }} placeholder="Name" className="p-2 text-xs rounded border border-border font-body" />
                  <input value={m.dose} onChange={(e) => { const c = [...meds]; c[i].dose = e.target.value; setMeds(c); }} placeholder="Dosage" className="p-2 text-xs rounded border border-border font-body" />
                  <input value={m.freq} onChange={(e) => { const c = [...meds]; c[i].freq = e.target.value; setMeds(c); }} placeholder="Frequency" className="p-2 text-xs rounded border border-border font-body" />
                  <input value={m.dur} onChange={(e) => { const c = [...meds]; c[i].dur = e.target.value; setMeds(c); }} placeholder="Duration" className="p-2 text-xs rounded border border-border font-body" />
                </div>
              ))}
              <button onClick={addMed} className="text-[11px] font-heading font-bold text-primary">+ Add Medication</button>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions"
              className="w-full p-2.5 text-xs rounded-[12px] border border-border font-body"
              rows={2}
            />
            <label className="flex items-center gap-2 text-xs font-body">
              <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />
              Recommend follow-up
            </label>
            {followUp && (
              <>
                <input type="date" value={followDate} onChange={(e) => setFollowDate(e.target.value)} className="w-full p-2 text-xs rounded border border-border font-body" />
                <textarea value={followNotes} onChange={(e) => setFollowNotes(e.target.value)} placeholder="Follow-up notes" rows={2} className="w-full p-2.5 text-xs rounded border border-border font-body" />
              </>
            )}
            <input type="file" accept=".pdf,image/*" onChange={(e) => setRxFile(e.target.files?.[0] ?? null)} className="text-xs font-body" />
            <button onClick={savePrescription} className="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm">
              Save Prescription
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </VetDashboardLayout>
  );
};

const VetTodayScreen = () => (
  <VetGuard>
    <VetTodayInner />
  </VetGuard>
);

export default VetTodayScreen;
