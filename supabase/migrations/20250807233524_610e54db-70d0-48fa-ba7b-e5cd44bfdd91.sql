-- Apply retention policy: Social 90 days for all tenants
-- 1) Ensure settings exist for all tenants
insert into public.tenant_settings (tenant_id)
select t.id
from public.tenants t
left join public.tenant_settings s on s.tenant_id = t.id
where s.tenant_id is null;

-- 2) Update existing rows to 90 days for social mentions
update public.tenant_settings
set retention_days_social = 90;

-- 3) Set default for new rows
alter table public.tenant_settings
  alter column retention_days_social set default 90;