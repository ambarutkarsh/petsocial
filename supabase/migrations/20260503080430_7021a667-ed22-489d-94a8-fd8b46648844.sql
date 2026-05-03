
CREATE TABLE IF NOT EXISTS public.nearby_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  category text NOT NULL CHECK (category IN ('pet_restaurant','spa_grooming','pet_park','pet_show','boarding','help_stray','lost_found')),
  title text NOT NULL,
  description text,
  city text NOT NULL,
  state text,
  locality text,
  address text,
  latitude numeric,
  longitude numeric,
  phone text,
  whatsapp text,
  website text,
  image_url text,
  rating numeric DEFAULT 0,
  rating_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  source text DEFAULT 'user_generated',
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nearby_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nearby listings readable" ON public.nearby_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create nearby listings" ON public.nearby_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nearby listings" ON public.nearby_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nearby listings" ON public.nearby_listings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nearby_listings_category_city ON public.nearby_listings(category, city);
CREATE INDEX IF NOT EXISTS idx_nearby_listings_created ON public.nearby_listings(created_at DESC);

CREATE TABLE IF NOT EXISTS public.nearby_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('pet_restaurant','spa_grooming','pet_park','pet_show','boarding','help_stray','lost_found')),
  user_id uuid,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nearby_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nearby comments readable" ON public.nearby_comments FOR SELECT USING (true);
CREATE POLICY "Users can create nearby comments" ON public.nearby_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own nearby comments" ON public.nearby_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nearby_comments_listing ON public.nearby_comments(listing_id, listing_type);

CREATE TABLE IF NOT EXISTS public.nearby_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('pet_restaurant','spa_grooming','pet_park','pet_show','boarding','help_stray','lost_found')),
  user_id uuid,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, listing_type, user_id)
);

ALTER TABLE public.nearby_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nearby ratings readable" ON public.nearby_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create nearby ratings" ON public.nearby_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nearby ratings" ON public.nearby_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nearby ratings" ON public.nearby_ratings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nearby_ratings_listing ON public.nearby_ratings(listing_id, listing_type);
