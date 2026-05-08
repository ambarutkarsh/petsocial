import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Stethoscope, UtensilsCrossed, PersonStanding, Sparkles as SparklesIcon, Trees, PartyPopper, Home, PlaneTakeoff, Truck, Car, HeartHandshake } from "lucide-react";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import NearbyListings from "@/components/nearby/NearbyListings";
import NearbyEmptyView from "@/components/nearby/NearbyEmptyView";

type TopTab = "services" | "places";

const SERVICES_CATEGORIES = [
  { key: "vets", label: "Vets", emoji: "🩺", Icon: Stethoscope },
  { key: "boarding", label: "Boarding", emoji: "🏠", Icon: Home },
  { key: "spa-grooming", label: "Spa & Grooming", emoji: "💆", Icon: SparklesIcon },
  { key: "walker", label: "Walker", emoji: "🚶", Icon: PersonStanding },
] as const;

const PLACES_CATEGORIES = [
  { key: "pet-restaurants", label: "Restaurants & Cafés", emoji: "🍽️", Icon: UtensilsCrossed },
  { key: "pet-parks", label: "Pet Parks", emoji: "🌳", Icon: Trees },
  { key: "pet-shows", label: "Pet Shows", emoji: "🎪", Icon: PartyPopper },
] as const;

const SERVICE_BAR = [
  { key: "petcation", label: "Petcation", path: "/hub/petcation", Icon: PlaneTakeoff },
  { key: "pet-moving", label: "Pet Moving", path: "/hub/pet-moving", Icon: Truck },
  { key: "pickup", label: "Pick & Drop", path: "/hub/pickup", Icon: Car },
  { key: "ngo", label: "NGO Connect", path: "/hub/ngo", Icon: HeartHandshake },
];

const CATEGORY_MAP: Record<string, "spa_grooming" | "pet_park" | "pet_show" | "boarding" | "vets" | "pet_restaurants"> = {
  vets: "vets",
  "pet-restaurants": "pet_restaurants",
  "spa-grooming": "spa_grooming",
  "pet-parks": "pet_park",
  "pet-shows": "pet_show",
  boarding: "boarding",
};

const ALL_KEYS = [...SERVICES_CATEGORIES, ...PLACES_CATEGORIES].map((c) => c.key);

const NearbyScreen = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  // Determine current top tab from query string OR infer from category slug.
  const tabFromQuery = (searchParams.get("tab") as TopTab | null) || null;
  const inferredTab: TopTab = useMemo(() => {
    if (tabFromQuery === "services" || tabFromQuery === "places") return tabFromQuery;
    if (category && PLACES_CATEGORIES.some((c) => c.key === category)) return "places";
    return "services";
  }, [tabFromQuery, category]);

  const [tab, setTab] = useState<TopTab>(inferredTab);
  const activeCategoryList = tab === "services" ? SERVICES_CATEGORIES : PLACES_CATEGORIES;

  // Active category: use URL slug if it belongs to current tab; else default to first in tab.
  const active =
    category && activeCategoryList.some((c) => c.key === category)
      ? category
      : activeCategoryList[0].key;

  const switchTab = (next: TopTab) => {
    setTab(next);
    const firstKey = (next === "services" ? SERVICES_CATEGORIES : PLACES_CATEGORIES)[0].key;
    setSearchParams({ tab: next }, { replace: true });
    navigate(`/nearby/${firstKey}?tab=${next}`, { replace: true });
  };

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

        {/* Top tabs: Services / Pet Friendly Places */}
        <div className="px-4 pt-2 pb-1 flex gap-2 bg-background sticky top-0 z-40">
          {([
            { key: "services" as TopTab, label: "Services" },
            { key: "places" as TopTab, label: "Pet Friendly Places" },
          ]).map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-body font-bold border transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-petosauras"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Sub-category pills */}
        <div
          className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-card border-b border-border"
          style={{ position: "sticky", top: 56, zIndex: 30 }}
        >
          {activeCategoryList.map((c) => {
            const isActive = c.key === active;
            return (
              <button
                key={c.key}
                onClick={() => navigate(`/nearby/${c.key}?tab=${tab}`)}
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
