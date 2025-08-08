-- Grant Joao (joao@elesu.com.br) access by linking his user to the default tenant
-- Ensure default tenant exists, then add membership and operator role

-- 1) Create default tenant if missing and capture its id
WITH upsert_tenant AS (
  INSERT INTO public.tenants (slug, name)
  SELECT 'default', 'Tenant Padrão'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'default')
  RETURNING id
), t AS (
  SELECT id FROM upsert_tenant
  UNION ALL
  SELECT id FROM public.tenants WHERE slug = 'default' LIMIT 1
), u AS (
  SELECT '82e344f0-db42-4f7e-b85a-972eeb13db12'::uuid AS user_id
)
-- 2) Link user to tenant as operator (only if not already linked)
INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.user_id, t.id, 'operator'::app_role
FROM u, t
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_tenants ut WHERE ut.user_id = u.user_id AND ut.tenant_id = t.id
);

-- 3) Set application role to operator (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT '82e344f0-db42-4f7e-b85a-972eeb13db12'::uuid, 'operator'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = '82e344f0-db42-4f7e-b85a-972eeb13db12'::uuid AND ur.role = 'operator'::app_role
);
