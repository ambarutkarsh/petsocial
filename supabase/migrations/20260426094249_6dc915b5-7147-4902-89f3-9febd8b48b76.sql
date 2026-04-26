UPDATE public.profiles SET is_seed_user = false WHERE is_seed_user IS NULL;
UPDATE public.posts SET is_seed_post = false WHERE is_seed_post IS NULL;