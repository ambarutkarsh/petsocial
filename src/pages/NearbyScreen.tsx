import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stethoscope, UtensilsCrossed, PersonStanding, Sparkles as SparklesIcon, Trees, PartyPopper, Home, PawPrint, Search, PlaneTakeoff, Truck, Car, HeartHandshake } from "lucide-react";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import NearbyListings from "@/components/nearby/NearbyListings";
import NearbyEmptyView from "@/components/nearby/NearbyEmptyView";

// Restaurants reuses the existing handcrafted PlayScreen restaurants UI is too coupled,
// so we render a NearbyListings-shaped placeholder powered by pet_friendly_places via a
// lightweight wrapper. To keep this change minimal we point Pet Restaurants at an existing
// experience by deep-linking into the legacy /play view.

const CATEGORIES = [
  { key: "vets", label: "Vets", emoji: "🩺", Icon: Stethoscope },
  { key: "pet-restaurants", label: "Pet Restaurants", emoji: "🍽️", Icon: UtensilsCrossed },
  { key: "walker", label: "Walker", emoji: "🚶", Icon: PersonStanding },
  { key: "spa-grooming", label: "Spa & Grooming", emoji: "💆", Icon: SparklesIcon },
  { key: "pet-parks", label: "Pet Parks", emoji: "🌳", Icon: Trees },
  { key: "pet-shows", label: "Pet Shows", emoji: "🎪", Icon: PartyPopper },
  { key: "boarding", label: "Boarding", emoji: "🏠", Icon: Home },
  { key: "help-stray", label: "Help Stray", emoji: "🐾", Icon: PawPrint },
  { key: "lost-found", label: "Lost & Found", emoji: "🚨", Icon: Search },
] as const;

const SERVICE_BAR = [
  { key: "petcation", label: "Petcation", path: "/hub/petcation", Icon: PlaneTakeoff },
  { key: "pet-moving", label: "Pet Moving", path: "/hub/pet-moving", Icon: Truck },
  { key: "pickup", label: "Pick & Drop", path: "/hub/pickup", Icon: Car },
  { key: "ngo", label: "NGO Connect", path: "/hub/ngo", Icon: HeartHandshake },
];

// Map URL slug → NearbyListings category enum
const CATEGORY_MAP: Record<string, "spa_grooming" | "pet_park" | "pet_show" | "boarding" | "help_stray" | "lost_found" | "vets" | "pet_restaurants"> = {
  vets: "vets",
  "pet-restaurants": "pet_restaurants",
  "spa-grooming": "spa_grooming",
  "pet-parks": "pet_park",
  "pet-shows": "pet_show",
  boarding: "boarding",
  "help-stray": "help_stray",
  "lost-found": "lost_found",
};

const ComingSoon = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="text-center py-16">
    <div className="text-6xl mb-3 opacity-70">{emoji}</div>
    <h3 className="font-heading font-bold text-lg">{label} — Coming soon</h3>
    <p className="text-sm text-muted-foreground font-body mt-1">
      This Petosauras feature will be available soon.
    </p>
  </div>
);

const NearbyScreen = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const active = category && CATEGORIES.find((c) => c.key === category) ? category : "vets";
  const [showCreate, setShowCreate] = useState(false);

  const renderContent = () => {
    if (active === "walker") {
      return (
        <NearbyEmptyView
          emoji="🚶"
          title="Walker"
          subtitle="Find trusted pet walkers near you"
          emptyTitle="No walkers found nearby"
          emptySubtitle="Try changing your location or checking again later."
        />
      );
    }
    const mapped = CATEGORY_MAP[active];
    if (mapped) return <NearbyListings category={mapped} />;
    return <NearbyEmptyView emoji="🐾" title={active} subtitle="" emptyTitle="Nothing here yet" emptySubtitle="Check back soon." />;
  };

  return (
    <MobileLayout>
      <div className="pb-32">
        <div className="px-5 pt-4 pb-2">
          <h1 className="font-heading font-bold text-xl">NearBy</h1>
          <p className="text-xs text-muted-foreground font-body">Discover pet-friendly places & services near you</p>
        </div>

        {/* Category pills */}
        <div
          className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-card border-b border-border"
          style={{ position: "sticky", top: 56, zIndex: 30 }}
        >
          {CATEGORIES.map((c) => {
            const isActive = c.key === active;
            return (
              <button
                key={c.key}
                onClick={() => navigate(`/nearby/${c.key}`)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-body font-bold transition-colors border px-3.5 py-1.5"
                style={
                  isActive
                    ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }
                    : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }
              >
                <span>{c.emoji} {c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="px-4 mt-3">{renderContent()}</div>
      </div>

      {/* Sticky service bar above bottom nav */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full px-3"
        style={{ maxWidth: 480, bottom: 72, zIndex: 999 }}
      >
        <div className="bg-card rounded-2xl border border-border shadow-petosauras-md px-2 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {SERVICE_BAR.map(({ key, label, path, Icon }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Icon size={14} strokeWidth={1.8} />
              <span className="text-[11px] font-body font-bold whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default NearbyScreen;
