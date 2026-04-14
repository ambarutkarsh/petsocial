
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_default_tab text DEFAULT 'interesting_facts';

ALTER TABLE public.pet_records
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS file_size_kb int;

CREATE TABLE IF NOT EXISTS public.pet_facts (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  fact text NOT NULL,
  pet_type text,
  emoji text DEFAULT '🐾',
  image_url text,
  photographer text,
  pexels_url text,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '4 hours')
);

ALTER TABLE public.pet_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet facts publicly readable"
  ON public.pet_facts FOR SELECT USING (true);

CREATE POLICY "Service can insert facts"
  ON public.pet_facts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can delete expired facts"
  ON public.pet_facts FOR DELETE USING (true);
