-- Strengthen citizens RLS: only authenticated clients, explicit auth check, tenant + role
DROP POLICY IF EXISTS "Staff can view tenant citizens" ON public.citizens;
DROP POLICY IF EXISTS "Staff can insert tenant citizens" ON public.citizens;
DROP POLICY IF EXISTS "Staff can update tenant citizens" ON public.citizens;

CREATE POLICY "Staff can view tenant citizens (auth only)"
ON public.citizens
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can insert tenant citizens (auth only)"
ON public.citizens
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can update tenant citizens (auth only)"
ON public.citizens
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);
