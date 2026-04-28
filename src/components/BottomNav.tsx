import { FeedsIcon, HubIcon, MyPetIcon, PlusIcon, ShopIcon, useLocation, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import CreateSheet from "./CreateSheet";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { HubIcon } from "@/components/icons/PetosauraIcons";

const navItems = [
  { icon: FeedsIcon, label: "Feeds", path: "/feeds", event: "bottom_nav_feeds_tap", match: ["/feeds", "/play", "/feed"] },
  { icon: HubIcon, label: "Hub", path: "/hub", event: "bottom_nav_hub_tap", match: ["/hub", "/care", "/forum", "/community"] },
  { icon: PlusIcon, label: "Create", path: "__create", isFab: true, event: "fab_create_button_tap", match: [] },
  { icon: MyPetIcon, label: "MyPet", path: "/mypet", event: "bottom_nav_mypet_tap", match: ["/mypet", "/health"], requiresAuth: true },
  { icon: ShopIcon, label: "Shop", path: "/shop", event: "bottom_nav_shop_tap", match: ["/shop"] },
];

interface BottomNavProps {
  onPostClick?: () => void;
}

const BottomNav = ({ onPostClick }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [createOpen, setCreateOpen] = useState(false);

  const isPathActive = (matches: string[]) =>
    matches.some((m) => location.pathname === m || location.pathname.startsWith(m + "/"));

  return (
    <>
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-card border-t border-border shadow-[0_-4px_24px_rgba(27,42,74,0.08)]"
        style={{ maxWidth: 480, height: 64, zIndex: 1000, borderTopWidth: 0.5 }}
      >
        <div className="flex items-center justify-around h-16 px-4 pb-[10px]">
          {navItems.map((item) => {
            const isActive = isPathActive(item.match);
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    trackEvent(item.event);
                    if (!user) {
                      triggerGuestPopup();
                      return;
                    }
                    if (onPostClick) onPostClick();
                    else setCreateOpen(true);
                  }}
                  aria-label="Create"
                  className="relative -mt-[14px] w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-[#243660] text-primary-foreground shadow-[0_4px_20px_rgba(27,42,74,0.45)] flex items-center justify-center transition-transform hover:scale-[1.08] active:scale-95"
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => {
                  trackEvent(item.event);
                  if (item.requiresAuth && !user) {
                    triggerGuestPopup();
                    return;
                  }
                  navigate(item.path);
                }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "text-primary bg-primary-light" : "text-text-hint"
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.6} />
                <span className="text-[10px] font-body font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
};

export default BottomNav;
