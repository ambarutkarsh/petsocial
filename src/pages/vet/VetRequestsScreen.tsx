import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";

const VetRequestsInner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cancelFor, setCancelFor] = useState<any>(null);
  const [reason, setReason] = useState("Doctor unavailable");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vets").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["vet-requests", vet?.id],
    enabled: !!vet,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("*, pets(name, species), profiles:public_profiles!vet_bookings_user_id_fkey(full_name), vet_slots(slot_date, start_time)")
        .eq("vet_id", vet!.id)
        .eq("status", "pending_vet_confirmation")
        .order("created_at", { ascending: false });
      return (data as any[]) ?? [];
    },
  });

  const confirm = async (b: any) => {
    await supabase.from("vet_bookings").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", b.id);
    await supabase.from("notifications").insert({
      user_id: b.user_id,
      type: "booking_confirmed",
      title: "Appointment confirmed! 🐾",
      body: `Dr. ${vet?.full_name} confirmed your appointment for ${b.vet_slots?.slot_date} at ${String(b.vet_slots?.start_time ?? "").slice(0,5)}`,
    });
    toast("Confirmed");
    qc.invalidateQueries({ queryKey: ["vet-requests"] });
  };

  const doCancel = async () => {
    if (!cancelFor) return;
    await supabase.from("vet_bookings").update({
      status: "cancelled_by_vet",
      cancellation_reason: reason,
      cancelled_by: "vet",
      cancelled_at: new Date().toISOString(),
    }).eq("id", cancelFor.id);
    await supabase.from("vet_slots").update({ status: "available", locked_by: null, locked_at: null }).eq("id", cancelFor.slot_id);
    await supabase.from("notifications").insert({
      user_id: cancelFor.user_id,
      type: "booking_cancelled",
      title: "Appointment cancelled",
      body: `Your appointment with Dr. ${vet?.full_name} on ${cancelFor.vet_slots?.slot_date} has been cancelled. Reason: ${reason}.`,
    });
    setCancelFor(null);
    qc.invalidateQueries({ queryKey: ["vet-requests"] });
  };

  return (
    <VetDashboardLayout title="Booking Requests">
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-xs font-body text-muted-foreground">No pending requests.</p>}
        {requests.map((b: any) => (
          <div key={b.id} className={`paw-card p-3 ${b.is_emergency ? "border-l-4 border-l-amber-400" : ""}`}>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900">⏳ Pending Confirmation</span>
            <p className="mt-1 font-heading font-bold text-sm">🐾 {b.pets?.name} ({b.pets?.species ?? "—"})</p>
            <p className="text-[11px] font-body">Owner: {b.profiles?.full_name ?? "—"}</p>
            <p className="text-[11px] font-body">{b.vet_slots?.slot_date} at {String(b.vet_slots?.start_time ?? "").slice(0,5)}</p>
            <p className="text-[11px] font-body">Reason: {b.reason_for_visit ?? "—"}</p>
            {b.symptoms?.length > 0 && <p className="text-[11px] font-body">Symptoms: {b.symptoms.join(", ")}</p>}
            {b.is_emergency && <p className="text-[11px] font-heading font-bold text-amber-700 mt-1">⚡ EMERGENCY — Priority appointment</p>}
            {b.share_health_records && (
              <button
                onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                className="mt-2 text-[11px] font-heading font-bold text-primary"
              >
                📋 Pet health records shared {expanded === b.id ? "▲" : "▼"}
              </button>
            )}
            {expanded === b.id && b.share_health_records && <SharedRecords petId={b.pet_id} />}
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => confirm(b)} className="px-3 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-heading font-bold">✅ Confirm</button>
              <button onClick={() => setCancelFor(b)} className="px-3 py-1.5 rounded-full border border-red-300 text-red-700 text-[11px] font-heading font-bold">❌ Cancel</button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!cancelFor} onOpenChange={(o) => !o && setCancelFor(null)}>
        <SheetContent side="bottom" className="rounded-t-[22px]">
          <SheetHeader><SheetTitle>Cancel reason</SheetTitle></SheetHeader>
          <div className="mt-3 space-y-2">
            {["Doctor unavailable", "Emergency closure", "Patient request", "Other"].map((r) => (
              <label key={r} className="flex items-center gap-2 text-xs font-body">
                <input type="radio" name="cancel" checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
            <button onClick={doCancel} className="mt-3 w-full py-2.5 rounded-full bg-red-600 text-white font-heading font-bold text-sm">Confirm Cancel</button>
          </div>
        </SheetContent>
      </Sheet>
    </VetDashboardLayout>
  );
};

const SharedRecords = ({ petId }: { petId: string | null }) => {
  const { data } = useQuery({
    queryKey: ["shared-records", petId],
    enabled: !!petId,
    queryFn: async () => {
      const [{ data: weight }, { data: vacc }, { data: pet }] = await Promise.all([
        supabase.from("health_logs").select("weight_kg, log_date").eq("pet_id", petId!).order("log_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("vaccinations").select("vaccine_name, administered_date").eq("pet_id", petId!).order("administered_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("pets").select("notes").eq("id", petId!).maybeSingle(),
      ]);
      return { weight, vacc, pet };
    },
  });
  return (
    <div className="mt-2 p-2 rounded-[10px] bg-muted text-[11px] font-body space-y-0.5">
      <p>Last weight: {data?.weight?.weight_kg ? `${data.weight.weight_kg}kg on ${data.weight.log_date}` : "—"}</p>
      <p>Last vaccine: {data?.vacc?.vaccine_name ? `${data.vacc.vaccine_name} on ${data.vacc.administered_date}` : "—"}</p>
      <p>Notes: {data?.pet?.notes ?? "None"}</p>
    </div>
  );
};

const VetRequestsScreen = () => <VetGuard><VetRequestsInner /></VetGuard>;
export default VetRequestsScreen;
