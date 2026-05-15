CREATE TABLE IF NOT EXISTS public.dinofy_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text,
  generation_count integer NOT NULL DEFAULT 0,
  last_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dinofy_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own dinofy usage"
ON public.dinofy_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER dinofy_usage_set_updated_at
BEFORE UPDATE ON public.dinofy_usage
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();