-- 1. Hide mobile_number from anonymous users (still readable by authenticated users)
REVOKE SELECT (mobile_number) ON public.shops FROM anon;

-- 2. Auto-grant shop_owner role on shop creation
CREATE OR REPLACE FUNCTION public.grant_shop_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'shop_owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_shop_owner ON public.shops;
CREATE TRIGGER trg_grant_shop_owner
AFTER INSERT ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.grant_shop_owner_role();

-- 3. Lock down trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_non_admin_shop_moderation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_shop_owner_role() FROM PUBLIC, anon, authenticated;

-- 4. Make sure the moderation trigger is actually attached (it was defined but
--    we want to confirm it protects approved/verified columns)
DROP TRIGGER IF EXISTS trg_prevent_non_admin_shop_moderation ON public.shops;
CREATE TRIGGER trg_prevent_non_admin_shop_moderation
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_shop_moderation();