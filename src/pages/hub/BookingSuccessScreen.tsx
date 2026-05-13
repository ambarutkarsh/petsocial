import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { VerifiedIcon } from "@/components/icons/PetosauraIcons";

import { useQuery } from "@tanstack/react-query";

import HubSubLayout from "@/components/HubSubLayout";
import { supabase } from "@/integrations/supabase/client";
import { trackBookVet } from "@/lib/analytics";

const BookingSuccessScreen = () => {
  const [params] = useSearchParams();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const ref = params.get("ref");
  const navigate = useNavigate();
  const location = useLocation();
  const stateWa = (location.state as { whatsapp_link?: string | null } | null)?.whatsapp_link ?? null;

  const { data: booking } = useQuery({
    queryKey: ["booking-by-ref", bookingId ?? ref],
    enabled: !!(bookingId || ref),
    queryFn: async () => {
      let q = supabase
        .from("vet_bookings")
        .select(
          "*, vets(full_name, clinic_name, whatsapp_number, phone), pets(name), vet_slots(slot_date, start_time)",
        );
      q = bookingId ? q.eq("id", bookingId) : q.eq("booking_reference", ref!);
      const { data } = await q.maybeSingle();
      return data as any;
    },
  });

  const displayRef = booking?.booking_reference ?? ref ?? "—";

  // Fallback: build a click-to-chat link from the booking record if state didn't carry one
  const fallbackWa = (() => {
    const v = booking?.vets;
    if (!v) return null;
    const raw = String(v.whatsapp_number || v.phone || "").replace(/[^\d]/g, "");
    if (raw.length < 10) return null;
    const phone = raw.startsWith("91") ? raw : `91${raw}`;
    const msg = `Hello Dr. ${v.full_name}, regarding Petosauras booking ${displayRef}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  })();
  const whatsappLink = stateWa || fallbackWa;

  return (
    <HubSubLayout title="Booking Confirmed" emoji="🐾">
      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
          <VerifiedIcon className="w-12 h-12 text-green-600" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 font-heading font-bold text-lg">Booking request sent</h2>
        <p className="mt-1 text-xs font-body text-muted-foreground max-w-[320px]">
          The vet has been notified by email. You will get an update once the vet confirms or rejects your appointment.
        </p>
      </div>

      <div className="mt-5 paw-card divide-y divide-border">
        <div className="p-3">
          <p className="text-[10px] uppercase font-body text-muted-foreground">Booking Reference</p>
          <p className="font-heading font-bold text-base">{displayRef}</p>
        </div>
        <div className="p-3 text-xs font-body space-y-1">
          <p>🩺 Dr. {booking?.vets?.full_name ?? "—"}</p>
          <p>🏥 {booking?.vets?.clinic_name ?? "—"}</p>
          <p>📅 {booking?.vet_slots?.slot_date} at {String(booking?.vet_slots?.start_time ?? "").slice(0, 5)}</p>
          <p>🐾 Pet: {booking?.pets?.name ?? "—"}</p>
          <p>Status: ⏳ Awaiting vet confirmation</p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-xs font-body text-amber-900">
        <p className="font-heading font-bold mb-1">What happens next?</p>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>Vet will confirm by email or dashboard</li>
          <li>You'll receive a notification when confirmed</li>
          <li>Bring your pet's vaccination card</li>
          <li>Arrive 10 minutes early</li>
        </ol>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2">
        <button
          onClick={() => navigate("/mypet/health" as any)}
          className="py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm"
        >
          Back to Health
        </button>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBookVet("vet_whatsapp_click_to_chat_clicked", { booking_id: booking?.id })}
            className="py-3 rounded-full bg-card border border-border font-heading font-bold text-sm text-center"
          >
            💬 Message Vet on WhatsApp
          </a>
        )}
        <p className="text-[11px] font-body text-muted-foreground text-center mt-1">
          Manual WhatsApp message only. Confirmation happens through email or vet dashboard.
        </p>
        <button
          onClick={() => navigate("/mypet/bookings")}
          className="py-2 rounded-full text-xs font-heading font-bold text-primary"
        >
          View My Bookings
        </button>
      </div>
    </HubSubLayout>
  );
};

export default BookingSuccessScreen;
