import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  LogOut,
  HelpCircle,
  Info,
  Mail,
  Shield,
  FileText,
  Sparkles,
} from "lucide-react";
import { BackIcon } from "@/components/icons/PetosauraIcons";

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const items = [
    { icon: HelpCircle, title: "FAQ", path: "/faq" },
    { icon: Info, title: "About Us", path: "/about-us" },
    { icon: Mail, title: "Contact Us", path: "/contact-us" },
    { icon: Shield, title: "Privacy Policy", path: "/privacy-policy" },
    { icon: FileText, title: "Terms of Service", path: "/terms-of-service" },
    { icon: Sparkles, title: "Detailed Features", path: "/features" },
  ];

  return (
    <MobileLayout>
      <div className="pb-10 px-4">
        <header className="pt-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-[10px] bg-surface-alt flex items-center justify-center"
            aria-label="Back"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl font-bold">Settings</h1>
        </header>

        <div className="mt-4 paw-card divide-y divide-border">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.title}
                onClick={() => navigate(it.path)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/40 transition-colors"
              >
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                <p className="flex-1 font-body font-semibold text-sm">{it.title}</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {user && (
          <Button variant="outline" className="w-full mt-6" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        )}
      </div>
    </MobileLayout>
  );
};

export default SettingsScreen;
