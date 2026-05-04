import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, MessageCircle, Globe, ExternalLink, Star, Plus, ShieldCheck } from "lucide-react";
import { buildDirectionsUrl, NearbyCategory, NormalizedListing, seedListingId, trackNearby } from "@/lib/nearbyHelpers";
import seedSpa from "@/data/spaGroomingSeed.json";
import seedParksBoarding from "@/data/petParksBoardingSeed.json";
import seedVets from "@/data/vetsSeed.json";
import seedPetRestaurants from "@/data/petRestaurantsSeed.json";
import NearbyCommentsSheet from "./NearbyCommentsSheet";
import NearbyRatingSheet from "./NearbyRatingSheet";
import AddNearbyListingSheet from "./AddNearbyListingSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  NEARBY_CITY_OPTIONS,
  detectCityViaGeolocation,
  getStoredCity,
  isLocationDenied,
  persistCityToProfile,
  resolveInitialCity,
  setStoredCity,
} from "@/lib/nearbyCity";
import { Locate } from "lucide-react";

interface Props {
  category: Exclude<NearbyCategory, "pet_restaurant">;
}

const TITLES: Record<Props["category"], { title: string; subtitle: string; emoji: string }> = {
  spa_grooming: { title: "Spa & Grooming", subtitle: "Find pet spas, salons and groomers near you", emoji: "💆" },
  pet_park: { title: "Pet Parks", subtitle: "Discover parks where pets can play", emoji: "🌳" },
  pet_show: { title: "Pet Shows", subtitle: "Upcoming pet events and shows", emoji: "🎪" },
  boarding: { title: "Boarding", subtitle: "Trusted boarding for your pet", emoji: "🏠" },
  help_stray: { title: "Help Stray", subtitle: "Help requests for stray animals", emoji: "🐾" },
  lost_found: { title: "Lost & Found", subtitle: "Help reunite lost pets with families", emoji: "🚨" },
  vets: { title: "Vets", subtitle: "Find veterinarians near you", emoji: "🩺" },
  pet_restaurants: { title: "Pet Restaurants", subtitle: "Discover pet-friendly restaurants near you", emoji: "🍽️" },
};

function normalizeSpaSeed(records: any[]): NormalizedListing[] {
  return records.map((r) => ({
    id: seedListingId([r.source?.source_name, r.name, r.city, r.locality]),
    isDb: false,
    category: "spa_grooming",
    title: r.name,
    description: r.pet_acceptance?.notes || null,
    city: r.city,
    state: r.state,
    locality: r.locality,
    address: r.address,
    latitude: null,
    longitude: null,
    imageUrl: r.image?.image_url || null,
    rating: r.rating ?? null,
    ratingCount: r.review_count ?? null,
    petAcceptance: r.pet_acceptance?.accepted_pet_types || [],
    isVerified: !!r.is_verified,
    source: r.source?.source_name || null,
    sourceUrl: r.source?.source_url || null,
    metadata: { data_confidence: r.data_confidence, sub_category: r.category },
  } as NormalizedListing));
}

function petAcceptanceList(pa: any): string[] {
  if (!pa) return [];
  if (Array.isArray(pa)) return pa;
  const out: string[] = [];
  if (pa.dogs) out.push("Dogs");
  if (pa.cats) out.push("Cats");
  if (pa.birds) out.push("Birds");
  if (pa.small_pets) out.push("Small Pets");
  if (pa.reptiles) out.push("Reptiles");
  return out;
}

