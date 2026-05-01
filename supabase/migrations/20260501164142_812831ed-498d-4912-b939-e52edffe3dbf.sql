-- 1. user_roles: restrict SELECT to self or admins
DROP POLICY IF EXISTS "Roles viewable by everyone" ON public.user_roles;
CREATE POLICY "Users view own roles or admin views all"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. user_roles: remove self-insert (prevent privilege escalation)
DROP POLICY IF EXISTS "Users insert own role" ON public.user_roles;

-- 3. shops: prevent non-admins from changing approved/verified via trigger
CREATE OR REPLACE FUNCTION public.prevent_non_admin_shop_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.approved IS DISTINCT FROM OLD.approved THEN
      RAISE EXCEPTION 'Only admins can change approval status';
    END IF;
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
      RAISE EXCEPTION 'Only admins can change verified status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_prevent_self_moderation ON public.shops;
CREATE TRIGGER shops_prevent_self_moderation
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_admin_shop_moderation();

-- 4. Storage: restrict shop-images INSERT to user's own folder
DROP POLICY IF EXISTS "Authenticated upload shop images" ON storage.objects;
CREATE POLICY "Owner upload shop images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Lock down SECURITY DEFINER helper functions: revoke execute from API roles
-- has_role is referenced by RLS policies which are evaluated by the policy owner,
-- so revoking direct EXECUTE from anon/authenticated does not break RLS.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_non_admin_shop_moderation() FROM anon, authenticated, public;