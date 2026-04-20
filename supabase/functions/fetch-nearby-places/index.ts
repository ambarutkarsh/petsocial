// Generic Google Places nearby search
// Supports types like: pet_store, park, veterinary_care, cafe (with keywords)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured", places: [] }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    let { lat, lng, type = "pet_store", keyword = "", radius = 5000, query = "" } = body || {};

    // Geocode "query" if no coords
    if ((!lat || !lng) && query) {
      const geo = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + ", India")}&key=${apiKey}`,
      );
      const gd = await geo.json();
      const loc = gd?.results?.[0]?.geometry?.location;
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
      }
    }

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: "Need lat/lng or query", places: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", String(radius));
    if (type) url.searchParams.set("type", type);
    if (keyword) url.searchParams.set("keyword", keyword);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    const results = (data.results || []).slice(0, 12);

    const places = results.map((p: any) => ({
      place_id: p.place_id,
      name: p.name,
      address: p.vicinity || "",
      rating: p.rating || 0,
      user_ratings_total: p.user_ratings_total || 0,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      distance_km: p.geometry?.location ? haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng) : 0,
      is_open: p.opening_hours?.open_now ?? null,
    })).sort((a: any, b: any) => a.distance_km - b.distance_km);

    return new Response(JSON.stringify({ places, lat, lng }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), places: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
