-- Grant read access on the public_profiles view so the app can read author info
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Same for public_vets while we're here, in case it has the same issue
GRANT SELECT ON public.public_vets TO anon, authenticated;