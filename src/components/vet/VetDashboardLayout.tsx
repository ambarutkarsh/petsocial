import MobileLayout from "@/components/MobileLayout";
import PageWrapper from "@/components/PageWrapper";
import PostUploadModal from "@/components/PostUploadModal";
import { useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import { BackIcon, BellIcon, BookVetIcon, ProfileIcon, SettingsIcon } from "@/components/icons/PetosauraIcons";

const tabs = [
  { path: "/vet-dashboard", label: "Today", Icon: BookVetIcon },
  { path: "/vet-dashboard/ledger", label: "Ledger", Icon: BookVetIcon },
  { path: "/vet-dashboard/requests", label: "Requests", Icon: BellIcon },
  { path: "/vet-dashboard/availability", label: "Hours", Icon: SettingsIcon },
  { path: "/vet-dashboard/profile", label: "Profile", Icon: ProfileIcon },
];

interface Props {
  title: string;
  children: ReactNode;
}

const VetDashboardLayout = ({ title, children }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hub")}
            aria-label="Exit dashboard"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center"
          >
            <BackIcon className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <h1 className="font-heading font-bold text-[18px] flex-1 truncate">{title}</h1>
        </header>
        <div className="mt-4 pb-24">{children}</div>
      </PageWrapper>

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-30">
        <div className="grid grid-cols-5">
          {tabs.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`py-2 flex flex-col items-center gap-0.5 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
                <span className="text-[9px] font-body font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default VetDashboardLayout;
