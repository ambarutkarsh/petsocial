
-- ============================================================
-- Fix 1: Remove permissive seed-follows policy
-- ============================================================
DROP POLICY IF EXISTS "Allow seed follows" ON public.follows;

-- ============================================================
-- Fix 2: Remove unrestricted "Admin can ..." policies on vets.
-- Admin mutations are performed via edge functions using the
-- service role key, which bypasses RLS. The owner policy
-- ("Vets managed by owner") remains for vets to manage their own row.
-- ============================================================
DROP POLICY IF EXISTS "Admin can insert vets" ON public.vets;
DROP POLICY IF EXISTS "Admin can update vets" ON public.vets;
DROP POLICY IF EXISTS "Admin can delete vets" ON public.vets;

-- ============================================================
-- Fix 3: Restrict public SELECT on vets to non-PII columns via a view.
-- Drop the broad public read policy; vet owners still read their own
-- row via the existing "Vets managed by owner" ALL policy.
-- Create a public_vets view exposing only safe directory fields.
-- ============================================================
DROP POLICY IF EXISTS "Vets readable by all" ON public.vets;

CREATE OR REPLACE VIEW public.public_vets
WITH (security_invoker = off) AS
SELECT
  id,
  full_name,
  clinic_name,
  clinic_address,
  city,
  state,
  pin_code,
  lat,
  lng,
  bio,
  profile_photo_url,
  specialisations,
  years_experience,
  vc_india_registration,
  is_active,
  is_verified,
  verified_at,
  onboarding_status,
  consultation_fee_inperson,
  emergency_fee_inperson,
  avg_rating,
  total_reviews,
  total_appointments,
  created_at
FROM public.vets
WHERE is_active = true;

GRANT SELECT ON public.public_vets TO anon, authenticated;

-- ============================================================
-- Fix 5: Add DELETE and UPDATE storage policies for prescriptions
-- bucket, restricted to vets who own the booking associated with
-- the file.
-- ============================================================
DROP POLICY IF EXISTS "Vets can delete own prescriptions" ON storage.objects;
CREATE POLICY "Vets can delete own prescriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    JOIN public.vets v ON v.id = vp.vet_id
    WHERE v.user_id = auth.uid()
      AND vp.document_url LIKE ('%' || storage.objects.name || '%')
  )
);

DROP POLICY IF EXISTS "Vets can update own prescriptions" ON storage.objects;
CREATE POLICY "Vets can update own prescriptions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    JOIN public.vets v ON v.id = vp.vet_id
    WHERE v.user_id = auth.uid()
      AND vp.document_url LIKE ('%' || storage.objects.name || '%')
  )
)
WITH CHECK (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    JOIN public.vets v ON v.id = vp.vet_id
    WHERE v.user_id = auth.uid()
      AND vp.document_url LIKE ('%' || storage.objects.name || '%')
  )
);
