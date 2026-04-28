import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import ForumScreen from "./ForumScreen";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCoinBalance } from "@/lib/coins";
import { Folder, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { BudgetIcon, HeartIcon, LocationPinIcon, SettingsIcon, WeightIcon } from "@/components/icons/PetosauraIcons";

const utilityCards = [
  { icon: Folder, title: "Digital Locker", desc: "Documents & records", path: "/care/locker", color: "primary" },
  { icon: Heart, title: "Adoption / Mating", desc: "Find a friend", path: "/shop", color: "secondary" },
  { icon: Calculator, title: "Budget Calculator", desc: "Plan pet costs", path: "/health/budget", color: "accent" },
  { icon: Scale, title: "Legal & Rights", desc: "Know your rights", path: "/hub/legal", color: "primary" },
  { icon: MapPin, title: "Parks & Cafés", desc: "Pet-friendly spots", path: "/play", color: "accent" },
  { icon: Settings, title: "Settings", desc: "Preferences & profile", path: "/hub/settings", color: "primary" },
];

const HubScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["coins", user?.id],
    enabled: !!user,
    queryFn: () => getCoinBalance(user!.id),
  });

  const getInitials = (name: string | null) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Mini profile */}
        <div className="px-4 mt-3">
          <div className="paw-card p-4 flex items-center gap-3">
            <button onClick={() => navigate("/profile")} className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-base font-heading font-extrabold text-primary-foreground overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(profile?.full_name)}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold truncate">{profile?.full_name || "Pet Parent"}</p>
              <p className="text-xs text-muted-foreground font-body truncate">@{profile?.username || "user"}</p>
              {/* Sauras-Coins balance hidden — gamification temporarily disabled */}
            </div>
            <button onClick={() => navigate("/profile")} className="text-xs text-primary font-heading font-bold flex items-center">
              View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick access grid */}
        <div className="px-4 mt-4">
          <h2 className="font-heading font-bold text-base mb-2">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {utilityCards.map((c, idx) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.path + c.title}
                  onClick={() => navigate(c.path)}
                  className="text-left rounded-[22px] bg-card border border-border p-4 shadow-petosauras active:scale-[0.97] transition-all hover:shadow-petosauras-md hover:-translate-y-[2px] animate-fade-up"
                  style={{ borderLeft: `4px solid hsl(var(--${c.color}))`, animationDelay: `${idx * 60}ms` }}
                >
                  <div className="w-10 h-10 rounded-[12px] bg-primary-light flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-tight">{c.title}</h3>
                  <p className="text-[12px] text-muted-foreground font-body mt-0.5">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Community section */}
        <div className="mt-6 border-t border-border pt-2">
          <ForumScreen embedded />
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubScreen;
