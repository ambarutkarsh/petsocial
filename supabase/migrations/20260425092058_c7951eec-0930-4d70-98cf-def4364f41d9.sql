-- 1. Remove the overly-permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles readable via public view" ON public.profiles;

-- The existing "Owner reads own profile" policy remains, allowing users
-- to read their own complete profile (including email, phone, pin_code).
-- Cross-user reads of safe fields should go through the public_profiles view.

-- Ensure the public_profiles view is readable by anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Allow microchip owners to see contact requests targeting their chip
CREATE POLICY "Chip owners read incoming requests"
ON public.chip_contact_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pet_microchips pm
    WHERE pm.chip_number = chip_contact_requests.chip_number
      AND pm.owner_id = auth.uid()
      AND pm.is_active = true
  )
);