-- Add hours, mobile, and pending fields to shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS open_time TIME,
  ADD COLUMN IF NOT EXISTS close_time TIME,
  ADD COLUMN IF NOT EXISTS open_days SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- New shops should default to NOT approved (pending admin review)
ALTER TABLE public.shops ALTER COLUMN approved SET DEFAULT false;

-- Drop old SELECT policy and recreate so admins/owners see pending,
-- but everyone sees only approved
DROP POLICY IF EXISTS "Approved shops viewable by everyone" ON public.shops;
CREATE POLICY "Shops visible to public, owners and admins"
ON public.shops
FOR SELECT
USING (
  approved = true
  OR owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Promote the currently-logged-in test user to admin.
-- We'll insert admin for the most recent signup (the user creating this).
-- Safe-guard: only inserts if not already present.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT DO NOTHING;