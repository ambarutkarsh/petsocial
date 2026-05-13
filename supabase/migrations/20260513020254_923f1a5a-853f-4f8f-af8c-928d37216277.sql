
ALTER TABLE public.vet_notifications
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_response jsonb,
  ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts int NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- normalize status values: queued | sent | failed | dead
-- existing 'sent'/free-text rows remain readable
CREATE INDEX IF NOT EXISTS idx_vet_notifications_retry
  ON public.vet_notifications (status, next_retry_at)
  WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_vet_notifications_booking
  ON public.vet_notifications (booking_id);

ALTER TABLE public.vet_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read vet notifications" ON public.vet_notifications;
CREATE POLICY "Admins read vet notifications"
  ON public.vet_notifications FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Vets read own notifications" ON public.vet_notifications;
CREATE POLICY "Vets read own notifications"
  ON public.vet_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vets v WHERE v.id = vet_notifications.vet_id AND v.user_id = auth.uid()));
