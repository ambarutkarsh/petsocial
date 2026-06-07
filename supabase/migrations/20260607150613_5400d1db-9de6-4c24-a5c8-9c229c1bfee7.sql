
-- =====================================================================
-- 1) PROFILES: drop blanket public read, switch view to invoker, use
--    column privileges + owner RPC to limit PII exposure.
-- =====================================================================
DROP POLICY IF EXISTS "Profiles publicly readable" ON public.profiles;

-- Allow row visibility but column privileges below restrict sensitive fields.
CREATE POLICY "Profiles readable to anon (safe columns)"
  ON public.profiles FOR SELECT TO anon USING (true);

CREATE POLICY "Profiles readable to authenticated (safe columns)"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Reset SELECT privileges so we can grant per-column.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, full_name, username, avatar_url, bio, location,
  follower_count, following_count, post_count, pet_parent_since,
  is_seed_user, community_default_tab, feed_preferences,
  city, state, created_at, updated_at,
  welcome_email_sent, welcome_email_sent_at
) ON public.profiles TO anon, authenticated;

-- Owners still need to insert/update/delete their own row (RLS still applies).
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Owner helper for reading their own full profile (incl. email/phone/pin_code).
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Switch public_profiles view to security_invoker so it respects RLS.
ALTER VIEW public.public_profiles SET (security_invoker = on);
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =====================================================================
-- 2) PETS: drop duplicate public-read policies, hide microchip cols
-- =====================================================================
DROP POLICY IF EXISTS "Pets public read" ON public.pets;
DROP POLICY IF EXISTS "Pets publicly readable" ON public.pets;

CREATE POLICY "Pets readable to anon (safe columns)"
  ON public.pets FOR SELECT TO anon USING (true);

CREATE POLICY "Pets readable to authenticated (safe columns)"
  ON public.pets FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.pets FROM anon, authenticated;

GRANT SELECT (
  id, owner_id, name, pet_type, species, gender,
  age_years, date_of_birth, is_primary, avatar_emoji,
  notes, created_at, updated_at, avatar_url, height_cm
) ON public.pets TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_pets()
RETURNS SETOF public.pets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pets
  WHERE owner_id = auth.uid()
  ORDER BY is_primary DESC NULLS LAST, created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.get_my_pets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_pets() TO authenticated;

-- =====================================================================
-- 3) STORAGE: drop anonymous upload to posts bucket
-- =====================================================================
DROP POLICY IF EXISTS "Posts bucket upload" ON storage.objects;

-- =====================================================================
-- 4) SECURITY DEFINER trigger functions: revoke direct execution
-- =====================================================================
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.trg_award_first_post()',
    'public.trg_award_ten_likes()',
    'public.update_follow_counts()',
    'public.update_forum_reply_count()',
    'public.update_post_comment_count()',
    'public.update_post_like_count()',
    'public.update_profile_post_count()'
  ] LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', fn);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;
