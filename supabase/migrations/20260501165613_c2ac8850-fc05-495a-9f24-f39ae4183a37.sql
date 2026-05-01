CREATE POLICY "Public can view shop images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shop-images');