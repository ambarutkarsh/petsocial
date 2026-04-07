import { Activity, Scale, Stethoscope, Syringe, Footprints, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";

const metrics = [
  { icon: Scale, label: "Weight", value: "28.5", unit: "kg", note: "Healthy range", color: "bg-primary/10 text-primary" },
  { icon: Stethoscope, label: "Next Vet", value: "Apr 15", unit: "", note: "Annual checkup", color: "bg-secondary/10 text-secondary" },
  { icon: Syringe, label: "Vaccines", value: "4/6", unit: "done", note: "2 upcoming", color: "bg-accent/10 text-accent" },
  { icon: Footprints, label: "Steps", value: "3,240", unit: "", note: "Today", color: "bg-primary/10 text-primary" },
];

const vaccines = [
  { name: "Rabies", date: "Jan 15, 2024", status: "done" as const },
  { name: "DHPP Booster", date: "Mar 20, 2024", status: "done" as const },
  { name: "Bordetella", date: "Apr 25, 2024", status: "upcoming" as const },
  { name: "Leptospirosis", date: "Jun 10, 2024", status: "upcoming" as const },
];

const statusIcons = { done: "✅", upcoming: "⏳", overdue: "❌" };
const statusColors = {
  done: "bg-secondary/10 text-secondary",
  upcoming: "bg-accent/10 text-accent",
  overdue: "bg-destructive/10 text-destructive",
};

const HealthScreen = () => {
  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold">
            <span className="text-primary">Paw</span>Health
          </h1>
          <Button size="icon" variant="ghost" className="text-primary">
            <Plus className="w-5 h-5" />
          </Button>
        </header>

        {/* Pet selector */}
        <div className="px-4 mb-4">
          <div className="paw-card p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">🐕</div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg">Max</h3>
              <p className="text-xs text-text-muted">Golden Retriever • 3 yrs • Male</p>
            </div>
            <ChevronDown className="w-5 h-5 text-text-muted" />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="px-4 grid grid-cols-2 gap-3 mb-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="paw-card p-4">
                <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-text-muted font-medium">{m.label}</p>
                <p className="text-xl font-heading font-bold">{m.value} <span className="text-xs font-body text-text-muted">{m.unit}</span></p>
                <p className="text-[10px] text-text-muted mt-0.5">{m.note}</p>
              </div>
            );
          })}
        </div>

        {/* Activity progress */}
        <div className="px-4 mb-4">
          <div className="paw-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Today's Activity</p>
              <p className="text-xs text-text-muted">3,240 / 5,000 steps</p>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: "65%" }} />
            </div>
          </div>
        </div>

        {/* Vaccination schedule */}
        <div className="px-4">
          <h3 className="font-heading font-semibold mb-3">Vaccination Schedule</h3>
          <div className="space-y-2">
            {vaccines.map((v) => (
              <div key={v.name} className="paw-card p-3 flex items-center gap-3">
                <span className="text-lg">{statusIcons[v.status]}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-text-muted">{v.date}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[v.status]}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default HealthScreen;
