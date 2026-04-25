import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VetCalendarInner = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vets").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { from, to, days } = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const dlist: Date[] = [];
    for (let d = 1; d <= last.getDate(); d++) dlist.push(new Date(month.getFullYear(), month.getMonth(), d));
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10), days: dlist };
  }, [month]);

  const { data: appts = [] } = useQuery({
    queryKey: ["vet-month", vet?.id, from, to],
    enabled: !!vet,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("status, is_emergency, vet_slots!inner(slot_date, start_time)")
        .eq("vet_id", vet!.id)
        .gte("vet_slots.slot_date", from)
        .lte("vet_slots.slot_date", to);
      return (data as any[]) ?? [];
    },
  });

  const byDay: Record<string, any[]> = {};
  appts.forEach((a) => {
    const d = a.vet_slots?.slot_date;
    if (!d) return;
    (byDay[d] ||= []).push(a);
  });

  const dayList = selected ? byDay[selected] ?? [] : [];

  return (
    <VetDashboardLayout title="Calendar">
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="text-sm font-heading font-bold">←</button>
        <p className="font-heading font-bold text-sm">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="text-sm font-heading font-bold">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const k = d.toISOString().slice(0, 10);
          const list = byDay[k] ?? [];
          const hasEmergency = list.some((a) => a.is_emergency);
          const hasPending = list.some((a) => a.status === "pending_vet_confirmation");
          const dotColor = hasEmergency ? "bg-red-500" : hasPending ? "bg-amber-500" : list.length ? "bg-green-500" : "";
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={`aspect-square rounded-[10px] border text-xs font-body flex flex-col items-center justify-center ${
                selected === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
              }`}
            >
              <span>{d.getDate()}</span>
              {dotColor && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4">
          <p className="font-heading font-bold text-sm mb-2">{selected}</p>
          {dayList.length === 0 && <p className="text-xs font-body text-muted-foreground">No appointments.</p>}
          {dayList.map((a, i) => (
            <div key={i} className="paw-card p-2 mb-2 text-xs font-body">
              {String(a.vet_slots?.start_time ?? "").slice(0, 5)} · {a.status}
            </div>
          ))}
        </div>
      )}
    </VetDashboardLayout>
  );
};

const VetCalendarScreen = () => <VetGuard><VetCalendarInner /></VetGuard>;
export default VetCalendarScreen;
