import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import ShopComingSoonScreen from "./ShopComingSoonScreen";
import BudgetCalculatorScreen from "./BudgetCalculatorScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";

type HubTab = "shop" | "budget";

const HubScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [showCreate, setShowCreate] = useState(false);
  const isGuest = !user;

  const initialTab: HubTab = useMemo(() => {
    if (location.pathname.startsWith("/hub/budget")) return "budget";
    return "shop";
  }, [location.pathname]);

  const [tab, setTab] = useState<HubTab>(initialTab);

  const switchTab = (next: HubTab) => {
    setTab(next);
    const target = next === "budget" ? "/hub/budget" : "/hub/shop";
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">Hub</h1>
        </div>

        {/* Pill tabs */}
        <div className="px-4 sticky top-0 z-30 bg-background/90 backdrop-blur py-2">
          <div className="flex gap-2">
            {([
              { key: "shop" as HubTab, label: "Shop" },
              { key: "budget" as HubTab, label: "Budget Calc" },
            ]).map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === "budget" && isGuest) {
                      triggerGuestPopup();
                      return;
                    }
                    switchTab(t.key);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-body font-semibold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-petosauras"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2">
          {tab === "shop" && <ShopComingSoonScreen embedded />}
          {tab === "budget" && <BudgetCalculatorScreen embedded />}
        </div>
      </div>

      <BottomNav onPostClick={() => (isGuest ? triggerGuestPopup() : setShowCreate(true))} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
