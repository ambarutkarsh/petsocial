import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const body = await req.json();
    let { lat, lng, radius = 5000 } = body;

    // Geocode if query provided
    if (body.query) {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.query + " India")}&key=${GOOGLE_PLACES_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        return new Response(JSON.stringify({ clinics: [], error: "Could not find location" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      lat = geoData.results[0].geometry.location.lat;
      lng = geoData.results[0].geometry.location.lng;
    }

    // Nearby search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=veterinary_care&key=${GOOGLE_PLACES_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const places = (searchData.results || []).slice(0, 10);

    // Fetch details for each
    const clinics = await Promise.all(
      places.map(async (p: any) => {
        try {
          const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,rating,user_ratings_total,reviews,opening_hours,formatted_phone_number,geometry&key=${GOOGLE_PLACES_API_KEY}`;
          const detRes = await fetch(detUrl);
          const detData = await detRes.json();
          const d = detData.result || {};
          const cLat = d.geometry?.location?.lat || p.geometry?.location?.lat;
          const cLng = d.geometry?.location?.lng || p.geometry?.location?.lng;
          return {
            name: d.name || p.name,
            address: d.formatted_address || p.vicinity || "",
            phone: d.formatted_phone_number || "",
            rating: d.rating || p.rating || 0,
            user_ratings_total: d.user_ratings_total || p.user_ratings_total || 0,
            reviews: (d.reviews || []).slice(0, 5),
            is_open: d.opening_hours?.open_now ?? p.opening_hours?.open_now ?? false,
            place_id: p.place_id,
            distance_km: haversine(lat, lng, cLat, cLng),
            lat: cLat,
            lng: cLng,
          };
        } catch {
          return {
            name: p.name,
            address: p.vicinity || "",
            phone: "",
            rating: p.rating || 0,
            user_ratings_total: p.user_ratings_total || 0,
            reviews: [],
            is_open: p.opening_hours?.open_now ?? false,
            place_id: p.place_id,
            distance_km: haversine(lat, lng, p.geometry?.location?.lat, p.geometry?.location?.lng),
            lat: p.geometry?.location?.lat,
            lng: p.geometry?.location?.lng,
          };
        }
      })
    );

    clinics.sort((a, b) => a.distance_km - b.distance_km);

    // Static map URL
    const markers = clinics.map((c) => `${c.lat},${c.lng}`).join("|");
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=13&size=680x300&markers=color:red|${markers}&key=${GOOGLE_PLACES_API_KEY}`;

    return new Response(JSON.stringify({ clinics, staticMapUrl, lat, lng }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, clinics: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
