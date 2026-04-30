-- Make posts bucket uploads work for any authenticated user without folder restriction
DROP POLICY IF EXISTS "Posts owner upload" ON storage.objects;
DROP POLICY IF EXISTS "Posts owner update" ON storage.objects;
DROP POLICY IF EXISTS "Posts owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload posts bucket" ON storage.objects;

CREATE POLICY "Posts authenticated upload v2"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Posts owner update v2"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'posts' AND owner = auth.uid())
WITH CHECK (bucket_id = 'posts' AND owner = auth.uid());

CREATE POLICY "Posts owner delete v2"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'posts' AND owner = auth.uid());