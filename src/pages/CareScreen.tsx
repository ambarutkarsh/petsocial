import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Sparkles, ShoppingBag } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { Button } from "@/components/ui/button";

type Tab = "budget" | "recommender" | "shop";

const TABS: { key: Tab; label: string; Icon: typeof Calculator }[] = [
  { key: "budget", label: "Budget Calc", Icon: Calculator },
  { key: "recommender", label: "Pet Recommender", Icon: Sparkles },
  { key: "shop", label: "Shop", Icon: ShoppingBag },
];

const SHOP_PREVIEWS = [
  { emoji: "🍖", title: "Pet Food", desc: "Curated brands delivered to you" },
  { emoji: "🧸", title: "Toys & Accessories", desc: "Keep your pet happy and active" },
  { emoji: "💊", title: "Health Supplies", desc: "Supplements and essentials" },
  { emoji: "🛁", title: "Grooming Essentials", desc: "Shampoos, brushes and more" },
];

const HubScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<Tab>("budget");
  const isGuest = !user;

  return (
    <MobileLayout>
      <div className="pb-24">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">Hub</h1>
          <p className="text-xs text-muted-foreground font-body">Tools, recommendations and shopping for every pet parent.</p>
        </div>

        {/* Top utility bar */}
        <div className="mt-2 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {TABS.map((t) => {
              const Icon = t.Icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-colors ${
                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.6} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          {tab === "budget" && (
            <div className="px-4">
              <div className="paw-card p-6 text-center">
                <Calculator className="w-10 h-10 mx-auto text-primary mb-2" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-base">Budget Calculator</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Estimate the monthly and annual cost of caring for your pet.</p>
                <Button className="mt-4" onClick={() => navigate("/hub/budget")}>Open Calculator</Button>
              </div>
            </div>
          )}

          {tab === "recommender" && (
            <div className="px-4">
              <div className="paw-card p-6 text-center">
                <Sparkles className="w-10 h-10 mx-auto text-primary mb-2" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-base">Pet Recommender</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Find the right pet for your intent, lifestyle and budget.</p>
                <Button className="mt-4" onClick={() => navigate("/hub/pet-recommender")}>Open Recommender</Button>
              </div>
            </div>
          )}

          {tab === "shop" && (
            <div className="px-4 space-y-3">
              <div className="paw-card p-4 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto text-primary mb-1" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-base">Shop — Coming soon</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Premium pet products, delivered to your door.</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate("/shop")}>Join Waitlist</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SHOP_PREVIEWS.map((p) => (
                  <div key={p.title} className="paw-card p-4">
                    <div className="text-3xl mb-1">{p.emoji}</div>
                    <p className="font-heading font-bold text-sm">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground font-body mt-0.5">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav onPostClick={() => (isGuest ? triggerGuestPopup() : setShowCreate(true))} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
