/** The feed pills used on /feeds. Order here is the render order. */
export type FeedPillKey =
  | "curated"
  | "reels"
  | "news"
  | "facts"
  | "adopt"
  | "walker"
  | "competition"
  | "pet_club"
  | "find_mates";

export interface FeedPill {
  key: FeedPillKey;
  emoji: string;
  label: string;
  desc: string;
}

/** Pills excluding Curated — Curated is conditionally prepended at runtime. */
export const FEED_PILLS: FeedPill[] = [
  { key: "reels", emoji: "🎬", label: "Reels", desc: "Trending pet reels" },
  { key: "news", emoji: "📰", label: "News", desc: "Pet news in your state" },
  { key: "facts", emoji: "⭐", label: "Facts", desc: "Daily pet facts" },
  { key: "adopt", emoji: "🐾", label: "Adopt", desc: "Pets looking for homes" },
  { key: "walker", emoji: "🚶", label: "Walker", desc: "Find a pet walker" },
  { key: "competition", emoji: "🏆", label: "Competition", desc: "Live pet contests" },
  { key: "pet_club", emoji: "🐶", label: "Pet Club", desc: "Local pet meetups" },
  { key: "find_mates", emoji: "💕", label: "Find Mates", desc: "Mating connections" },
];

/** Pills eligible for the Curated multi-select editor. */
export const CURATABLE_PILLS: FeedPill[] = FEED_PILLS;


export const NEARBY_SUB_PILLS = [
  { key: "restaurants", emoji: "🍽️", label: "Pet Restaurants", query: "pet friendly restaurant" },
  { key: "spa_grooming", emoji: "💆", label: "Spa & Grooming", query: "pet spa grooming" },
  { key: "pet_park", emoji: "🌳", label: "Pet Parks", query: "dog park" },
  { key: "pet_show", emoji: "🎪", label: "Pet Shows", query: "pet show" },
  { key: "boarding", emoji: "🏠", label: "Boarding", query: "pet boarding" },
  { key: "help_stray", emoji: "🐾", label: "Help Stray", query: "animal shelter" },
  { key: "lost_found", emoji: "🚨", label: "Lost & Found", query: "" },
] as const;

/** Maps a NEARBY_SUB_PILLS key (excluding restaurants) to nearby_listings.category enum. */
export const NEARBY_CATEGORY_MAP: Record<string, "spa_grooming" | "pet_park" | "pet_show" | "boarding" | "help_stray" | "lost_found"> = {
  spa_grooming: "spa_grooming",
  pet_park: "pet_park",
  pet_show: "pet_show",
  boarding: "boarding",
  help_stray: "help_stray",
  lost_found: "lost_found",
};

export const POST_CATEGORIES = [
  { key: "reel", emoji: "🎬", label: "Reel" },
  { key: "adoption", emoji: "🐾", label: "Adopt" },
  { key: "walker", emoji: "🚶", label: "Walker" },
  { key: "competition", emoji: "🏆", label: "Competition" },
  { key: "pet_club", emoji: "🐶", label: "Pet Club" },
  { key: "lost_found", emoji: "🚨", label: "Lost & Found" },
  { key: "find_mates", emoji: "💕", label: "Find Mates" },
] as const;

export const MAX_PILL_SELECTION = 3;

const DAILY_CAP_KEY_PREFIX = "gplaces_";
export const GPLACES_DAILY_CAP = 150;

export function getGooglePlacesUsage(): number {
  if (typeof window === "undefined") return 0;
  const key = DAILY_CAP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  return parseInt(localStorage.getItem(key) || "0", 10);
}

export function incrementGooglePlacesUsage(by = 1): number {
  if (typeof window === "undefined") return 0;
  const key = DAILY_CAP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  const next = getGooglePlacesUsage() + by;
  localStorage.setItem(key, String(next));
  return next;
}

export function isGooglePlacesCapped(): boolean {
  return getGooglePlacesUsage() >= GPLACES_DAILY_CAP;
}
