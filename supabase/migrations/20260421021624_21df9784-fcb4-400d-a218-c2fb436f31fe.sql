ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_category text DEFAULT 'reel';
UPDATE public.posts SET post_category = 'reel' WHERE post_category IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_post_category ON public.posts(post_category);