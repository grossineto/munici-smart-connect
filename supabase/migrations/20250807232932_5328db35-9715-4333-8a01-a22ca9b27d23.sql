-- Retry without IF NOT EXISTS in policies
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  retention_days_social integer not null default 180,
  retention_days_news integer not null default 180,
  retention_days_messages integer not null default 180,
  retention_days_requests integer not null default 365,
  retention_days_analytics integer not null default 365,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id)
);

alter table public.tenant_settings enable row level security;

drop function if exists public.is_admin();
create function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(has_role(auth.uid(), 'admin'::app_role), false)
$$;

-- Reset tenant_settings policies
drop policy if exists "Tenant users can view tenant_settings" on public.tenant_settings;
drop policy if exists "Admins can manage tenant_settings" on public.tenant_settings;
create policy "Tenant users can view tenant_settings"
  on public.tenant_settings for select using (user_has_tenant(tenant_id));
create policy "Admins can manage tenant_settings"
  on public.tenant_settings for all using (is_admin()) with check (is_admin());

DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  select id into default_tenant_id from public.tenants where slug = 'default' limit 1;
  if default_tenant_id is not null then
    insert into public.tenant_settings (tenant_id)
    values (default_tenant_id)
    on conflict (tenant_id) do nothing;
  end if;
END $$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_role app_role,
  actor_type text not null default 'user',
  tenant_id uuid,
  table_name text not null,
  row_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb
);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins and moderators can view audit logs" on public.audit_logs;
drop policy if exists "Allow inserts via trigger only" on public.audit_logs;
create policy "Admins and moderators can view audit logs"
  on public.audit_logs for select using (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
create policy "Allow inserts via trigger only"
  on public.audit_logs for insert with check (pg_trigger_depth() > 0);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer set search_path = public as $$
DECLARE
  v_actor uuid := auth.uid();
  v_role app_role;
  v_tenant uuid;
  v_old jsonb;
  v_new jsonb;
  v_actor_type text := 'user';
BEGIN
  IF v_actor IS NULL THEN v_actor_type := 'system'; END IF;
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    IF to_jsonb(OLD) ? 'tenant_id' THEN v_tenant := (OLD).tenant_id; END IF;
    SELECT public.get_user_role(v_actor) INTO v_role;
    INSERT INTO public.audit_logs(occurred_at, actor_user_id, actor_role, actor_type, tenant_id, table_name, row_id, action, old_data)
    VALUES (now(), v_actor, v_role, v_actor_type, v_tenant, TG_TABLE_NAME, OLD.id, 'delete', v_old);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    IF to_jsonb(NEW) ? 'tenant_id' THEN v_tenant := (NEW).tenant_id; END IF;
    SELECT public.get_user_role(v_actor) INTO v_role;
    INSERT INTO public.audit_logs(occurred_at, actor_user_id, actor_role, actor_type, tenant_id, table_name, row_id, action, old_data, new_data)
    VALUES (now(), v_actor, v_role, v_actor_type, v_tenant, TG_TABLE_NAME, NEW.id, 'update', v_old, v_new);
    RETURN NEW;
  ELSE
    v_new := to_jsonb(NEW);
    IF to_jsonb(NEW) ? 'tenant_id' THEN v_tenant := (NEW).tenant_id; END IF;
    SELECT public.get_user_role(v_actor) INTO v_role;
    INSERT INTO public.audit_logs(occurred_at, actor_user_id, actor_role, actor_type, tenant_id, table_name, row_id, action, new_data)
    VALUES (now(), v_actor, v_role, v_actor_type, v_tenant, TG_TABLE_NAME, NEW.id, 'insert', v_new);
    RETURN NEW;
  END IF;
END;$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_social_mentions') THEN
    CREATE TRIGGER tr_audit_social_mentions AFTER INSERT OR UPDATE OR DELETE ON public.social_mentions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_news_articles') THEN
    CREATE TRIGGER tr_audit_news_articles AFTER INSERT OR UPDATE OR DELETE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_news_analysis') THEN
    CREATE TRIGGER tr_audit_news_analysis AFTER INSERT OR UPDATE OR DELETE ON public.news_analysis FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_news_alerts') THEN
    CREATE TRIGGER tr_audit_news_alerts AFTER INSERT OR UPDATE OR DELETE ON public.news_alerts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_news_sources') THEN
    CREATE TRIGGER tr_audit_news_sources AFTER INSERT OR UPDATE OR DELETE ON public.news_sources FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_citizens') THEN
    CREATE TRIGGER tr_audit_citizens AFTER INSERT OR UPDATE OR DELETE ON public.citizens FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_requests') THEN
    CREATE TRIGGER tr_audit_requests AFTER INSERT OR UPDATE OR DELETE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_messages') THEN
    CREATE TRIGGER tr_audit_messages AFTER INSERT OR UPDATE OR DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_appointments') THEN
    CREATE TRIGGER tr_audit_appointments AFTER INSERT OR UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_whatsapp_sessions') THEN
    CREATE TRIGGER tr_audit_whatsapp_sessions AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_monitored_keywords') THEN
    CREATE TRIGGER tr_audit_monitored_keywords AFTER INSERT OR UPDATE OR DELETE ON public.monitored_keywords FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_analytics_metrics') THEN
    CREATE TRIGGER tr_audit_analytics_metrics AFTER INSERT OR UPDATE OR DELETE ON public.analytics_metrics FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
END $$;

create index if not exists idx_audit_logs_tenant_time on public.audit_logs(tenant_id, occurred_at desc);
create index if not exists idx_audit_logs_table on public.audit_logs(table_name);

-- Tenants RLS policies
drop policy if exists "Tenants select" on public.tenants;
drop policy if exists "Tenants manage by admins" on public.tenants;
create policy "Tenants select" on public.tenants for select using (user_has_tenant(id) OR is_admin());
create policy "Tenants manage by admins" on public.tenants for all using (is_admin()) with check (is_admin());

-- Schedule via pg_cron calling Edge Function
select cron.unschedule(jobid) from cron.job where jobname = 'daily-data-retention-cleaner';
select cron.schedule(
  'daily-data-retention-cleaner',
  '0 3 * * *',
  $$
  select net.http_post(
    url:='https://iibhnjdyteqblzrfiyah.supabase.co/functions/v1/data-retention-cleaner',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYmhuamR5dGVxYmx6cmZpeWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Nzc3MTgsImV4cCI6MjA2OTU1MzcxOH0.WV5QczLTAJ10L2KFjv8PhQqXTkzCwN0lE1IG0WV5yxY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
