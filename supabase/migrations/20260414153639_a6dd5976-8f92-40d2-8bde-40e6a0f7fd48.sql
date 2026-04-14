
-- 1. Fix profiles: restrict sensitive fields to owner only
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

CREATE POLICY "Owner reads own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Public reads non-sensitive profile fields"
ON public.profiles FOR SELECT
USING (true);

-- Note: The public_profiles view already excludes email, phone, pin_code.
-- The second policy allows public SELECT but sensitive data is protected
-- because client code should use public_profiles view for other users.
-- However, RLS alone can't do column-level filtering, so we need a different approach.
-- Let's drop both and use a single owner-only policy + the existing view for public access.

DROP POLICY IF EXISTS "Owner reads own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Public reads non-sensitive profile fields" ON public.profiles;

-- Only the owner can SELECT from the profiles table directly
CREATE POLICY "Owner reads own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Fix pet_facts: remove public INSERT and DELETE
DROP POLICY IF EXISTS "Service can insert facts" ON public.pet_facts;
DROP POLICY IF EXISTS "Service can delete expired facts" ON public.pet_facts;

-- 3. Fix posts UPDATE policy broken self-join
DROP POLICY IF EXISTS "Users update own posts" ON public.posts;

CREATE POLICY "Users update own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND like_count = (SELECT p.like_count FROM public.posts p WHERE p.id = posts.id)
  AND comment_count = (SELECT p.comment_count FROM public.posts p WHERE p.id = posts.id)
  AND save_count = (SELECT p.save_count FROM public.posts p WHERE p.id = posts.id)
  AND ai_validated = (SELECT p.ai_validated FROM public.posts p WHERE p.id = posts.id)
);

-- 4. Fix forum_topics UPDATE policy broken self-join
DROP POLICY IF EXISTS "Users update own topics" ON public.forum_topics;

CREATE POLICY "Users update own topics"
ON public.forum_topics FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND upvote_count = (SELECT t.upvote_count FROM public.forum_topics t WHERE t.id = forum_topics.id)
  AND reply_count = (SELECT t.reply_count FROM public.forum_topics t WHERE t.id = forum_topics.id)
  AND view_count = (SELECT t.view_count FROM public.forum_topics t WHERE t.id = forum_topics.id)
);
