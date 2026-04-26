
-- Revoke PII column SELECT from authenticated as well, so no signed-in
-- user can read another vet's email/phone/whatsapp/user_id directly.
REVOKE SELECT (email, phone, whatsapp_number, user_id) ON public.vets FROM authenticated;

-- Provide a SECURITY DEFINER function so a vet can read their OWN
-- complete profile (including PII) without exposing other vets' PII.
CREATE OR REPLACE FUNCTION public.get_my_vet_profile()
RETURNS SETOF public.vets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.vets WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_vet_profile() TO authenticated;
