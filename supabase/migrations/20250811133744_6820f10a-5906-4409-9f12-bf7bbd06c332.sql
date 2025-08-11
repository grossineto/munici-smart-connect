-- Harden inserts on news_alerts to prevent fake alerts
DROP POLICY IF EXISTS "System can insert news alerts" ON public.news_alerts;

CREATE POLICY "Staff can insert tenant news alerts"
ON public.news_alerts
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);
