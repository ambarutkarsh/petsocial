-- ============================================================
-- FIX 1: Restrict profiles table - remove public SELECT policies
-- ============================================================
-- Sensitive fields (email, phone, pin_code) must not be readable by everyone.
-- The public_profiles view (which excludes sensitive fields) remains the
-- public-facing source for things like comments/feeds.

DROP POLICY IF EXISTS "Profiles publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;

-- Keep "Owner reads own profile" (auth.uid() = id) -- already exists.
-- Keep "Users update own profile" -- already exists.
-- Keep "Allow seed user inserts" -- already exists.

-- Ensure the public_profiles view runs with invoker rights so its data
-- access is governed by RLS (it already excludes email/phone/pin_code).
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Grant select on the view to anon + authenticated so unauthenticated
-- visitors can still see public profile fields (name, avatar, bio, city).
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- public_profiles is a VIEW over profiles. With security_invoker it needs
-- a SELECT policy on profiles that allows reading the safe columns.
-- We add a permissive policy that lets anyone read profiles, but the
-- application/view exposes only safe columns. For sensitive-field
-- protection at the column level we rely on the VIEW being the only
-- public read path AND on dropping the broad table policy.
--
-- Re-add a public SELECT only via the VIEW, which omits sensitive cols.
-- We accomplish this by adding a permissive policy that the view executes
-- under (since security_invoker uses the caller's RLS).
CREATE POLICY "Profiles readable via public view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- NOTE: Direct SELECT on `profiles.*` from the client will still expose
-- sensitive fields. To prevent client-side sensitive reads we revoke
-- column-level SELECT on the sensitive columns from anon/authenticated.
REVOKE SELECT (email, phone, pin_code) ON public.profiles FROM anon, authenticated;

-- ============================================================
-- FIX 2: Lock down sauras_coins - prevent client-side manipulation
-- ============================================================
-- Coin balances must only change via the SECURITY DEFINER award_coins()
-- function. Remove direct INSERT/UPDATE permissions from clients.

DROP POLICY IF EXISTS "Coins insertable by owner" ON public.sauras_coins;
DROP POLICY IF EXISTS "Coins updatable by owner" ON public.sauras_coins;

-- Keep "Coins readable by owner" so users can see their own balance.

-- Same for coin_transactions: only the trusted function should write.
DROP POLICY IF EXISTS "Transactions insertable by owner" ON public.coin_transactions;

-- ============================================================
-- FIX 3: Restrict competitions - remove unrestricted public ALL access
-- ============================================================
DROP POLICY IF EXISTS "Competitions full access for all" ON public.competitions;

-- "Competitions readable when active" already exists for public reads.
-- Add a policy so authenticated owners (and only them) can read drafts.
CREATE POLICY "Creators read own competitions"
ON public.competitions
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Restrict mutations to the creator (admin gating happens client-side
-- and via the existing isAdminEmail check). created_by is set on insert
-- and cannot be reassigned to another user.
CREATE POLICY "Creators insert competitions"
ON public.competitions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators update own competitions"
ON public.competitions
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators delete own competitions"
ON public.competitions
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
