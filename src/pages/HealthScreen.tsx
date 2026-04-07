import { Activity, Scale, Stethoscope, Syringe, Footprints, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const statusIcons: Record<string, string> = { done: "✅", upcoming: "⏳", overdue: "❌" };
const statusColors: Record<string, string> = {
  done: "bg-secondary/10 text-secondary",
  upcoming: "bg-accent/10 text-accent",
  overdue: "bg-destructive/10 text-destructive",
};

const HealthScreen = () => {
  const { user } = useAuth();

  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id).order("is_primary", { ascending: false });
      return data || [];
    },
  });

  const activePet = pets[0];

  const { data: latestLog } = useQuery({
    queryKey: ["latest-health-log", activePet?.id],
    enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("health_logs").select("*").eq("pet_id", activePet!.id).order("log_date", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["vaccinations", activePet?.id],
    enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("vaccinations").select("*").eq("pet_id", activePet!.id).order("due_date", { ascending: true });
      return data || [];
    },
  });

  const { data: nextAppt } = useQuery({
    queryKey: ["next-appt", activePet?.id],
    enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("vet_appointments").select("*").eq("pet_id", activePet!.id).eq("status", "upcoming").order("appointment_date", { ascending: true }).limit(1);
      return data?.[0] || null;
    },
  });

  const doneVacc = vaccinations.filter((v: any) => v.status === "done").length;
  const totalVacc = vaccinations.length;

  const metrics = [
    { icon: Scale, label: "Weight", value: latestLog?.weight_kg ? `${latestLog.weight_kg}` : "—", unit: "kg", note: "Latest log", color: "bg-primary/10 text-primary" },
    { icon: Stethoscope, label: "Next Vet", value: nextAppt ? format(new Date(nextAppt.appointment_date), "MMM d") : "—", unit: "", note: nextAppt?.reason || "No upcoming", color: "bg-secondary/10 text-secondary" },
    { icon: Syringe, label: "Vaccines", value: totalVacc > 0 ? `${doneVacc}/${totalVacc}` : "—", unit: "done", note: totalVacc - doneVacc > 0 ? `${totalVacc - doneVacc} upcoming` : "All done", color: "bg-accent/10 text-accent" },
    { icon: Footprints, label: "Steps", value: latestLog?.steps ? latestLog.steps.toLocaleString() : "—", unit: "", note: "Today", color: "bg-primary/10 text-primary" },
  ];

  const stepsProgress = latestLog?.steps ? Math.min((latestLog.steps / 5000) * 100, 100) : 0;

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold"><span className="text-primary">Paw</span>Health</h1>
          <Button size="icon" variant="ghost" className="text-primary"><Plus className="w-5 h-5" /></Button>
        </header>

        {/* Pet selector */}
        {activePet ? (
          <div className="px-4 mb-4">
            <div className="paw-card p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">{activePet.avatar_emoji || "🐾"}</div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg">{activePet.name}</h3>
                <p className="text-xs text-text-muted">{activePet.species || activePet.pet_type} • {activePet.age_years ? `${activePet.age_years} yrs` : ""} • {activePet.gender || ""}</p>
              </div>
              {pets.length > 1 && <ChevronDown className="w-5 h-5 text-text-muted" />}
            </div>
          </div>
        ) : (
          <div className="px-4 mb-4 text-center py-8">
            <span className="text-4xl">🐾</span>
            <p className="text-sm text-text-muted mt-2">Add a pet to start tracking health</p>
          </div>
        )}

        <div className="px-4 grid grid-cols-2 gap-3 mb-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="paw-card p-4">
                <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
                <p className="text-xs text-text-muted font-medium">{m.label}</p>
                <p className="text-xl font-heading font-bold">{m.value} <span className="text-xs font-body text-text-muted">{m.unit}</span></p>
                <p className="text-[10px] text-text-muted mt-0.5">{m.note}</p>
              </div>
            );
          })}
        </div>

        <div className="px-4 mb-4">
          <div className="paw-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Today's Activity</p>
              <p className="text-xs text-text-muted">{latestLog?.steps?.toLocaleString() || 0} / 5,000 steps</p>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${stepsProgress}%` }} />
            </div>
          </div>
        </div>

        {vaccinations.length > 0 && (
          <div className="px-4">
            <h3 className="font-heading font-semibold mb-3">Vaccination Schedule</h3>
            <div className="space-y-2">
              {vaccinations.map((v: any) => (
                <div key={v.id} className="paw-card p-3 flex items-center gap-3">
                  <span className="text-lg">{statusIcons[v.status] || "⏳"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{v.vaccine_name}</p>
                    <p className="text-xs text-text-muted">{v.due_date ? format(new Date(v.due_date), "MMM d, yyyy") : "No date"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[v.status] || statusColors.upcoming}`}>{v.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default HealthScreen;
