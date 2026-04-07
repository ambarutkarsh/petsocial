import { Home, Users, Activity, User, Camera } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/feed" },
  { icon: Users, label: "Forum", path: "/forum" },
  { icon: Camera, label: "Post", path: "/post", isFab: true },
  { icon: Activity, label: "Health", path: "/health" },
  { icon: User, label: "Profile", path: "/profile" },
];

interface BottomNavProps {
  onPostClick?: () => void;
}

const BottomNav = ({ onPostClick }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <button
                key={item.path}
                onClick={onPostClick}
                className="relative -mt-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-paw-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
