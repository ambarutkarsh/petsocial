import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { trackBookVet } from "@/lib/analytics";

import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";

const VetRequestsInner = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cancelFor, setCancelFor] = useState<any>(null);
  const [rescheduleFor, setRescheduleFor] = useState<any>(null);
  const [reason, setReason] = useState("Doctor unavailable");
  const [newSlotId, setNewSlotId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_vet_profile");
      return Array.isArray(data) ? data[0] ?? null : null;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["vet-requests", vet?.id],
    enabled: !!vet,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("*, pets(name, species), profiles:public_profiles!vet_bookings_user_id_fkey(full_name), vet_slots(slot_date, start_time)")
        .eq("vet_id", vet!.id)
        .in("status", ["pending_vet_confirmation", "reschedule_requested"])
        .order("created_at", { ascending: false });
      return (data as any[]) ?? [];
    },
  });

  const { data: openSlots = [] } = useQuery({
    queryKey: ["vet-open-slots", vet?.id],
    enabled: !!vet && !!rescheduleFor,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("vet_slots")
        .select("id, slot_date, start_time, end_time")
        .eq("vet_id", vet!.id)
        .eq("status", "available")
        .gte("slot_date", today)
        .order("slot_date")
        .order("start_time")
        .limit(40);
      return data ?? [];
    },
  });

  const confirm = async (b: any) => {
    trackBookVet("vet_confirmed_from_dashboard", { booking_id: b.id });
    const nowIso = new Date().toISOString();
    const { error: e1 } = await supabase
      .from("vet_bookings")
      .update({
        status: "confirmed",
        confirmed_at: nowIso,
        vet_action_at: nowIso,
        vet_action_source: "dashboard",
      })
      .eq("id", b.id);
    if (e1) return toast.error(e1.message);
    await supabase.from("vet_slots").update({ status: "booked" }).eq("id", b.slot_id);
    await supabase.from("notifications").insert({
      user_id: b.user_id,
      type: "booking_confirmed",
      title: "Your vet appointment is confirmed",
      body: `Dr. ${vet?.full_name} confirmed your appointment for ${b.vet_slots?.slot_date} at ${String(b.vet_slots?.start_time ?? "").slice(0, 5)}.`,
    });
    toast("Confirmed");
    qc.invalidateQueries({ queryKey: ["vet-requests"] });
  };

  const doReject = async () => {
    if (!cancelFor) return;
    trackBookVet("vet_rejected_from_dashboard", { booking_id: cancelFor.id, reason });
    const nowIso = new Date().toISOString();
    await supabase.from("vet_bookings").update({
      status: "rejected",
      cancellation_reason: reason,
      cancelled_by: "vet",
      cancelled_at: nowIso,
      vet_action_at: nowIso,
      vet_action_source: "dashboard",
    }).eq("id", cancelFor.id);
    await supabase.from("vet_slots").update({ status: "available", locked_by: null, locked_at: null }).eq("id", cancelFor.slot_id);
    await supabase.from("notifications").insert({
      user_id: cancelFor.user_id,
      type: "booking_rejected",
      title: "Your vet appointment was rejected",
      body: `Dr. ${vet?.full_name} could not take your booking on ${cancelFor.vet_slots?.slot_date}. Reason: ${reason}. Please choose another slot.`,
    });
    setCancelFor(null);
    qc.invalidateQueries({ queryKey: ["vet-requests"] });
  };

  const doReschedule = async () => {
    if (!rescheduleFor || !newSlotId) return;
    trackBookVet("vet_reschedule_clicked", { booking_id: rescheduleFor.id, new_slot_id: newSlotId });
    await supabase.from("vet_bookings").update({ status: "reschedule_requested", vet_notes: `Suggested new slot: ${newSlotId}` }).eq("id", rescheduleFor.id);
    await supabase.from("notifications").insert({
      user_id: rescheduleFor.user_id,
      type: "booking_reschedule",
      title: "Your vet has suggested a new time",
      body: `Dr. ${vet?.full_name} would like to reschedule booking ${rescheduleFor.booking_reference}. Please review in My Bookings.`,
    });
    toast("Reschedule request sent to user");
    setRescheduleFor(null);
    setNewSlotId(null);
    qc.invalidateQueries({ queryKey: ["vet-requests"] });
  };

  return (
    <VetDashboardLayout title="Booking Requests">
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-xs font-body text-muted-foreground">No pending requests.</p>}
        {requests.map((b: any) => (
          <div key={b.id} className={`paw-card p-3 ${b.is_emergency ? "border-l-4 border-l-amber-400" : ""}`}>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900">
              {b.status === "reschedule_requested" ? "🔁 Reschedule pending" : "⏳ Pending Confirmation"}
            </span>
            <p className="mt-1 font-heading font-bold text-sm">🐾 {b.pets?.name} ({b.pets?.species ?? "—"})</p>
            <p className="text-[11px] font-body">Owner: {b.profiles?.full_name ?? "—"}</p>
            <p className="text-[11px] font-body">{b.vet_slots?.slot_date} at {String(b.vet_slots?.start_time ?? "").slice(0, 5)}</p>
            <p className="text-[11px] font-body">Ref: {b.booking_reference}</p>
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
              <button onClick={() => confirm(b)} className="px-3 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-heading font-bold">✅ Accept</button>
              <button onClick={() => setRescheduleFor(b)} className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-[11px] font-heading font-bold">🔁 Reschedule</button>
              <button onClick={() => setCancelFor(b)} className="px-3 py-1.5 rounded-full border border-red-300 text-red-700 text-[11px] font-heading font-bold">❌ Reject</button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!cancelFor} onOpenChange={(o) => !o && setCancelFor(null)}>
        <SheetContent side="bottom" className="rounded-t-[22px]">
          <SheetHeader><SheetTitle>Reject reason</SheetTitle></SheetHeader>
          <div className="mt-3 space-y-2">
            {["Doctor unavailable", "Emergency closure", "Outside specialisation", "Other"].map((r) => (
              <label key={r} className="flex items-center gap-2 text-xs font-body">
                <input type="radio" name="cancel" checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
            <button onClick={doReject} className="mt-3 w-full py-2.5 rounded-full bg-red-600 text-white font-heading font-bold text-sm">Confirm Reject</button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!rescheduleFor} onOpenChange={(o) => !o && (setRescheduleFor(null), setNewSlotId(null))}>
        <SheetContent side="bottom" className="rounded-t-[22px] max-h-[80vh] overflow-y-auto">
          <SheetHeader><SheetTitle>Suggest a new slot</SheetTitle></SheetHeader>
          <div className="mt-3 space-y-2">
            {openSlots.length === 0 && <p className="text-xs font-body text-muted-foreground">No open slots — generate slots first in Availability.</p>}
            <div className="grid grid-cols-2 gap-2">
              {openSlots.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setNewSlotId(s.id)}
                  className={`px-3 py-2 rounded-[12px] border text-[11px] font-body ${
                    newSlotId === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                  }`}
                >
                  {s.slot_date}<br />{String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                </button>
              ))}
            </div>
            <button
              disabled={!newSlotId}
              onClick={doReschedule}
              className="mt-3 w-full py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50"
            >
              Send reschedule request
            </button>
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
