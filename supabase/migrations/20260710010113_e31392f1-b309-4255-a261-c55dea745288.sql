
ALTER TABLE public.vet_prescriptions ADD COLUMN IF NOT EXISTS document_path text;

-- Backfill document_path from existing signed URLs (pattern: /object/sign/prescriptions/<path>?token=...)
UPDATE public.vet_prescriptions
SET document_path = substring(document_url from '/prescriptions/([^?]+)')
WHERE document_path IS NULL AND document_url IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_read_prescription_object(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    WHERE vp.document_path = _object_name
      AND vp.owner_id = _user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_prescription_object(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.vet_prescriptions vp
    JOIN public.vets v ON v.id = vp.vet_id
    WHERE v.user_id = _user_id
      AND vp.document_path = _object_name
  );
$function$;
