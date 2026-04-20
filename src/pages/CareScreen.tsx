import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";

const careCards = [
  { emoji: "🚑", title: "SOS / Ambulance", desc: "Emergency vet help", path: "/care/sos", accent: "destructive" },
  { emoji: "🏥", title: "Vet & Reviews", desc: "Find vets near you", path: "/care/vet", accent: "primary" },
  { emoji: "📋", title: "Health Tracker", desc: "Log weight, food, vitals", path: "/care/tracker", accent: "primary" },
  { emoji: "💉", title: "Vaccinations", desc: "Track due dates", path: "/care/vaccines", accent: "accent" },
  { emoji: "📂", title: "Digital Locker", desc: "Documents & records", path: "/care/locker", accent: "primary" },
  { emoji: "🧬", title: "AI Health Insight", desc: "Get AI advice", path: "/care/ai", accent: "secondary", badge: "Soon" },
];

const CareScreen = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        <header className="pt-6 pb-4">
          <h1 className="font-heading text-2xl font-bold">Pet Care</h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">Health, safety, and wellbeing — all in one place</p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {careCards.map((c, idx) => (
            <button
              key={c.path}
              onClick={() => navigate(c.path)}
              className="relative text-left rounded-[22px] bg-card border border-border p-[18px] shadow-petosauras active:scale-[0.97] transition-all duration-250 hover:shadow-petosauras-md hover:-translate-y-[2px] animate-fade-up"
              style={{ borderLeft: `4px solid hsl(var(--${c.accent}))`, animationDelay: `${idx * 60}ms` }}
            >
              {c.badge && (
                <span className="absolute top-2 right-2 text-[9px] font-body font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{c.badge}</span>
              )}
              <div className="w-12 h-12 rounded-[14px] bg-primary-light flex items-center justify-center mb-2">
                <span className="text-[28px] leading-none">{c.emoji}</span>
              </div>
              <h3 className="font-heading font-bold text-sm leading-tight">{c.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5 font-body line-clamp-2">{c.desc}</p>
              <ChevronRight className="w-4 h-4 text-primary mt-2" strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default CareScreen;
