import { supabase } from "@/integrations/supabase/client";

export const NEARBY_CITY_OPTIONS = [
  "Chennai", "Bengaluru", "Mumbai", "Pune", "Delhi NCR",
  "Hyderabad", "Goa", "Kolkata", "Ahmedabad", "Kochi",
];

const CITY_KEY = "petosauras_nearby_selected_city";
const DENIED_KEY = "petosauras_location_denied";

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  chennai: "Chennai",
  madras: "Chennai",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  thane: "Mumbai",
  pune: "Pune",
  delhi: "Delhi NCR",
  "new delhi": "Delhi NCR",
  gurgaon: "Delhi NCR",
  gurugram: "Delhi NCR",
  noida: "Delhi NCR",
  ghaziabad: "Delhi NCR",
  faridabad: "Delhi NCR",
  hyderabad: "Hyderabad",
  secunderabad: "Hyderabad",
  goa: "Goa",
  panaji: "Goa",
  margao: "Goa",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  ahmedabad: "Ahmedabad",
  kochi: "Kochi",
  cochin: "Kochi",
  ernakulam: "Kochi",
};

export function normalizeCity(raw?: string | null): string | null {
  if (!raw) return null;
  const lc = raw.toLowerCase().trim();
  if (NEARBY_CITY_OPTIONS.includes(raw)) return raw;
  const k = Object.keys(CITY_ALIASES).find((k) => lc.includes(k));
  return k ? CITY_ALIASES[k] : null;
}

export function getStoredCity(): string | null {
  try { return localStorage.getItem(CITY_KEY); } catch { return null; }
}
export function setStoredCity(city: string) {
  try { localStorage.setItem(CITY_KEY, city); } catch {}
}
export function isLocationDenied(): boolean {
  try { return localStorage.getItem(DENIED_KEY) === "true"; } catch { return false; }
}
export function markLocationDenied() {
  try { localStorage.setItem(DENIED_KEY, "true"); } catch {}
}

/** Resolve initial city using priority: profile > localStorage > fallback Chennai. */
export function resolveInitialCity(profileCity?: string | null): string {
  return normalizeCity(profileCity) || getStoredCity() || "Chennai";
}

/** Try browser geolocation -> reverse geocode -> mapped city. Returns null if unavailable/denied. */
export async function detectCityViaGeolocation(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  if (isLocationDenied()) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, maximumAge: 600000 })
    );
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const j = await res.json();
    const a = j?.address || {};
    const raw = a.city || a.town || a.village || a.county || a.state_district || a.state;
    return normalizeCity(raw);
  } catch {
    markLocationDenied();
    return null;
  }
}

/** Persist detected city back to user profile (best-effort). */
export async function persistCityToProfile(userId: string, city: string, state?: string | null) {
  try {
    await supabase.from("profiles").update({ city, ...(state ? { state } : {}) }).eq("id", userId);
  } catch {}
}