function normalizeParksBoardingSeed(records: any[], cat: "pet_park" | "boarding"): NormalizedListing[] {
  return records.filter((r) => r.category === cat && r.is_active !== false).map((r) => ({
    id: seedListingId([r.source_name, r.name, r.city, r.locality]),
    isDb: false,
    category: cat,
    title: r.name,
    description: r.notes || r.pet_acceptance?.acceptance_notes || null,
    city: r.city,
    state: r.state,
    locality: r.locality,
    address: r.address || r.location_for_direction,
    latitude: r.latitude,
    longitude: r.longitude,
    imageUrl: r.image_url || null,
    rating: r.rating ?? null,
    ratingCount: r.review_count ?? null,
    petAcceptance: petAcceptanceList(r.pet_acceptance),
    isVerified: !!r.is_verified,
    source: r.source_name || null,
    sourceUrl: r.source_url || r.image_source_url || null,
    metadata: { data_confidence: r.data_confidence, location_for_direction: r.location_for_direction },
  } as NormalizedListing));
}

function normalizeVetsSeed(records: any[]): NormalizedListing[] {
  return records.map((r) => ({
    id: seedListingId(["vets", r.id || r.name, r.city, r.location]),
    isDb: false,
    category: "vets",
    title: r.name,
    description: r.description || null,
    city: r.city,
    state: r.state,
    locality: r.location,
    address: r.address,
    latitude: r.lat ?? null,
    longitude: r.lng ?? null,
    phone: r.phone || null,
    website: r.website || null,
    imageUrl: r.image_url || null,
    rating: r.rating ?? null,
    ratingCount: r.review_count ?? null,
    petAcceptance: r.pet_types_supported || [],
    isVerified: r.verification_status === "verified",
    source: r.source || "seed_json",
    sourceUrl: r.google_maps_url || null,
    metadata: {
      services: r.services,
      emergency_available: r.emergency_available,
      home_visit: r.home_visit,
      online_consultation: r.online_consultation,
    },
  } as NormalizedListing));
}

function normalizePetRestaurantsSeed(records: any[]): NormalizedListing[] {
  return records.map((r) => ({
    id: seedListingId(["pet_restaurants", r.id || r.name, r.city, r.location]),
    isDb: false,
    category: "pet_restaurants",
    title: r.name,
    description: r.description || null,
    city: r.city,
    state: r.state,
    locality: r.location,
    address: r.address,
    latitude: r.lat ?? null,
    longitude: r.lng ?? null,
    phone: r.phone || null,
    website: r.website || null,
    imageUrl: r.image_url || null,
    rating: r.rating ?? null,
    ratingCount: r.review_count ?? null,
    petAcceptance: r.best_for || [],
    isVerified: r.verification_status === "verified",
    source: r.source || "seed_json",
    sourceUrl: r.google_maps_url || null,
    metadata: {
      pet_menu: r.pet_menu,
      play_area: r.play_area,
      off_leash: r.off_leash,
      outdoor_seating: r.outdoor_seating,
      water_bowl_available: r.water_bowl_available,
      pet_comfort_index: r.pet_comfort_index,
    },
  } as NormalizedListing));
}

