-- Allow seed profiles to be inserted without a matching auth.users row
-- by making the FK deferrable. Real users will still get a profile via the
-- handle_new_user trigger, so this remains safe in practice.

ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;