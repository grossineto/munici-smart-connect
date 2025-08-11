-- Harden access to sensitive citizens PII
-- 1) Remove broad tenant-only policies
DROP POLICY IF EXISTS "Tenant users can insert citizens" ON public.citizens;
DROP POLICY IF EXISTS "Tenant users can update citizens" ON public.citizens;
DROP POLICY IF EXISTS "Tenant users can view citizens" ON public.citizens;

-- 2) Create staff-only policies scoped by tenant
CREATE POLICY "Staff can view tenant citizens"
ON public.citizens
FOR SELECT
USING (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can insert tenant citizens"
ON public.citizens
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can update tenant citizens"
ON public.citizens
FOR UPDATE
USING (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
)
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

-- RLS remains enabled on citizens; Edge Functions with service role are unaffected.
