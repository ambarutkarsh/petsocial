import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, MessageCircle, Globe, ExternalLink, Star, Plus, ShieldCheck } from "lucide-react";
import { buildDirectionsUrl, NearbyCategory, NormalizedListing, seedListingId, trackNearby } from "@/lib/nearbyHelpers";
import seedSpa from "@/data/spaGroomingSeed.json";
import NearbyCommentsSheet from "./NearbyCommentsSheet";
import NearbyRatingSheet from "./NearbyRatingSheet";
import AddNearbyListingSheet from "./AddNearbyListingSheet";

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

const CITY_OPTIONS = ["All", "Chennai", "Bengaluru", "Mumbai", "Pune", "Delhi NCR", "Hyderabad", "Goa", "Kolkata", "Ahmedabad", "Kochi"];

const NearbyListings = ({ category }: Props) => {
  const meta = TITLES[category];
  const [city, setCity] = useState<string>("All");
  const [dbRows, setDbRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [commentFor, setCommentFor] = useState<NormalizedListing | null>(null);
  const [rateFor, setRateFor] = useState<NormalizedListing | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [category]);

  const merged = useMemo<NormalizedListing[]>(() => {
    const dbItems = dbRows.map(normalizeDbRow);
    const seedItems = category === "spa_grooming" ? normalizeSpaSeed((seedSpa as any).records || []) : [];
    // Dedupe seed items if a DB row has the same title+city
    const dbKey = new Set(dbItems.map((x) => `${x.title.toLowerCase()}|${x.city.toLowerCase()}`));
    const filteredSeeds = seedItems.filter((s) => !dbKey.has(`${s.title.toLowerCase()}|${s.city.toLowerCase()}`));
    let all = [...dbItems, ...filteredSeeds];
    if (city !== "All") all = all.filter((x) => x.city.toLowerCase().includes(city.toLowerCase()) || (city === "Delhi NCR" && /delhi|gurgaon|noida|gurugram/i.test(x.city)));
    // sort: verified -> rating -> newer
    all.sort((a, b) => Number(!!b.isVerified) - Number(!!a.isVerified) || (Number(b.rating || 0) - Number(a.rating || 0)));
    return all;
  }, [dbRows, category, city]);

  const onDirections = (l: NormalizedListing) => {
    trackNearby("nearby_direction_clicked", { category });
    window.open(buildDirectionsUrl(l), "_blank", "noopener");
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base">{meta.emoji} {meta.title}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{meta.subtitle}</p>
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="text-xs font-body font-bold bg-transparent border-0 px-2 py-1.5 cursor-pointer outline-none text-primary"
        >
          {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
