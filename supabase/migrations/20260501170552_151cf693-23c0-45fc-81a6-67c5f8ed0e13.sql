-- Restore EXECUTE on has_role for API roles. RLS policies evaluate with the
-- caller's privileges, so they need EXECUTE on functions referenced inside.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;