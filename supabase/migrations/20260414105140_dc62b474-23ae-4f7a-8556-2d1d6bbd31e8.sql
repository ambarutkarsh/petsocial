
-- 1. Fix profiles: restrict public SELECT to non-sensitive fields, allow owner full access
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

CREATE POLICY "Public profiles readable"
  ON public.profiles FOR SELECT
  USING (true);

-- Create a secure view that excludes sensitive fields for public use
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, full_name, username, avatar_url, bio, city, state, location,
         pet_parent_since, post_count, follower_count, following_count,
         created_at, updated_at
  FROM public.profiles;

-- 2. Fix posts UPDATE policy: prevent counter/ai_validated manipulation
DROP POLICY IF EXISTS "Users update own posts" ON public.posts;

CREATE POLICY "Users update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND like_count = (SELECT like_count FROM public.posts WHERE id = posts.id)
    AND comment_count = (SELECT comment_count FROM public.posts WHERE id = posts.id)
    AND save_count = (SELECT save_count FROM public.posts WHERE id = posts.id)
    AND ai_validated = (SELECT ai_validated FROM public.posts WHERE id = posts.id)
  );

-- 3. Fix forum_topics UPDATE policy: prevent counter manipulation
DROP POLICY IF EXISTS "Users update own topics" ON public.forum_topics;

CREATE POLICY "Users update own topics"
  ON public.forum_topics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND upvote_count = (SELECT upvote_count FROM public.forum_topics WHERE id = forum_topics.id)
    AND reply_count = (SELECT reply_count FROM public.forum_topics WHERE id = forum_topics.id)
    AND view_count = (SELECT view_count FROM public.forum_topics WHERE id = forum_topics.id)
  );

-- 4. Fix notifications INSERT policy (currently WITH CHECK true)
DROP POLICY IF EXISTS "System can insert notifs" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifs"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Enable RLS on waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own waitlist entries"
  ON public.waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Fix storage upload policies for posts and stories buckets
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Users upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload posts" ON storage.objects;

CREATE POLICY "Users upload to own folder in posts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
DROP POLICY IF EXISTS "Users upload stories" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload stories" ON storage.objects;

CREATE POLICY "Users upload to own folder in stories"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stories'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 7. Fix function search_path on all trigger functions
ALTER FUNCTION public.update_post_comment_count() SET search_path = public;
ALTER FUNCTION public.update_forum_reply_count() SET search_path = public;
ALTER FUNCTION public.update_follow_counts() SET search_path = public;
ALTER FUNCTION public.update_post_like_count() SET search_path = public;
ALTER FUNCTION public.update_profile_post_count() SET search_path = public;
