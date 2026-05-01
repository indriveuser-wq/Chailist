-- Public bucket: drop broad SELECT on storage.objects to prevent listing.
-- Files remain accessible via their public URLs since the bucket is public.
DROP POLICY IF EXISTS "Shop images readable by id" ON storage.objects;