
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seed_user boolean DEFAULT false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_seed_post boolean DEFAULT false;
