-- Owner-scoped RLS policies for the private chip-documents bucket.
-- Path convention: {owner_user_id}/{chip_number}/{filename}

-- Drop any prior duplicates so this migration is idempotent
DROP POLICY IF EXISTS "Chip docs owner read" ON storage.objects;
DROP POLICY IF EXISTS "Chip docs owner insert" ON storage.objects;
DROP POLICY IF EXISTS "Chip docs owner update" ON storage.objects;
DROP POLICY IF EXISTS "Chip docs owner delete" ON storage.objects;

CREATE POLICY "Chip docs owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chip-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chip docs owner insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chip-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chip docs owner update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chip-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chip docs owner delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chip-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);