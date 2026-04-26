-- The public_profiles view is intended to expose only safe, public fields.
-- It was created with security_invoker=true, which forces the underlying
-- profiles RLS (owner-only SELECT) to apply, so anon and other users got nothing.
-- Switch to security_invoker=false so the view runs with its owner's privileges
-- and returns the safe columns it explicitly selects.
ALTER VIEW public.public_profiles SET (security_invoker = false);

-- Ensure read access for anon and authenticated callers
GRANT SELECT ON public.public_profiles TO anon, authenticated;