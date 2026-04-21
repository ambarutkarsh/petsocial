import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";

const services = [
  { emoji: "🏥", label: "Vet Near Me", path: "/hub/vet-near-me" },
  { emoji: "🚑", label: "SOS", path: "/hub/sos" },
  { emoji: "🛡️", label: "Insurance", path: "/hub/insurance" },
  { emoji: "🤝", label: "NGO Connect", path: "/hub/ngo" },
  { emoji: "💰", label: "Budget Calc", path: "/hub/budget" },
  { emoji: "💉", label: "Microchip", path: "/hub/microchip" },
  { emoji: "🐾", label: "Pet Recommender", path: "/hub/recommender" },
  { emoji: "✈️", label: "Petcation", path: "/hub/petcation" },
  { emoji: "🚛", label: "Pet Moving", path: "/hub/pet-moving" },
  { emoji: "📋", label: "License Info", path: "/hub/license" },
  { emoji: "⚖️", label: "Know Rights", path: "/hub/rights" },
  { emoji: "🚗", label: "Pick & Drop", path: "/hub/pickup" },
];

const HubScreen = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">Hub</h1>
          <p className="text-xs text-muted-foreground font-body">All your pet services in one place</p>
        </div>

        <div className="px-4 mt-3">
          <div className="grid grid-cols-3 gap-3">
            {services.map((s, idx) => (
              <button
                key={s.path}
                onClick={() => navigate(s.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-[18px] bg-card border border-border shadow-petosauras hover:shadow-petosauras-md active:scale-[0.97] transition-all animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-[22px]">{s.emoji}</span>
                </div>
                <span className="text-[11px] font-body font-semibold text-center text-muted-foreground leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
