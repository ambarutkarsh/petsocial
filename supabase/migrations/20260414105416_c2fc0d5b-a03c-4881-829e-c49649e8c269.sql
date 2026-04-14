
-- Fix SECURITY DEFINER view
ALTER VIEW public.public_profiles SET (security_invoker = on);
