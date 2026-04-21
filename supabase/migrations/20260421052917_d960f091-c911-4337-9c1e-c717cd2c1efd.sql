-- Tea ratings table
CREATE TABLE public.tea_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tea_id uuid NOT NULL REFERENCES public.tea_items(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tea_id)
);

ALTER TABLE public.tea_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tea ratings viewable by everyone"
  ON public.tea_ratings FOR SELECT USING (true);

CREATE POLICY "Users insert own tea rating"
  ON public.tea_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tea rating"
  ON public.tea_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users or admin delete tea rating"
  ON public.tea_ratings FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tea_ratings_tea ON public.tea_ratings(tea_id);

-- Tea stats view
CREATE OR REPLACE VIEW public.tea_stats
WITH (security_invoker = true) AS
SELECT
  t.id AS tea_id,
  COALESCE(AVG(r.rating)::numeric(10,2), 0) AS avg_rating,
  COUNT(r.id) AS rating_count
FROM public.tea_items t
LEFT JOIN public.tea_ratings r ON r.tea_id = t.id
GROUP BY t.id;

-- Shop images table
CREATE TABLE public.shop_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop images viewable by everyone"
  ON public.shop_images FOR SELECT USING (true);

CREATE POLICY "Shop owner manages images"
  ON public.shop_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_images.shop_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_images.shop_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE INDEX idx_shop_images_shop ON public.shop_images(shop_id, sort_order);