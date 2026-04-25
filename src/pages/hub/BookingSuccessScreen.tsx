import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import HubSubLayout from "@/components/HubSubLayout";
import { supabase } from "@/integrations/supabase/client";

const BookingSuccessScreen = () => {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const navigate = useNavigate();

  const { data: booking } = useQuery({
    queryKey: ["booking-by-ref", ref],
    enabled: !!ref,
    queryFn: async () => {
      const { data } = await supabase
        .from("vet_bookings")
        .select("*, vets(full_name, clinic_name), pets(name), vet_slots(slot_date, start_time)")
        .eq("booking_reference", ref!)
        .single();
      return data as any;
    },
  });

  return (
    <HubSubLayout title="Booking Confirmed" emoji="🐾">
      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 font-heading font-bold text-lg">Booking Request Sent! 🐾</h2>
      </div>

      <div className="mt-5 paw-card divide-y divide-border">
        <div className="p-3">
          <p className="text-[10px] uppercase font-body text-muted-foreground">Booking Reference</p>
          <p className="font-heading font-bold text-base">{ref}</p>
        </div>
        <div className="p-3 text-xs font-body space-y-1">
          <p>🩺 Dr. {booking?.vets?.full_name ?? "—"}</p>
          <p>📅 {booking?.vet_slots?.slot_date} at {String(booking?.vet_slots?.start_time ?? "").slice(0, 5)}</p>
          <p>🏥 {booking?.vets?.clinic_name ?? "—"}</p>
          <p>🐾 Pet: {booking?.pets?.name ?? "—"}</p>
          <p>Status: ⏳ Awaiting vet confirmation</p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-xs font-body text-amber-900">
        <p className="font-heading font-bold mb-1">What happens next?</p>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>The vet will confirm within 2 hours</li>
          <li>You'll receive a notification when confirmed</li>
          <li>Bring your pet's vaccination card</li>
          <li>Arrive 10 minutes early</li>
        </ol>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate("/my-bookings")}
          className="py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm"
        >
          View My Bookings
        </button>
        <button
          onClick={() => navigate("/hub")}
          className="py-3 rounded-full bg-card border border-border font-heading font-bold text-sm"
        >
          Back to Hub
        </button>
      </div>
    </HubSubLayout>
  );
};

export default BookingSuccessScreen;
