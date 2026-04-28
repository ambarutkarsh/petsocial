import { useState } from "react";
import {
  LockIcon,
  SOSIcon,
  PetRecommenderIcon,
  PetCareIcon,
  BudgetIcon,
  InsuranceIcon,
  VetIcon,
  MicrochipIcon,
  PetcationIcon,
  PetMovingIcon,
  NGOIcon,
  PickDropIcon,
  BookVetIcon,
} from "@/components/icons/PetosauraIcons";
import { useNavigate } from "react-router-dom";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";

const services = [
  // Row 1 — all free for guests
  { Icon: SOSIcon, label: "SOS", path: "/hub/sos", publicOk: true },
  { Icon: PetRecommenderIcon, label: "Pet Recommender", path: "/hub/pet-recommender", publicOk: true },
  { Icon: PetCareIcon, label: "Pet Care", path: "/hub/pet-care", publicOk: true },
  // Row 2
  { Icon: BudgetIcon, label: "Budget Calc", path: "/hub/budget" },
  { Icon: InsuranceIcon, label: "Insurance", path: "/hub/insurance" },
  { Icon: VetIcon, label: "Vet Near Me", path: "/hub/vet-near-me", publicOk: true },
  // Row 3
  { Icon: MicrochipIcon, label: "Microchip", path: "/hub/microchip" },
  { Icon: PetcationIcon, label: "Petcation", path: "/hub/petcation" },
  { Icon: PetMovingIcon, label: "Pet Moving", path: "/hub/pet-moving" },
  // Row 4
  { Icon: NGOIcon, label: "NGO Connect", path: "/hub/ngo" },
  { Icon: PickDropIcon, label: "Pet Pick & Drop", path: "/hub/pickup" },
  { Icon: BookVetIcon, label: "Book a Vet", path: "/hub/book-a-vet" },
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
                      <LockIcon className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-[14px] bg-primary-light flex items-center justify-center">
                    <s.Icon size={26} />
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
