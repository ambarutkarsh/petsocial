import { Sparkles, HeartPulse, Plus, ShoppingBag, Compass } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

const navItems = [
  { icon: Sparkles, label: "Play", path: "/play", event: "bottom_nav_play_tap" },
  { icon: HeartPulse, label: "Care", path: "/care", event: "bottom_nav_care_tap" },
  { icon: Plus, label: "Create", path: "/create", isFab: true, event: "fab_create_button_tap" },
  { icon: ShoppingBag, label: "Shop", path: "/shop", event: "bottom_nav_shop_tap" },
  { icon: Compass, label: "Hub", path: "/hub", event: "bottom_nav_hub_tap" },
];

interface BottomNavProps {
  onPostClick?: () => void;
}

const BottomNav = ({ onPostClick }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border shadow-[0_-4px_24px_rgba(123,94,167,0.08)] z-50">
      <div className="flex items-center justify-around h-16 px-4 pb-[10px]">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/play" && (location.pathname === "/feed" || location.pathname.startsWith("/play"))) ||
            (item.path === "/care" && (location.pathname.startsWith("/care") || location.pathname.startsWith("/health"))) ||
            (item.path === "/shop" && location.pathname.startsWith("/shop")) ||
            (item.path === "/hub" && (location.pathname.startsWith("/hub") || location.pathname.startsWith("/forum") || location.pathname.startsWith("/community")));
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <button
                key={item.path}
                onClick={() => {
                  trackEvent(item.event);
                  onPostClick?.();
                }}
                aria-label="Create"
                className="relative -mt-[14px] w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-[#9B7EC8] text-primary-foreground shadow-[0_4px_20px_rgba(123,94,167,0.45)] flex items-center justify-center transition-transform hover:scale-[1.08] active:scale-95"
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
                navigate(item.path);
              }}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
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
  );
};

export default BottomNav;
