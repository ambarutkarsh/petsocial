
-- Add columns for email confirm/reject action tokens and ledger sync tracking
ALTER TABLE public.vet_bookings
  ADD COLUMN IF NOT EXISTS action_token text,
  ADD COLUMN IF NOT EXISTS action_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS vet_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS vet_action_source text,
  ADD COLUMN IF NOT EXISTS google_sheet_synced boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vet_bookings_action_token
  ON public.vet_bookings(action_token)
  WHERE action_token IS NOT NULL;

-- Ledger sync audit log
CREATE TABLE IF NOT EXISTS public.vet_ledger_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  status text NOT NULL,
  error text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_ledger_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read ledger sync logs" ON public.vet_ledger_sync_logs;
CREATE POLICY "Admins read ledger sync logs"
  ON public.vet_ledger_sync_logs
  FOR SELECT
  USING (public.is_admin());
