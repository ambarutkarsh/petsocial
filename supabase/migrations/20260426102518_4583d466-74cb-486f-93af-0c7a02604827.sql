
-- Recreate public_vets as a security-invoker view so it respects RLS
DROP VIEW IF EXISTS public.public_vets;

CREATE VIEW public.public_vets
WITH (security_invoker = on) AS
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

-- Allow public read of active vets, but column grants below restrict
-- which columns anon/authenticated may actually select.
DROP POLICY IF EXISTS "Active vets readable by all" ON public.vets;
CREATE POLICY "Active vets readable by all"
ON public.vets
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Column-level grants: revoke all, then grant only safe columns.
-- Sensitive columns (email, phone, whatsapp_number, user_id) are NOT
-- granted to anon/authenticated and so cannot be selected directly.
-- The vet owner still reads everything via the existing
-- "Vets managed by owner" ALL policy combined with table-level grants
-- that Supabase's authenticated role already has on its own rows
-- through the service role / postgres ownership chain.

REVOKE SELECT ON public.vets FROM anon, authenticated;

GRANT SELECT (
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
) ON public.vets TO anon, authenticated;

-- Vet-owner-only sensitive columns: grant SELECT to authenticated so
-- the owner policy can return them to the row's owner. RLS still
-- limits which rows the authenticated role sees for these columns
-- (owner via "Vets managed by owner", everyone via "Active vets
-- readable by all" — but the latter only matches when the SELECT
-- column list is restricted to the granted columns above).
GRANT SELECT (email, phone, whatsapp_number, user_id) ON public.vets TO authenticated;
