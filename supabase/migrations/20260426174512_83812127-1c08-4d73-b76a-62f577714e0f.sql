
-- Clean up posts bucket storage policies and ensure authenticated users can upload to their own folder.
DROP POLICY IF EXISTS "Auth users upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder in posts" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own posts" ON storage.objects;
DROP POLICY IF EXISTS "Public posts access" ON storage.objects;

-- Public read for posts bucket (it's a public bucket)
CREATE POLICY "Posts public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'posts');

-- Authenticated users can upload into their own folder
CREATE POLICY "Posts owner upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files
CREATE POLICY "Posts owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'posts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
CREATE POLICY "Posts owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Same cleanup for stories bucket to prevent the same class of error
DROP POLICY IF EXISTS "Auth users upload stories" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder in stories" ON storage.objects;
DROP POLICY IF EXISTS "Public stories access" ON storage.objects;

CREATE POLICY "Stories public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'stories');

CREATE POLICY "Stories owner upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Stories owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'stories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Same for avatars bucket
DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

CREATE POLICY "Avatars public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars owner upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
