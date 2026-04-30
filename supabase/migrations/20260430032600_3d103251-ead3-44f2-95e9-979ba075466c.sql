-- Fix storage policies that reference vet tables directly and can block unrelated bucket uploads.
-- Keep helper functions in public schema so storage policies do not require direct table privileges.

CREATE OR REPLACE FUNCTION public.is_vet_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vets v
    WHERE v.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_prescription_object(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    WHERE vp.document_url LIKE ('%' || _object_name || '%')
      AND vp.owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_prescription_object(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    JOIN public.vets v ON v.id = vp.vet_id
    WHERE v.user_id = _user_id
      AND vp.document_url LIKE ('%' || _object_name || '%')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_vet_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_prescription_object(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_prescription_object(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Vets can upload prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Vets and owners can read prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Vets can delete own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Vets can update own prescriptions" ON storage.objects;

CREATE POLICY "Vets can upload prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions'
  AND public.is_vet_user(auth.uid())
);

CREATE POLICY "Vets and owners can read prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND (
    public.is_vet_user(auth.uid())
    OR public.can_read_prescription_object(auth.uid(), name)
  )
);

CREATE POLICY "Vets can delete own prescriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND public.can_manage_prescription_object(auth.uid(), name)
);

CREATE POLICY "Vets can update own prescriptions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND public.can_manage_prescription_object(auth.uid(), name)
)
WITH CHECK (
  bucket_id = 'prescriptions'
  AND public.can_manage_prescription_object(auth.uid(), name)
);