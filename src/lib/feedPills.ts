/** The 9 feed pills used on /feeds and step 3 of onboarding. */
export type FeedPillKey =
  | "reels"
  | "news"
  | "facts"
  | "adopt"
  | "walker"
  | "competition"
  | "pet_club"
  | "nearby"
  | "find_mates";

export interface FeedPill {
  key: FeedPillKey;
  emoji: string;
  label: string;
  desc: string;
}

export const FEED_PILLS: FeedPill[] = [
  { key: "reels", emoji: "🎬", label: "Reels", desc: "Trending pet reels" },
  { key: "news", emoji: "📰", label: "News", desc: "Pet news in your state" },
  { key: "facts", emoji: "⭐", label: "Facts", desc: "Daily pet facts" },
  { key: "adopt", emoji: "🐾", label: "Adopt", desc: "Pets looking for homes" },
  { key: "walker", emoji: "🚶", label: "Walker", desc: "Find a pet walker" },
  { key: "competition", emoji: "🏆", label: "Competition", desc: "Live pet contests" },
  { key: "pet_club", emoji: "🐶", label: "Pet Club", desc: "Local pet meetups" },
  { key: "nearby", emoji: "📍", label: "Nearby", desc: "Pet-friendly places" },
  { key: "find_mates", emoji: "💕", label: "Find Mates", desc: "Mating connections" },
];

export const NEARBY_SUB_PILLS = [
  { key: "walker", emoji: "🚶", label: "Walker", query: "pet walker" },
  { key: "restaurants", emoji: "🍽️", label: "Restaurants", query: "pet friendly restaurant" },
  { key: "cafe", emoji: "☕", label: "Pet Café", query: "pet café" },
  { key: "spa", emoji: "💆", label: "Spa", query: "pet spa" },
  { key: "groomer", emoji: "✂️", label: "Groomer", query: "pet grooming" },
  { key: "parks", emoji: "🌳", label: "Parks", query: "dog park" },
  { key: "shows", emoji: "🎪", label: "Pet Shows", query: "pet show" },
  { key: "boarding", emoji: "🏠", label: "Boarding", query: "pet boarding" },
  { key: "stray", emoji: "🐾", label: "Help Stray", query: "animal shelter" },
  { key: "lost_found", emoji: "🚨", label: "Lost & Found", query: "" },
] as const;

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
