-- Tighten access to sensitive WhatsApp messages
-- 1) Remove broad tenant-only policies
DROP POLICY IF EXISTS "Tenant users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Tenant users can insert messages" ON public.messages;

-- 2) Create staff-only policies scoped by tenant
CREATE POLICY "Staff can view tenant messages"
ON public.messages
FOR SELECT
USING (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can insert tenant messages"
ON public.messages
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

-- RLS already enabled on messages in this project; no changes needed there.
