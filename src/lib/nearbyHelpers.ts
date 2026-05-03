import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

export type NearbyCategory =
  | "pet_restaurant"
  | "spa_grooming"
  | "pet_park"
  | "pet_show"
  | "boarding"
  | "help_stray"
  | "lost_found";

export interface NormalizedListing {
  /** Stable id — UUID if from DB, otherwise deterministic slug-id. */
  id: string;
  /** True when the record lives in the `nearby_listings` table (id is a UUID). */
  isDb: boolean;
  category: NearbyCategory;
  title: string;
  description?: string | null;
  city: string;
  state?: string | null;
  locality?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  commentCount?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  isVerified?: boolean;
  petAcceptance?: string[] | null;
  metadata?: Record<string, any>;
  createdAt?: string | null;
}

/** Build a deterministic id for a JSON seed listing. */
export function seedListingId(parts: (string | null | undefined)[]): string {
  const slug = parts.filter(Boolean).join("|").toLowerCase().replace(/[^a-z0-9|]+/g, "-");
  return `seed:${slug}`;
}

export function buildDirectionsUrl(l: Pick<NormalizedListing, "latitude" | "longitude" | "address" | "city" | "title">) {
  if (l.latitude != null && l.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${l.latitude},${l.longitude}`;
  }
  const q = l.address ? `${l.address}, ${l.city}, India` : `${l.title}, ${l.city}, India`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Ensure a stable DB id for a listing — inserts the JSON seed listing into nearby_listings on first user interaction. */
export async function ensureDbListing(l: NormalizedListing, userId: string | null): Promise<string | null> {
  if (l.isDb) return l.id;
  if (!userId) return null;
  // Try to find existing (by title + city + category)
  const { data: found } = await supabase
    .from("nearby_listings")
    .select("id")
    .eq("category", l.category)
    .eq("title", l.title)
    .eq("city", l.city)
    .maybeSingle();
  if (found?.id) return found.id;
  const { data: ins, error } = await supabase
    .from("nearby_listings")
    .insert({
      user_id: userId,
      category: l.category,
      title: l.title,
      description: l.description ?? null,
      city: l.city,
      state: l.state ?? null,
      locality: l.locality ?? null,
      address: l.address ?? null,
      latitude: l.latitude ?? null,
      longitude: l.longitude ?? null,
      phone: l.phone ?? null,
      whatsapp: l.whatsapp ?? null,
      website: l.website ?? null,
      image_url: l.imageUrl ?? null,
      source: l.source || "seed_import",
      metadata: { ...(l.metadata || {}), source_url: l.sourceUrl, pet_acceptance: l.petAcceptance, is_verified: l.isVerified },
    } as any)
    .select("id")
    .single();
  if (error) return null;
  return ins?.id || null;
}

export function trackNearby(name: string, params?: Record<string, any>) {
  try { trackEvent(name, params); } catch { /* noop */ }
}
