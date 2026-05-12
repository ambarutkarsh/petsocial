import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";

type TabKey = "today" | "tomorrow" | "upcoming" | "pending" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<string, string> = {
  pending_vet_confirmation: "bg-amber-100 text-amber-800",
  reschedule_requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled_by_vet: "bg-red-100 text-red-800",
  cancelled_by_user: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-800",
};

const VetLedgerInner = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("today");

  const { data: vet } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_vet_profile");
      return Array.isArray(data) ? data[0] ?? null : null;
    },
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: rows = [] } = useQuery({
    queryKey: ["vet-ledger", vet?.id, tab, today, tomorrow],
    enabled: !!vet,
    queryFn: async () => {
      let q = supabase
        .from("vet_bookings")
        .select(
          "id, booking_reference, status, reason_for_visit, is_emergency, user_id, " +
          "pets(name, species), profiles:public_profiles!vet_bookings_user_id_fkey(full_name, phone), " +
          "vet_slots!inner(slot_date, start_time)",
        )
        .eq("vet_id", vet!.id);

      if (tab === "today") q = q.eq("vet_slots.slot_date", today).in("status", ["confirmed", "pending_vet_confirmation"]);
      else if (tab === "tomorrow") q = q.eq("vet_slots.slot_date", tomorrow).in("status", ["confirmed", "pending_vet_confirmation"]);
      else if (tab === "upcoming") q = q.gt("vet_slots.slot_date", tomorrow).in("status", ["confirmed", "pending_vet_confirmation"]);
      else if (tab === "pending") q = q.in("status", ["pending_vet_confirmation", "reschedule_requested"]);
      else if (tab === "completed") q = q.eq("status", "completed");
      else if (tab === "cancelled") q = q.in("status", ["cancelled_by_vet", "cancelled_by_user", "rejected"]);

      const { data } = await q
        .order("vet_slots(slot_date)" as any, { ascending: true })
        .order("vet_slots(start_time)" as any, { ascending: true })
        .limit(100);
      return (data as any[]) ?? [];
    },
  });

  return (
    <VetDashboardLayout title="Clinic Ledger">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-[11px] font-body font-semibold ${
              tab === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {rows.length === 0 && (
          <p className="text-xs font-body text-muted-foreground py-6 text-center">No appointments here.</p>
        )}
        {rows.map((b: any) => (
          <div key={b.id} className={`paw-card p-3 ${b.is_emergency ? "border-l-4 border-l-amber-400" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm">
                  {String(b.vet_slots?.start_time ?? "").slice(0, 5)} · {b.vet_slots?.slot_date}
                </p>
                <p className="text-xs font-body">🐾 {b.pets?.name ?? "—"} ({b.pets?.species ?? "—"})</p>
                <p className="text-[11px] font-body text-muted-foreground">Owner: {b.profiles?.full_name ?? "—"}</p>
                <p className="text-[11px] font-body text-muted-foreground">Reason: {b.reason_for_visit ?? "—"}</p>
                <p className="text-[10px] font-body text-muted-foreground">Ref: {b.booking_reference}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-body px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] ?? "bg-muted"}`}>
                {b.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {b.profiles?.phone && (
                <a
                  href={`tel:${b.profiles.phone}`}
                  className="px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-heading font-bold"
                >
                  📞 Contact owner
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </VetDashboardLayout>
  );
};

const VetLedgerScreen = () => <VetGuard><VetLedgerInner /></VetGuard>;
export default VetLedgerScreen;
