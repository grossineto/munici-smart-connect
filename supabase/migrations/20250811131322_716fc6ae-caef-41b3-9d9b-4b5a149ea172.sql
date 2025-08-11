-- Secure system-allowed tables to be tenant-scoped and staff-only
-- 1) Drop permissive policies that used TRUE
DROP POLICY IF EXISTS "System can manage news analysis" ON public.news_analysis;
DROP POLICY IF EXISTS "System can insert news articles" ON public.news_articles;
DROP POLICY IF EXISTS "System can insert social mentions" ON public.social_mentions;
DROP POLICY IF EXISTS "System can update social mentions" ON public.social_mentions;

-- 2) news_analysis: allow only staff of the same tenant to mutate
CREATE POLICY "Staff can insert tenant news_analysis"
ON public.news_analysis
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can update tenant news_analysis"
ON public.news_analysis
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

CREATE POLICY "Staff can delete tenant news_analysis"
ON public.news_analysis
FOR DELETE
USING (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

-- 3) news_articles: restrict inserts to staff within tenant (service role bypasses RLS anyway)
CREATE POLICY "Staff can insert tenant news_articles"
ON public.news_articles
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

-- 4) social_mentions: restrict insert/update to staff within tenant
CREATE POLICY "Staff can insert tenant social_mentions"
ON public.social_mentions
FOR INSERT
WITH CHECK (
  public.user_has_tenant(tenant_id)
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    OR public.has_role(auth.uid(), 'operator'::public.app_role)
  )
);

CREATE POLICY "Staff can update tenant social_mentions"
ON public.social_mentions
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
