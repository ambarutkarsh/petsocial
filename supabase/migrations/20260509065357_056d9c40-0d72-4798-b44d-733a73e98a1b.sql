
-- 1. Pet identity microchip columns (mirrored on pets for fast read in identity card)
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS microchip_number TEXT,
  ADD COLUMN IF NOT EXISTS microchip_registered_status TEXT,
  ADD COLUMN IF NOT EXISTS microchip_registered_date DATE;

-- 2. pet_health_records
CREATE TABLE IF NOT EXISTS public.pet_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  record_date DATE,
  next_due_date DATE,
  status TEXT DEFAULT 'done',
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phr_owner_pet ON public.pet_health_records(owner_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_phr_pet_type ON public.pet_health_records(pet_id, record_type);

ALTER TABLE public.pet_health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Health records owner only" ON public.pet_health_records;
CREATE POLICY "Health records owner only"
ON public.pet_health_records
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS trg_phr_updated_at ON public.pet_health_records;
CREATE TRIGGER trg_phr_updated_at
BEFORE UPDATE ON public.pet_health_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. pet_documents
CREATE TABLE IF NOT EXISTS public.pet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  health_record_id UUID REFERENCES public.pet_health_records(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_mime_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pd_owner_pet ON public.pet_documents(owner_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_pd_record ON public.pet_documents(health_record_id);
CREATE INDEX IF NOT EXISTS idx_pd_type ON public.pet_documents(pet_id, document_type);

ALTER TABLE public.pet_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pet documents owner only" ON public.pet_documents;
CREATE POLICY "Pet documents owner only"
ON public.pet_documents
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS trg_pd_updated_at ON public.pet_documents;
CREATE TRIGGER trg_pd_updated_at
BEFORE UPDATE ON public.pet_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-documents', 'pet-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS for pet-documents (path: {owner_id}/{pet_id}/{record_type}/{record_id|general}/{filename})
DROP POLICY IF EXISTS "pet-documents owner read" ON storage.objects;
CREATE POLICY "pet-documents owner read"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "pet-documents owner insert" ON storage.objects;
CREATE POLICY "pet-documents owner insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "pet-documents owner update" ON storage.objects;
CREATE POLICY "pet-documents owner update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "pet-documents owner delete" ON storage.objects;
CREATE POLICY "pet-documents owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'pet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
