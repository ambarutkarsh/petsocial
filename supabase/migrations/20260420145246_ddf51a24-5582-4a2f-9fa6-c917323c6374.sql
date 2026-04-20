-- Allow public read access to profiles so post/story/comment author info renders for everyone.
-- Sensitive fields (email, phone, pin_code) are already excluded from the public_profiles view,
-- but the base table needs a public SELECT policy for PostgREST embedded joins (posts -> profiles) to work.
CREATE POLICY "Profiles publicly readable"
ON public.profiles
FOR SELECT
USING (true);