import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { ChevronRight } from "lucide-react";

const healthCards = [
  { emoji: "🏥", title: "Vet Near Me", desc: "Find clinics and hospitals nearby", path: "/health/vet-near-me" },
  { emoji: "📋", title: "Pet DigiLocker", desc: "Health records, vaccines & growth", path: "/health/digilocker" },
  { emoji: "💰", title: "Budget Calculator", desc: "Plan your pet care costs", path: "/health/budget" },
  { emoji: "🛍️", title: "Order Now", desc: "Food, supplies and accessories", path: "/health/order" },
];

const HealthScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        <header className="pt-6 pb-4">
          <h1 className="font-heading text-2xl font-bold">Pet Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything your pet needs, in one place</p>
        </header>
        <div className="grid grid-cols-2 gap-3">
          {healthCards.map((c) => (
            <button
              key={c.path}
              onClick={() => navigate(c.path)}
              className="text-left rounded-2xl bg-card border border-border/50 p-[18px] active:scale-[0.97] transition-transform"
              style={{ boxShadow: "0 2px 14px rgba(0,0,0,0.05)", borderLeft: "4px solid hsl(var(--primary))" }}
            >
              <span className="text-[48px] leading-none block mb-2">{c.emoji}</span>
              <h3 className="font-heading font-bold text-base">{c.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">{c.desc}</p>
              <ChevronRight className="w-4 h-4 text-primary mt-2" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default HealthScreen;
