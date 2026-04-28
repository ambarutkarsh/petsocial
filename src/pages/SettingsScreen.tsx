import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, LogOut, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BellIcon, LocationPinIcon, ProfileIcon, VerifiedIcon } from "@/components/icons/PetosauraIcons";

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const items = [
    { icon: User, title: "Edit Profile", action: () => navigate("/profile") },
    { icon: MapPin, title: "Change Address", action: () => navigate("/profile") },
    { icon: Bell, title: "Notification Settings", action: () => {} },
    { icon: Shield, title: "Privacy Settings", action: () => {} },
  ];

  return (
    <MobileLayout>
      <div className="pb-10 px-4">
        <header className="pt-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[10px] bg-surface-alt flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-heading text-xl font-bold">⚙️ Settings</h1>
        </header>

        <div className="mt-4 paw-card divide-y divide-border">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button key={it.title} onClick={it.action} className="w-full p-4 flex items-center gap-3 text-left">
                <Icon className="w-5 h-5 text-primary" />
                <p className="flex-1 font-body font-semibold text-sm">{it.title}</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <Button variant="outline" className="w-full mt-6" onClick={async () => { await signOut(); navigate("/auth"); }}>
          <LogOut className="w-4 h-4" /> Log Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default SettingsScreen;
