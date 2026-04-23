import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";

const services = [
  { emoji: "🏥", label: "Vet Near Me", path: "/hub/vet-near-me", publicOk: true },
  { emoji: "🚑", label: "SOS", path: "/hub/sos", publicOk: true },
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
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [showCreate, setShowCreate] = useState(false);
  const isGuest = !user;

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">Hub</h1>
          <p className="text-xs text-muted-foreground font-body">All your pet services in one place</p>
        </div>

        <div className="px-4 mt-3">
          <div className="grid grid-cols-3 gap-3">
            {services.map((s, idx) => {
              const locked = isGuest && !s.publicOk;
              return (
                <button
                  key={s.path}
                  onClick={() => {
                    if (locked) {
                      triggerGuestPopup();
                      return;
                    }
                    navigate(s.path);
                  }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-[18px] bg-card border border-border shadow-petosauras hover:shadow-petosauras-md active:scale-[0.97] transition-all animate-fade-up"
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    opacity: locked ? 0.45 : 1,
                    cursor: locked ? "not-allowed" : "pointer",
                  }}
                >
                  {locked && (
                    <span
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center"
                      aria-hidden
                    >
                      <Lock className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center">
                    <span className="text-[22px]">{s.emoji}</span>
                  </div>
                  <span className="text-[11px] font-body font-semibold text-center text-muted-foreground leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav onPostClick={() => (isGuest ? triggerGuestPopup() : setShowCreate(true))} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
