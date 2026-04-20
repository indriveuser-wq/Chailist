-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'shop_owner', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Roles viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Users insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role <> 'admin');
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Shops
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price_range TEXT NOT NULL DEFAULT 'medium' CHECK (price_range IN ('low','medium','high')),
  starting_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved shops viewable by everyone" ON public.shops FOR SELECT USING (approved = true OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create shops" ON public.shops FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own shop" ON public.shops FOR UPDATE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners or admin delete shop" ON public.shops FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Tea items
CREATE TABLE public.tea_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tea_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tea items viewable by everyone" ON public.tea_items FOR SELECT USING (true);
CREATE POLICY "Shop owner manages tea items" ON public.tea_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Ratings
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  taste SMALLINT CHECK (taste BETWEEN 1 AND 5),
  value SMALLINT CHECK (value BETWEEN 1 AND 5),
  ambience SMALLINT CHECK (ambience BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users insert own rating" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rating" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users or admin delete rating" ON public.ratings FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_shops_updated BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- View to compute shop stats
CREATE OR REPLACE VIEW public.shop_stats AS
SELECT s.id AS shop_id,
  COALESCE(AVG(r.rating)::numeric(3,2), 0) AS avg_rating,
  COUNT(r.id) AS rating_count
FROM public.shops s
LEFT JOIN public.ratings r ON r.shop_id = s.id
GROUP BY s.id;

-- Storage bucket for shop images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images','shop-images', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Shop images publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'shop-images');
CREATE POLICY "Authenticated upload shop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Owner update shop images" ON storage.objects FOR UPDATE USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete shop images" ON storage.objects FOR DELETE USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);