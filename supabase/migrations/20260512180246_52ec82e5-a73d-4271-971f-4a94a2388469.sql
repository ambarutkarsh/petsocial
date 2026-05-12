
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_per_slot
ON public.vet_bookings(slot_id)
WHERE status IN ('pending_vet_confirmation', 'confirmed', 'completed');

CREATE INDEX IF NOT EXISTS idx_vet_bookings_vet_status
ON public.vet_bookings(vet_id, status);

CREATE INDEX IF NOT EXISTS idx_vet_slots_vet_date_status
ON public.vet_slots(vet_id, slot_date, status);
