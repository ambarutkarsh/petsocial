-- Sauras-Coins gamification tables
CREATE TABLE IF NOT EXISTS public.sauras_coins (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  coins int NOT NULL DEFAULT 0,
  total_earned int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sauras_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coins readable by owner"
  ON public.sauras_coins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coins insertable by owner"
  ON public.sauras_coins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coins updatable by owner"
  ON public.sauras_coins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount int NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions readable by owner"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Transactions insertable by owner"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id, created_at DESC);

-- Achievements table for Profile badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements publicly readable"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Achievements insertable by owner"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Server-side coin award helper (security definer, bypasses RLS for triggers)
CREATE OR REPLACE FUNCTION public.award_coins(_user_id uuid, _amount int, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _amount IS NULL OR _amount = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.sauras_coins (user_id, coins, total_earned, updated_at)
  VALUES (_user_id, GREATEST(_amount, 0), GREATEST(_amount, 0), now())
  ON CONFLICT (user_id) DO UPDATE
    SET coins = public.sauras_coins.coins + EXCLUDED.coins,
        total_earned = public.sauras_coins.total_earned + GREATEST(_amount, 0),
        updated_at = now();

  INSERT INTO public.coin_transactions (user_id, amount, reason)
  VALUES (_user_id, _amount, _reason);
END;
$$;

-- Trigger: first post ever award (+25)
CREATE OR REPLACE FUNCTION public.trg_award_first_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prior_count int;
BEGIN
  IF NEW.is_seed_post = true THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO prior_count
  FROM public.posts
  WHERE user_id = NEW.user_id
    AND id <> NEW.id
    AND coalesce(is_seed_post, false) = false;

  IF prior_count = 0 THEN
    PERFORM public.award_coins(NEW.user_id, 25, 'first_post_ever');
    INSERT INTO public.achievements (user_id, badge_key)
    VALUES (NEW.user_id, 'first_post')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_first_post_award ON public.posts;
CREATE TRIGGER posts_first_post_award
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.trg_award_first_post();

-- Trigger: 10-likes milestone (+15) - check after each like insert
CREATE OR REPLACE FUNCTION public.trg_award_ten_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner uuid;
  current_likes int;
  already_awarded int;
BEGIN
  SELECT user_id, like_count INTO post_owner, current_likes
  FROM public.posts WHERE id = NEW.post_id;

  IF post_owner IS NULL OR current_likes < 10 THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO already_awarded
  FROM public.coin_transactions
  WHERE user_id = post_owner AND reason = 'ten_likes:' || NEW.post_id::text;

  IF already_awarded = 0 THEN
    PERFORM public.award_coins(post_owner, 15, 'ten_likes:' || NEW.post_id::text);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_likes_ten_likes_award ON public.post_likes;
CREATE TRIGGER post_likes_ten_likes_award
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.trg_award_ten_likes();

-- Lost & Found alerts: extend forum category usage. No schema change needed
-- (forum_topics.pet_category already accepts free text; we use 'alert' / 'adoption' / 'mating').