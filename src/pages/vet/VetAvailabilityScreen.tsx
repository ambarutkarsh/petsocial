import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayState {
  active: boolean;
  start: string;
  end: string;
  duration: number;
}

const VetAvailabilityInner = () => {
  const { user } = useAuth();
  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vets").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const [schedule, setSchedule] = useState<DayState[]>(
    DAYS.map(() => ({ active: false, start: "09:00", end: "17:00", duration: 30 })),
  );
  const [emergencyOn, setEmergencyOn] = useState(false);
  const [emergencyFee, setEmergencyFee] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vet) return;
    setEmergencyFee(vet.emergency_fee_inperson ?? 0);
    (async () => {
      const { data } = await supabase.from("vet_availability").select("*").eq("vet_id", vet.id);
      if (data && data.length > 0) {
        setSchedule((prev) =>
          prev.map((d, i) => {
            const found = data.find((a: any) => a.day_of_week === i && a.is_active);
            if (!found) return { ...d, active: false };
            return {
              active: true,
              start: String(found.start_time).slice(0, 5),
              end: String(found.end_time).slice(0, 5),
              duration: found.slot_duration_minutes,
            };
          }),
        );
      }
    })();
  }, [vet]);

  const save = async () => {
    if (!vet) return;
    setSaving(true);
    try {
      // Replace all rows
      await supabase.from("vet_availability").delete().eq("vet_id", vet.id);
      const inserts = schedule
        .map((d, i) =>
          d.active
            ? {
                vet_id: vet.id,
                day_of_week: i,
                start_time: d.start + ":00",
                end_time: d.end + ":00",
                slot_duration_minutes: d.duration,
                consultation_type: "in_clinic",
                is_active: true,
              }
            : null,
        )
        .filter(Boolean);
      if (inserts.length > 0) {
        const { error } = await supabase.from("vet_availability").insert(inserts as any);
        if (error) throw error;
      }
      await supabase.from("vets").update({ emergency_fee_inperson: emergencyFee }).eq("id", vet.id);

      // Generate slots
      await supabase.functions.invoke("generate-vet-slots", { body: { vet_id: vet.id, days: 30 } });
      toast("Schedule saved & slots regenerated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <VetDashboardLayout title="Manage Your Schedule">
      <p className="font-heading font-bold text-sm mb-2">Weekly Schedule</p>
      <div className="space-y-2">
        {DAYS.map((label, i) => (
          <div key={label} className="paw-card p-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">{label}</span>
              <Switch
                checked={schedule[i].active}
                onCheckedChange={(v) => {
                  const c = [...schedule];
                  c[i] = { ...c[i], active: v };
                  setSchedule(c);
                }}
              />
            </div>
            {schedule[i].active && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  type="time"
                  value={schedule[i].start}
                  onChange={(e) => { const c = [...schedule]; c[i].start = e.target.value; setSchedule(c); }}
                  className="p-2 text-xs rounded border border-border font-body"
                />
                <input
                  type="time"
                  value={schedule[i].end}
                  onChange={(e) => { const c = [...schedule]; c[i].end = e.target.value; setSchedule(c); }}
                  className="p-2 text-xs rounded border border-border font-body"
                />
                <select
                  value={schedule[i].duration}
                  onChange={(e) => { const c = [...schedule]; c[i].duration = Number(e.target.value); setSchedule(c); }}
                  className="p-2 text-xs rounded border border-border font-body"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hr</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 paw-card p-3">
        <div className="flex items-center justify-between">
          <p className="font-heading font-bold text-sm">Accept emergency / same-day bookings</p>
          <Switch checked={emergencyOn} onCheckedChange={setEmergencyOn} />
        </div>
        {emergencyOn && (
          <div className="mt-2">
            <label className="text-xs font-body">Emergency fee (₹ per slot)</label>
            <input
              type="number"
              value={emergencyFee}
              onChange={(e) => setEmergencyFee(Number(e.target.value))}
              className="w-full p-2 text-xs rounded border border-border font-body mt-1"
            />
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Schedule"}
      </button>
    </VetDashboardLayout>
  );
};

const VetAvailabilityScreen = () => <VetGuard><VetAvailabilityInner /></VetGuard>;
export default VetAvailabilityScreen;
