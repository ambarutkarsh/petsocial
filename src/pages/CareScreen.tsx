import { useState } from "react";
import {
  AlertCircle,
  Sparkles,
  Stethoscope,
  Calculator,
  ShieldCheck,
  MapPin,
  CalendarCheck,
  Cpu,
  PlaneTakeoff,
  Truck,
  Heart,
  Car,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";

type ServiceItem = {
  Icon: typeof AlertCircle;
  label: string;
  path: string;
  publicOk?: boolean;
  iconColor?: string;
};

const services: ServiceItem[] = [
  { Icon: AlertCircle, label: "SOS", path: "/hub/sos", publicOk: true, iconColor: "#FF6B6B" },
  { Icon: Sparkles, label: "Pet Recommender", path: "/hub/pet-recommender", publicOk: true },
  { Icon: Stethoscope, label: "Pet Care", path: "/hub/pet-care", publicOk: true },
  { Icon: Calculator, label: "Budget Calc", path: "/hub/budget" },
  { Icon: ShieldCheck, label: "Insurance", path: "/hub/insurance" },
  { Icon: MapPin, label: "Vet Near Me", path: "/hub/vet-near-me", publicOk: true },
  { Icon: Cpu, label: "Microchip", path: "/hub/microchip" },
  { Icon: PlaneTakeoff, label: "Petcation", path: "/hub/petcation" },
  { Icon: Truck, label: "Pet Moving", path: "/hub/pet-moving" },
  { Icon: Heart, label: "NGO Connect", path: "/hub/ngo" },
  { Icon: Car, label: "Pet Pick & Drop", path: "/hub/pickup" },
  { Icon: CalendarCheck, label: "Book a Vet", path: "/hub/book-a-vet" },
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
              const Icon = s.Icon;
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
                      <Lock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                    </span>
                  )}
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                    style={{
                      background: "#EDE5FF",
                      border: "1px solid rgba(123,94,167,0.12)",
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} color={s.iconColor || "#7B5EA7"} />
                  </div>
                  <span className="text-[11px] font-body font-semibold text-center text-muted-foreground leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav onPostClick={() => (isGuest ? triggerGuestPopup() : setShowCreate(true))} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
