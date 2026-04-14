import { Home, MessageSquare, Plus, Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/feed" },
  { icon: MessageSquare, label: "Forum", path: "/forum" },
  { icon: Plus, label: "Post", path: "/post", isFab: true },
  { icon: Heart, label: "Health", path: "/health" },
  { icon: User, label: "Profile", path: "/profile" },
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
          const isActive = location.pathname === item.path || (item.path === "/health" && location.pathname.startsWith("/health"));
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <button
                key={item.path}
                onClick={onPostClick}
                className="relative -mt-[14px] w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-[#9B7EC8] text-primary-foreground shadow-[0_4px_20px_rgba(123,94,167,0.45)] flex items-center justify-center transition-transform hover:scale-[1.08] active:scale-95"
              >
                <Icon className="w-6 h-6" strokeWidth={1.8} />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary-light"
                  : "text-text-hint"
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
