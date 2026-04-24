
-- Fix 1: Restrict public read on pet_microchips. Replace broad public SELECT with owner-only,
-- and provide a SECURITY DEFINER lookup function that returns only minimal sanitized data
-- needed for the "found a lost pet?" lookup flow.

DROP POLICY IF EXISTS "Public chip existence check" ON public.pet_microchips;

-- (Owner manages own chips ALL policy already exists and remains.)

CREATE OR REPLACE FUNCTION public.lookup_microchip(_chip_number text)
RETURNS TABLE (
  found boolean,
  verification_status text,
  owner_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS found,
    pm.verification_status,
    pm.owner_id
  FROM public.pet_microchips pm
  WHERE pm.chip_number = _chip_number
    AND pm.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_microchip(text) TO anon, authenticated;

-- Fix 2: Remove the open "Allow seed pet inserts" policy. Seeding should use the service role
-- (which bypasses RLS) instead of an anonymous-writable policy that lets anyone create pets
-- attributed to any user.
DROP POLICY IF EXISTS "Allow seed pet inserts" ON public.pets;

-- Fix 3: Tighten waitlist INSERT. Require either an authenticated user inserting their own
-- user_id, or an anonymous insert with user_id = NULL. Email must be present.
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Waitlist insert authenticated or anonymous"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(btrim(email)) > 0
  AND (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  )
);
