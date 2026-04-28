import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { LocationPinIcon } from "@/components/icons/PetosauraIcons";
import HubSubLayout from "@/components/HubSubLayout";

const HELPLINES = [
  { name: "Blue Cross India", phone: "044-22350170" },
  { name: "PETA India Helpline", phone: "1800-200-9732" },
  { name: "Friendicoes (Delhi)", phone: "011-26432020" },
];

const SosScreen = () => {
  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState<any[]>([]);

  const findEmergencyVet = async () => {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      const { data, error } = await supabase.functions.invoke("fetch-nearby-places", {
        body: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          type: "veterinary_care",
          keyword: "emergency",
          radius: 10000,
        },
      });
      if (error) throw error;
      setVets((data?.places || []).slice(0, 3));
      if (!data?.places?.length) toast.info("No emergency vets found in 10km");
    } catch {
      toast.error("Could not get location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HubSubLayout title="Emergency" emoji="🚑">
      <div className="space-y-4">
        <div className="paw-card p-6 text-center bg-destructive/5 border-destructive/30">
          <button
            onClick={findEmergencyVet}
            disabled={loading}
            className="w-32 h-32 rounded-full bg-destructive text-destructive-foreground mx-auto flex items-center justify-center font-heading font-extrabold text-xl shadow-[0_8px_32px_rgba(255,75,75,0.4)] active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "SOS"}
          </button>
          <p className="text-sm font-heading font-bold text-destructive mt-3">
            Find Emergency Vet Now
          </p>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Tap to find nearest 24-hour vet
          </p>
        </div>

        {vets.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm">Nearest emergency vets</h3>
            {vets.map((v) => (
              <div key={v.place_id} className="paw-card p-3">
                <p className="font-heading font-bold text-sm">{v.name}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {v.address} · {v.distance_km} km
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}&query_place_id=${v.place_id}`,
                        "_blank"
                      )
                    }
                  >
                    <LocationPinIcon className="w-4 h-4" /> Directions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <h3 className="font-heading font-bold text-sm mb-2">📞 24-Hour Helplines</h3>
          <div className="space-y-2">
            {HELPLINES.map((h) => (
              <a
                key={h.phone}
                href={`tel:${h.phone}`}
                className="paw-card p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center text-success">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm">{h.name}</p>
                  <p className="text-xs text-primary font-body font-bold">{h.phone}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </HubSubLayout>
  );
};

export default SosScreen;
