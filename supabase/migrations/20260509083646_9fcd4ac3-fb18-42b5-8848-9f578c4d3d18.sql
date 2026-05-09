
CREATE TABLE public.pet_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  pet_id uuid NOT NULL,
  pet_type text NOT NULL,
  breed_or_species text,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_health_score integer CHECK (overall_health_score BETWEEN 1 AND 5),
  body_condition_score integer CHECK (body_condition_score BETWEEN 1 AND 5),
  activity_score integer CHECK (activity_score BETWEEN 1 AND 5),
  hydration_score integer CHECK (hydration_score BETWEEN 1 AND 5),
  overall_health_label text,
  body_condition_label text,
  activity_label text,
  hydration_label text,
  overall_health_reason text,
  body_condition_reason text,
  activity_reason text,
  hydration_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pet_health_snapshots_owner_pet_uniq
  ON public.pet_health_snapshots(owner_id, pet_id);

ALTER TABLE public.pet_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own snapshots" ON public.pet_health_snapshots
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own snapshots" ON public.pet_health_snapshots
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own snapshots" ON public.pet_health_snapshots
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own snapshots" ON public.pet_health_snapshots
  FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER set_pet_health_snapshots_updated_at
  BEFORE UPDATE ON public.pet_health_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pet_health_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  pet_id uuid NOT NULL,
  reminder_type text NOT NULL DEFAULT 'health_snapshot',
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notification_title text,
  notification_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pet_health_reminders_owner_pet_idx
  ON public.pet_health_reminders(owner_id, pet_id, scheduled_for);

ALTER TABLE public.pet_health_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select own reminders" ON public.pet_health_reminders
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own reminders" ON public.pet_health_reminders
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own reminders" ON public.pet_health_reminders
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own reminders" ON public.pet_health_reminders
  FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER set_pet_health_reminders_updated_at
  BEFORE UPDATE ON public.pet_health_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
