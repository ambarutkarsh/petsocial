import { ReactNode, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { LayoutDashboard, LogOut, ImagePlus, Mail, Images } from "lucide-react";
import { BellIcon, PetCareIcon, StarIcon, VetIcon } from "@/components/icons/PetosauraIcons";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/seed", label: "Seed Data", icon: PetCareIcon },
  { to: "/admin/bulk-upload", label: "Bulk Upload", icon: ImagePlus },
  { to: "/admin/home-carousel", label: "Home Carousel", icon: Images },
  { to: "/admin/competitions", label: "Competitions", icon: StarIcon },
  { to: "/admin/vets", label: "Vets", icon: VetIcon },
  { to: "/admin/welcome-email", label: "Welcome Email", icon: Mail },
];

const NAV_BOTTOM = [
  { to: "/admin/notifications", label: "Push Notifications", icon: BellIcon },
];

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
}

const AdminLayout = ({ children, title, subtitle, headerRight }: Props) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdminEmail(user.email)) {
      // Regular users have no business here — send them to feeds.
      navigate("/feeds", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F5" }}>
      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-30"
        style={{ background: "#1E1B2E" }}
      >
        <div className="flex items-center gap-2">
          <img src="/petosauras-logo.png" alt="Petosauras" style={{ height: 28, objectFit: "contain" }} />
          <span className="text-white/70 text-sm font-body">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs font-body hidden sm:inline">
            Logged in as: {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-body text-white border border-white/40 hover:bg-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-[220px] z-20 hidden md:flex flex-col"
        style={{ background: "#FFFFFF", borderRight: "1px solid #F5F1EC", paddingTop: 80 }}
      >
        <nav className="flex-1 flex flex-col">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 rounded-lg mx-3 my-0.5 text-sm font-body transition-colors ${
                    isActive
                      ? "font-semibold"
                      : "hover:bg-[#F5F2FB]"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: "#EDE5FF", color: "#7B5EA7", borderLeft: "3px solid #7B5EA7" }
                    : { color: "#9B96B0" }
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
          <div className="my-3 mx-5 border-t" style={{ borderColor: "#F5F1EC" }} />
          {NAV_BOTTOM.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 rounded-lg mx-3 my-0.5 text-sm font-body transition-colors ${
                    isActive ? "font-semibold" : "hover:bg-[#F5F2FB]"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: "#EDE5FF", color: "#7B5EA7", borderLeft: "3px solid #7B5EA7" }
                    : { color: "#9B96B0" }
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav for admin */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-20" style={{ borderColor: "#F5F1EC" }}>
        {[...NAV, ...NAV_BOTTOM].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={(item as any).end}
              className="flex-1 flex flex-col items-center py-2 text-[10px] font-body"
              style={({ isActive }) => ({ color: isActive ? "#7B5EA7" : "#9B96B0" })}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              {item.label.split(" ")[0]}
            </NavLink>
          );
        })}
      </nav>

      <main
        className="md:ml-[220px] mt-14 p-6 md:p-8 pb-20 md:pb-8"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        {(title || headerRight) && (
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              {title && <h1 className="text-2xl font-heading font-bold text-foreground">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground font-body mt-1">{subtitle}</p>}
            </div>
            {headerRight}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