function normalizeDbRow(row: any): NormalizedListing {
  return {
    id: row.id,
    isDb: true,
    category: row.category,
    title: row.title,
    description: row.description,
    city: row.city,
    state: row.state,
    locality: row.locality,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp,
    website: row.website,
    imageUrl: row.image_url,
    rating: row.rating,
    ratingCount: row.rating_count,
    commentCount: row.comment_count,
    source: row.source,
    sourceUrl: row.metadata?.source_url || null,
    isVerified: row.metadata?.is_verified || false,
    petAcceptance: row.metadata?.pet_acceptance || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

const CITY_OPTIONS = ["All", ...NEARBY_CITY_OPTIONS];

const NearbyListings = ({ category }: Props) => {
  const meta = TITLES[category];
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [city, setCity] = useState<string>(() => resolveInitialCity(profile?.city));
  const [dbRows, setDbRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [commentFor, setCommentFor] = useState<NormalizedListing | null>(null);
  const [rateFor, setRateFor] = useState<NormalizedListing | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-detect city once on mount if no profile city and no stored city
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (profile?.city) return;
      if (getStoredCity()) return;
      if (isLocationDenied()) return;
      const detected = await detectCityViaGeolocation();
      if (cancelled || !detected) return;
      setCity(detected);
      setStoredCity(detected);
      trackNearby("nearby_city_autodetected", { city: detected, category });
      if (user?.id) persistCityToProfile(user.id, detected);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCityChange = (next: string) => {
    setCity(next);
    if (next !== "All") setStoredCity(next);
    trackNearby("nearby_city_changed", { city: next, category });
  };

  const retryLocation = async () => {
    try { localStorage.removeItem("petosauras_location_denied"); } catch {}
    const detected = await detectCityViaGeolocation();
    if (detected) {
      setCity(detected);
      setStoredCity(detected);
      if (user?.id) persistCityToProfile(user.id, detected);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("nearby_listings")
          .select("*")
          .eq("category", category)
          .eq("status", "active")
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false });
        if (!active) return;
        if (error) throw error;
        setDbRows(data || []);
        setUsingFallback(false);
      } catch {
        setDbRows([]);
        setUsingFallback(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [category, refreshKey]);

  useEffect(() => {
    trackNearby("nearby_category_clicked", { category });
    if (category === "spa_grooming") trackNearby("nearby_spa_grooming_opened");
    if (category === "pet_park") trackNearby("nearby_pet_parks_opened");
    if (category === "boarding") trackNearby("nearby_boarding_opened");
  }, [category]);

  const merged = useMemo<NormalizedListing[]>(() => {
    const dbItems = dbRows.map(normalizeDbRow);
    let seedItems: NormalizedListing[] = [];
    if (category === "spa_grooming") {
      seedItems = normalizeSpaSeed((seedSpa as any).records || []);
    } else if (category === "pet_park" || category === "boarding") {
      seedItems = normalizeParksBoardingSeed((seedParksBoarding as any).records || [], category);
    } else if (category === "vets") {
      seedItems = normalizeVetsSeed((seedVets as any).places || []);
    } else if (category === "pet_restaurants") {
      seedItems = normalizePetRestaurantsSeed((seedPetRestaurants as any).places || []);
    }
    const dbKey = new Set(dbItems.map((x) => `${x.title.toLowerCase()}|${x.city.toLowerCase()}`));
    const filteredSeeds = seedItems.filter((s) => !dbKey.has(`${s.title.toLowerCase()}|${s.city.toLowerCase()}`));
    let all = [...dbItems, ...filteredSeeds];
    if (city !== "All") all = all.filter((x) => x.city.toLowerCase().includes(city.toLowerCase()) || (city === "Delhi NCR" && /delhi|gurgaon|noida|gurugram/i.test(x.city)) || (city === "Bengaluru" && /bangalore/i.test(x.city)));
    all.sort((a, b) => Number(!!b.isVerified) - Number(!!a.isVerified) || (Number(b.rating || 0) - Number(a.rating || 0)));
    return all;
  }, [dbRows, category, city]);

  const onDirections = (l: NormalizedListing) => {
    trackNearby("nearby_direction_clicked", { category });
    if (category === "pet_park") trackNearby("nearby_pet_park_direction_clicked");
    if (category === "boarding") trackNearby("nearby_boarding_direction_clicked");
    window.open(buildDirectionsUrl(l), "_blank", "noopener");
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base">{meta.emoji} {meta.title}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          {isLocationDenied() && (
            <button onClick={retryLocation} title="Use current location" className="text-primary p-1">
              <Locate size={14} />
            </button>
          )}
          <select
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="text-xs font-body font-bold bg-transparent border-0 px-2 py-1.5 cursor-pointer outline-none text-primary"
          >
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={() => { trackNearby("nearby_plus_clicked", { category }); setShowAdd(true); }}
        className="w-full mb-3 h-11 rounded-full bg-primary-light text-primary text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Plus size={16} /> Add {meta.title}
      </button>

      {usingFallback && (
        <p className="text-[11px] text-muted-foreground mb-2 text-center">Showing cached Petosauras listings.</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-[22px] p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : merged.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-2 opacity-60">{meta.emoji}</div>
          <p className="text-sm font-heading font-bold">No {meta.title.toLowerCase()} listings yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to add one for your city!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {merged.map((l) => (
            <article key={l.id} className="bg-card rounded-[22px] overflow-hidden border border-border shadow-sm">
              {l.imageUrl ? (
                <img src={l.imageUrl} alt={l.title} loading="lazy" className="w-full h-40 object-cover bg-muted" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-primary-light to-secondary/20 flex items-center justify-center">
                  <span className="text-5xl opacity-70">{meta.emoji}</span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-sm truncate flex items-center gap-1">
                      {l.title}
                      {l.isVerified && <ShieldCheck size={14} className="text-primary shrink-0" />}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-body truncate">
                      {[l.locality, l.city, l.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {l.rating != null ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-body font-bold text-foreground bg-muted px-2 py-1 rounded-full">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      {Number(l.rating).toFixed(1)}{l.ratingCount ? ` (${l.ratingCount})` : ""}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Rating not available</span>
                  )}
                </div>
                {l.description && <p className="text-xs text-muted-foreground font-body line-clamp-2">{l.description}</p>}
                {!!l.petAcceptance?.length && (
                  <div className="flex flex-wrap gap-1">
                    {l.petAcceptance!.map((p) => (
                      <span key={p} className="text-[10px] bg-secondary-light text-secondary-foreground px-2 py-0.5 rounded-full font-body">{p}</span>
                    ))}
                  </div>
                )}
                {!l.petAcceptance?.length && l.category === "spa_grooming" && (
                  <p className="text-[10px] text-muted-foreground italic">Pet acceptance to be confirmed</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => onDirections(l)} className="text-xs font-body font-bold text-primary inline-flex items-center gap-1 hover:underline">
                    <MapPin size={12} /> Direction
                  </button>
                  {l.phone && (
                    <a href={`tel:${l.phone}`} onClick={() => trackNearby("nearby_call_clicked", { category })} className="text-xs font-body font-bold text-primary inline-flex items-center gap-1 hover:underline">
                      <Phone size={12} /> Call
                    </a>
                  )}
                  {l.whatsapp && (
                    <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" onClick={() => trackNearby("nearby_whatsapp_clicked", { category })} className="text-xs font-body font-bold text-green-700 inline-flex items-center gap-1 hover:underline">
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  )}
                  {l.website && (
                    <a href={l.website} target="_blank" rel="noopener" className="text-xs font-body font-bold text-primary inline-flex items-center gap-1 hover:underline">
                      <Globe size={12} /> Website
                    </a>
                  )}
                  {l.sourceUrl && (
                    <a href={l.sourceUrl} target="_blank" rel="noopener" onClick={() => trackNearby("nearby_source_clicked", { category })} className="text-xs font-body text-muted-foreground inline-flex items-center gap-1 hover:underline">
                      <ExternalLink size={12} /> Source
                    </a>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => setCommentFor(l)} className="flex-1 text-xs font-heading font-bold py-2 rounded-full bg-muted hover:bg-primary-light hover:text-primary">💬 Comment</button>
                  <button onClick={() => setRateFor(l)} className="flex-1 text-xs font-heading font-bold py-2 rounded-full bg-muted hover:bg-primary-light hover:text-primary">⭐ Rate</button>
                </div>
                {!l.isDb && (
                  <p className="text-[10px] text-muted-foreground italic">Listing information may change. Please call before visiting.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {commentFor && <NearbyCommentsSheet listing={commentFor} open={!!commentFor} onClose={() => setCommentFor(null)} />}
      {rateFor && <NearbyRatingSheet listing={rateFor} open={!!rateFor} onClose={() => setRateFor(null)} onRated={() => setRefreshKey((k) => k + 1)} />}
      {showAdd && <AddNearbyListingSheet open={showAdd} initialCategory={category} onClose={() => setShowAdd(false)} onCreated={() => setRefreshKey((k) => k + 1)} />}
    </div>
  );
};

export default NearbyListings;
