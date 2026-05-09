
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.home_carousel_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL DEFAULT 'reels' CHECK (source_type IN ('reels','news','facts','blogs','nearby','custom')),
  selected_item_ids TEXT[] NOT NULL DEFAULT '{}',
  custom_banners JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_carousel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active carousel config"
ON public.home_carousel_config FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin can insert carousel config"
ON public.home_carousel_config FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update carousel config"
ON public.home_carousel_config FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admin can delete carousel config"
ON public.home_carousel_config FOR DELETE
USING (public.is_admin());

CREATE TRIGGER trg_home_carousel_config_updated_at
BEFORE UPDATE ON public.home_carousel_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
