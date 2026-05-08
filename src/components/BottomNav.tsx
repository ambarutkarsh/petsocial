import { useLocation, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { Users, LayoutGrid, PawPrint, MapPin, Home } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";

interface NavItem {
  icon: typeof Users;
  label: string;
  path: string;
  event: string;
  match: string[];
  isFab?: boolean;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { icon: Users, label: "Community", path: "/feeds", event: "bottom_nav_community_tap", match: ["/feeds", "/play", "/feed"] },
  { icon: MapPin, label: "NearBy", path: "/nearby", event: "bottom_nav_nearby_tap", match: ["/nearby"] },
  { icon: Home, label: "Home", path: "/home", event: "bottom_nav_home_tap", match: ["/home"], isFab: true },
  { icon: LayoutGrid, label: "eHub", path: "/hub", event: "bottom_nav_ehub_tap", match: ["/hub", "/care", "/forum", "/community"] },
  { icon: PawPrint, label: "MyPet", path: "/mypet", event: "bottom_nav_mypet_tap", match: ["/mypet", "/health"], requiresAuth: true },
];

interface BottomNavProps {
  onPostClick?: () => void;
}

const BottomNav = (_props: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();

  const isPathActive = (matches: string[]) =>
    matches.some((m) => location.pathname === m || location.pathname.startsWith(m + "/"));

  if (user && isAdminEmail(user.email)) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-card border-t border-border shadow-[0_-4px_24px_rgba(123,94,167,0.08)]"
      style={{ maxWidth: 480, height: 64, zIndex: 1000, borderTopWidth: 0.5 }}
    >
      <div className="flex items-center justify-around h-16 px-4 pb-[10px]">
        {navItems.map((item) => {
          const isActive = isPathActive(item.match);
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <div key={item.path} className="flex-1 flex justify-center">
                <button
                  onClick={() => {
                    trackEvent(item.event);
                    navigate(item.path);
                  }}
                  aria-label={item.label}
                  className="relative -mt-[18px] w-[54px] h-[54px] rounded-full bg-gradient-to-br from-primary to-[#9B7EC8] text-primary-foreground shadow-[0_4px_20px_rgba(123,94,167,0.45)] flex items-center justify-center transition-transform hover:scale-[1.08] active:scale-95"
                >
                  <Icon size={26} strokeWidth={1.8} />
                </button>
              </div>
            );
          }

          return (
            <div key={item.path} className="flex-1 flex justify-center">
              <button
                onClick={() => {
                  trackEvent(item.event);
                  if (item.requiresAuth && !user) {
                    triggerGuestPopup();
                    return;
                  }
                  navigate(item.path);
                }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-[10px] transition-all duration-200 ${
                  isActive ? "text-primary bg-primary-light" : "text-text-hint"
                }`}
              >
                <Icon size={22} strokeWidth={1.5} fill={isActive ? "currentColor" : "none"} />
                <span className="text-[10px] font-body font-semibold">{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
