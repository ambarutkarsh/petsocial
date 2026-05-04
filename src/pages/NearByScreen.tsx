import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Stethoscope,
  Map as MapIcon,
  Truck,
  Car,
  HandHeart,
} from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import NearbyListings from "@/components/nearby/NearbyListings";
import { NEARBY_CATEGORY_MAP } from "@/lib/feedPills";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";

type ServiceKey = "sos" | "vet" | "petcation" | "moving" | "pickup" | "ngo";

const SERVICES: { key: ServiceKey; label: string; Icon: typeof AlertTriangle; path: string; color?: string }[] = [
  { key: "sos", label: "SOS", Icon: AlertTriangle, path: "/hub/sos", color: "#FF6B6B" },
  { key: "vet", label: "Book a Vet", Icon: Stethoscope, path: "/hub/book-a-vet" },
  { key: "petcation", label: "Petcation", Icon: MapIcon, path: "/hub/petcation" },
  { key: "moving", label: "Pet Moving", Icon: Truck, path: "/hub/pet-moving" },
  { key: "pickup", label: "Pick & Drop", Icon: Car, path: "/hub/pickup" },
  { key: "ngo", label: "NGO Connect", Icon: HandHeart, path: "/hub/ngo" },
];

const CATEGORY_PILLS = [
  { key: "vet", emoji: "🩺", label: "Vet", route: "/hub/vet-near-me" as string | null, category: null as null | keyof typeof NEARBY_CATEGORY_MAP },
  { key: "pet_restaurants", emoji: "🍽️", label: "Pet Restaurants", route: null, category: "pet_restaurants" as const },
  { key: "walker", emoji: "🚶", label: "Walker", route: null, category: "walker" as const },
  { key: "spa_grooming", emoji: "💆", label: "Spa & Grooming", route: null, category: "spa_grooming" as const },
  { key: "pet_park", emoji: "🌳", label: "Pet Parks", route: null, category: "pet_park" as const },
  { key: "pet_show", emoji: "🎪", label: "Pet Shows", route: null, category: "pet_show" as const },
  { key: "boarding", emoji: "🏠", label: "Boarding", route: null, category: "boarding" as const },
  { key: "help_stray", emoji: "🐾", label: "Help Stray", route: null, category: "help_stray" as const },
  { key: "lost_found", emoji: "🚨", label: "Lost & Found", route: null, category: "lost_found" as const },
];

const NearByScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [showCreate, setShowCreate] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("spa_grooming");

  const isGuest = !user;
  const activePill = CATEGORY_PILLS.find((p) => p.key === activeCat) || CATEGORY_PILLS[3];

  return (
    <MobileLayout>
      <div className="pb-24">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">NearBy</h1>
          <p className="text-xs text-muted-foreground font-body">Find pet-friendly services and support around you.</p>
        </div>

        <div className="mt-2 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {SERVICES.map((s) => {
              const Icon = s.Icon;
              return (
                <button
                  key={s.key}
                  onClick={() => navigate(s.path)}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border shadow-sm hover:bg-primary-light transition-colors"
                >
                  <Icon size={16} strokeWidth={1.6} color={s.color || "#7B5EA7"} />
                  <span className="text-xs font-body font-bold">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {CATEGORY_PILLS.map((p) => {
              const isActive = activeCat === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    if (p.route) { navigate(p.route); return; }
                    setActiveCat(p.key);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-colors ${
                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                  }`}
                >
                  <span className="mr-1">{p.emoji}</span>{p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 px-4">
          {activePill.category ? (
            <NearbyListings category={activePill.category} />
          ) : (
            <ComingSoonInline emoji={activePill.emoji} label={activePill.label} />
          )}
        </div>
      </div>

      <BottomNav onPostClick={() => (isGuest ? triggerGuestPopup() : setShowCreate(true))} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

const ComingSoonInline = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="text-center py-12 bg-card rounded-xl border border-border">
    <div className="text-5xl mb-2">{emoji}</div>
    <p className="font-heading font-bold text-base">{label} — Coming soon</p>
    <p className="text-xs text-muted-foreground mt-1 font-body">This Petosauras feature will be available soon.</p>
  </div>
);

export default NearByScreen;
