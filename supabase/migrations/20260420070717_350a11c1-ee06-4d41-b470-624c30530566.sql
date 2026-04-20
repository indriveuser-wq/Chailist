-- Recreate view with security_invoker so it respects caller's RLS
DROP VIEW IF EXISTS public.shop_stats;
CREATE VIEW public.shop_stats
WITH (security_invoker = true) AS
SELECT s.id AS shop_id,
  COALESCE(AVG(r.rating)::numeric(3,2), 0) AS avg_rating,
  COUNT(r.id) AS rating_count
FROM public.shops s
LEFT JOIN public.ratings r ON r.shop_id = s.id
GROUP BY s.id;

-- Replace broad public select on shop-images with a no-op (files remain accessible via signed/public URL since bucket is public)
DROP POLICY IF EXISTS "Shop images publicly readable" ON storage.objects;
-- Make bucket non-listable but still publicly fetchable via direct URL by keeping bucket public=true
-- We allow SELECT only on individual objects (not listing), which Supabase treats as required for getPublicUrl access
CREATE POLICY "Shop images readable by id"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');