
-- 1. post_comments: drop overly permissive seed insert policy + duplicate read
DROP POLICY IF EXISTS "Allow seed comments" ON public.post_comments;
DROP POLICY IF EXISTS "Comments public read" ON public.post_comments;

-- 2. profiles: drop self-grant seed insert policy
DROP POLICY IF EXISTS "Allow seed user inserts" ON public.profiles;

-- 3. posts: rewrite INSERT to require auth.uid() = user_id; drop anon update
DROP POLICY IF EXISTS "Posts insert policy" ON public.posts;
CREATE POLICY "Posts insert policy" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anon update post validation" ON public.posts;
DROP POLICY IF EXISTS "Posts public read" ON public.posts;

-- 4. stories: remove anon insert/update policies
DROP POLICY IF EXISTS "Anon insert stories via edge function" ON public.stories;
DROP POLICY IF EXISTS "Anon update stories validation" ON public.stories;

-- 5. profiles: hide sensitive contact columns from public/authenticated SELECT
REVOKE SELECT (email, phone, pin_code) ON public.profiles FROM anon, authenticated;

-- 6. vets: hide sensitive contact columns from anon/authenticated SELECT
REVOKE SELECT (email, phone, whatsapp_number, clinic_address, pin_code)
  ON public.vets FROM anon, authenticated;

-- 7. nearby_listings: hide phone/whatsapp from anon (authenticated may still see)
REVOKE SELECT (phone, whatsapp) ON public.nearby_listings FROM anon;

-- 8. pet-records storage: enforce path ownership on INSERT
DROP POLICY IF EXISTS "Auth users upload records" ON storage.objects;
CREATE POLICY "Auth users upload records" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pet-records'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. prescriptions storage: scope vet reads to their own records only
DROP POLICY IF EXISTS "Vets and owners can read prescriptions" ON storage.objects;
CREATE POLICY "Vets and owners can read prescriptions" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'prescriptions'
    AND (
      public.can_manage_prescription_object(auth.uid(), name)
      OR public.can_read_prescription_object(auth.uid(), name)
    )
  );

-- 10. set fixed search_path on functions missing it
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
