import { useState } from "react";
import { ArrowLeft, MapPin, Search, Star, Phone, Clock, ExternalLink, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trackEvent } from "@/lib/analytics";

interface VetClinic {
  name: string; address: string; phone: string; rating: number;
  user_ratings_total: number; reviews: any[]; is_open: boolean;
  place_id: string; distance_km: number; lat: number; lng: number;
}

const VetNearMeScreen = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"location" | "search">("location");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [staticMapUrl, setStaticMapUrl] = useState("");
  const [apiNotConfigured, setApiNotConfigured] = useState(false);

  const fetchVets = async (body: any) => {
    setLoading(true);
    setError("");
    setSearched(true);
    setApiNotConfigured(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-nearby-vets", { body });
      if (fnError) throw fnError;
      if (data?.error) {
        if (data.error.includes("not configured") || data.error.includes("API key")) {
          setApiNotConfigured(true);
          return;
        }
        throw new Error(data.error);
      }
      setResults(data.clinics || []);
      if (data.staticMapUrl) setStaticMapUrl(data.staticMapUrl);
    } catch (e: any) {
      setError(e.message || "Unable to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); setMode("search"); return; }
    trackEvent("vet_search_initiated", { search_type: "gps" });
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchVets({ lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 5000 }),
      () => { setError("Location access denied. Please search by PIN code or city instead."); setMode("search"); }
    );
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    trackEvent("vet_search_initiated", { search_type: "manual" });
    fetchVets({ query: query.trim() });
  };

  const openGoogleMapsFallback = () => {
    const searchQuery = query.trim() || "my location";
    window.open(`https://www.google.com/maps/search/veterinary+clinic+near+${encodeURIComponent(searchQuery)}+India`, "_blank");
  };

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        <header className="sticky top-14 bg-background/80 backdrop-blur-lg z-30 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/health")}><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-heading font-bold text-lg">Vet Near Me</h1>
          </div>
          {results.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowMap(!showMap)}>
              <Map className="w-4 h-4 mr-1" />{showMap ? "List" : "Map"}
            </Button>
          )}
        </header>

        <div className="flex gap-2 my-4">
          <button onClick={() => setMode("location")}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-full transition-colors ${mode === "location" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            📍 Use My Location
          </button>
          <button onClick={() => setMode("search")}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-full transition-colors ${mode === "search" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            🔍 Search by PIN / City
          </button>
        </div>

        {mode === "location" ? (
          <Button className="w-full mb-4" onClick={handleGeolocate} disabled={loading}>
            {loading ? "Finding vets..." : "Find Vets Near Me"}
          </Button>
        ) : (
          <div className="flex gap-2 mb-4">
            <Input placeholder="Enter PIN code or city name" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            <Button onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /></Button>
          </div>
        )}

        {apiNotConfigured && (
          <div className="text-center py-8 paw-card p-6">
            <span className="text-4xl block mb-3">🔧</span>
            <p className="text-sm text-muted-foreground mb-3">Google Maps API is not configured yet. Vet search will be available soon.</p>
            <Button variant="outline" onClick={openGoogleMapsFallback}>
              <ExternalLink className="w-4 h-4 mr-1" /> Search on Google Maps →
            </Button>
          </div>
        )}

        {error && !apiNotConfigured && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => { setError(""); setSearched(false); }}>Try Again</Button>
              <Button variant="outline" size="sm" onClick={openGoogleMapsFallback}>
                <ExternalLink className="w-3 h-3 mr-1" /> Search on Google Maps
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="paw-card p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !apiNotConfigured && showMap && staticMapUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border">
            <img src={staticMapUrl} alt="Map view" className="w-full" />
          </div>
        )}

        {!loading && !error && !apiNotConfigured && results.length > 0 && (
          <div className="space-y-3">
            {results.map((clinic) => (
              <div key={clinic.place_id} className="paw-card p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-heading font-bold text-sm flex-1">🏥 {clinic.name}</h3>
                  {clinic.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{clinic.rating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{clinic.address} · {clinic.distance_km.toFixed(1)} km away
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{clinic.is_open ? <span className="text-secondary">Open now</span> : "Closed"}
                  </span>
                  {clinic.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{clinic.phone}</span>}
                </div>
                <Collapsible>
                  <CollapsibleTrigger className="text-xs text-primary font-medium mt-2 block">Tap to see reviews ▼</CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {clinic.reviews?.length > 0 ? clinic.reviews.slice(0, 3).map((r: any, i: number) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{r.author_name}</span>
                          <span className="flex items-center text-amber-500">
                            {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-current" />)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.text}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No reviews available</p>}
                  </CollapsibleContent>
                </Collapsible>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}&query_place_id=${clinic.place_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2">
                  Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !apiNotConfigured && searched && results.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm text-muted-foreground mb-3">No veterinary clinics found within 5km. Try searching by city name instead.</p>
            <Button variant="outline" size="sm" onClick={openGoogleMapsFallback}>
              <ExternalLink className="w-3 h-3 mr-1" /> Search on Google Maps
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default VetNearMeScreen;
