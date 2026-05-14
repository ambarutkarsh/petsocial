
-- Re-grant sensitive columns to authenticated so owner-self queries still work.
-- Anonymous (anon) users remain blocked, which fixes the public-exposure findings.
GRANT SELECT (email, phone, pin_code) ON public.profiles TO authenticated;
GRANT SELECT (email, phone, whatsapp_number, clinic_address, pin_code)
  ON public.vets TO authenticated;
GRANT SELECT (phone, whatsapp) ON public.nearby_listings TO authenticated;
