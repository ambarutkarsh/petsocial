
UPDATE public.posts p SET 
  like_count = (SELECT count(*) FROM public.post_likes pl WHERE pl.post_id = p.id),
  comment_count = (SELECT count(*) FROM public.post_comments pc WHERE pc.post_id = p.id);
