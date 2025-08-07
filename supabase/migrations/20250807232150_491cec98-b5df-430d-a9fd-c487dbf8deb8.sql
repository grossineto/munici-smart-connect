-- Multi-tenant migration: tenants, user_tenants, tenant_id columns, and tenant-scoped RLS

-- 1) Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  uf text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tenants enable row level security;

-- 2) User-tenants mapping (many-to-many)
create table if not exists public.user_tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role app_role default 'viewer'::app_role,
  created_at timestamptz default now(),
  unique (user_id, tenant_id)
);

alter table public.user_tenants enable row level security;

-- Policies for user_tenants
create policy if not exists "Users can view their own tenant memberships"
  on public.user_tenants for select
  using (auth.uid() = user_id);

create policy if not exists "Admins can manage user_tenants"
  on public.user_tenants for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- 3) Helper function to check tenant membership
create or replace function public.user_has_tenant(_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_tenants ut
    where ut.user_id = auth.uid()
      and ut.tenant_id = _tenant_id
  );
$$;

-- 4) Create a default tenant and capture its id
DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  insert into public.tenants (name, slug)
  values ('Tenant Padrão', 'default')
  on conflict (slug) do update set name = excluded.name
  returning id into default_tenant_id;

  -- 5) Add tenant_id columns (nullable for backfill)
  -- Social & News domain
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='social_mentions' and column_name='tenant_id'
  ) then
    alter table public.social_mentions add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='news_articles' and column_name='tenant_id'
  ) then
    alter table public.news_articles add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='news_analysis' and column_name='tenant_id'
  ) then
    alter table public.news_analysis add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='news_alerts' and column_name='tenant_id'
  ) then
    alter table public.news_alerts add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='news_sources' and column_name='tenant_id'
  ) then
    alter table public.news_sources add column tenant_id uuid;
  end if;

  -- Omnichannel domain
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='citizens' and column_name='tenant_id'
  ) then
    alter table public.citizens add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='requests' and column_name='tenant_id'
  ) then
    alter table public.requests add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='messages' and column_name='tenant_id'
  ) then
    alter table public.messages add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='appointments' and column_name='tenant_id'
  ) then
    alter table public.appointments add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='whatsapp_sessions' and column_name='tenant_id'
  ) then
    alter table public.whatsapp_sessions add column tenant_id uuid;
  end if;

  -- Shared / config tables
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='monitored_keywords' and column_name='tenant_id'
  ) then
    alter table public.monitored_keywords add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='analytics_metrics' and column_name='tenant_id'
  ) then
    alter table public.analytics_metrics add column tenant_id uuid;
  end if;

  -- 6) Backfill tenant_id with default tenant
  update public.social_mentions set tenant_id = default_tenant_id where tenant_id is null;
  update public.news_articles set tenant_id = default_tenant_id where tenant_id is null;
  update public.news_analysis set tenant_id = default_tenant_id where tenant_id is null;
  update public.news_alerts set tenant_id = default_tenant_id where tenant_id is null;
  update public.news_sources set tenant_id = default_tenant_id where tenant_id is null;

  update public.citizens set tenant_id = default_tenant_id where tenant_id is null;
  update public.requests set tenant_id = default_tenant_id where tenant_id is null;
  -- messages derive tenant via request when possible
  update public.messages m
  set tenant_id = coalesce(r.tenant_id, default_tenant_id)
  from public.requests r
  where m.request_id = r.id and m.tenant_id is null;
  update public.messages set tenant_id = default_tenant_id where tenant_id is null;

  update public.appointments set tenant_id = default_tenant_id where tenant_id is null;
  update public.whatsapp_sessions set tenant_id = default_tenant_id where tenant_id is null;

  update public.monitored_keywords set tenant_id = default_tenant_id where tenant_id is null;
  update public.analytics_metrics set tenant_id = default_tenant_id where tenant_id is null;

  -- 7) Set NOT NULL and FKs + indexes
  alter table public.social_mentions alter column tenant_id set not null;
  alter table public.news_articles alter column tenant_id set not null;
  alter table public.news_analysis alter column tenant_id set not null;
  alter table public.news_alerts alter column tenant_id set not null;
  alter table public.news_sources alter column tenant_id set not null;

  alter table public.citizens alter column tenant_id set not null;
  alter table public.requests alter column tenant_id set not null;
  alter table public.messages alter column tenant_id set not null;
  alter table public.appointments alter column tenant_id set not null;
  alter table public.whatsapp_sessions alter column tenant_id set not null;

  alter table public.monitored_keywords alter column tenant_id set not null;
  alter table public.analytics_metrics alter column tenant_id set not null;

  -- Add FKs (if not already present)
  begin
    alter table public.social_mentions add constraint social_mentions_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.news_articles add constraint news_articles_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.news_analysis add constraint news_analysis_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.news_alerts add constraint news_alerts_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.news_sources add constraint news_sources_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;

  begin
    alter table public.citizens add constraint citizens_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.requests add constraint requests_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.messages add constraint messages_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.appointments add constraint appointments_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.whatsapp_sessions add constraint whatsapp_sessions_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;

  begin
    alter table public.monitored_keywords add constraint monitored_keywords_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;
  begin
    alter table public.analytics_metrics add constraint analytics_metrics_tenant_fk foreign key (tenant_id) references public.tenants(id) on delete restrict;
  exception when duplicate_object then null; end;

  -- Indexes
  create index if not exists idx_social_mentions_tenant on public.social_mentions(tenant_id);
  create index if not exists idx_news_articles_tenant on public.news_articles(tenant_id);
  create index if not exists idx_news_analysis_tenant on public.news_analysis(tenant_id);
  create index if not exists idx_news_alerts_tenant on public.news_alerts(tenant_id);
  create index if not exists idx_news_sources_tenant on public.news_sources(tenant_id);

  create index if not exists idx_citizens_tenant on public.citizens(tenant_id);
  create index if not exists idx_requests_tenant on public.requests(tenant_id);
  create index if not exists idx_messages_tenant on public.messages(tenant_id);
  create index if not exists idx_appointments_tenant on public.appointments(tenant_id);
  create index if not exists idx_whatsapp_sessions_tenant on public.whatsapp_sessions(tenant_id);

  create index if not exists idx_monitored_keywords_tenant on public.monitored_keywords(tenant_id);
  create index if not exists idx_analytics_metrics_tenant on public.analytics_metrics(tenant_id);

  -- 8) Seed user_tenants: assign all existing users (from profiles) to default tenant if not already
  insert into public.user_tenants (user_id, tenant_id)
  select p.user_id, default_tenant_id
  from public.profiles p
  where not exists (
    select 1 from public.user_tenants ut where ut.user_id = p.user_id and ut.tenant_id = default_tenant_id
  );
END $$;

-- 9) RLS: Update policies to enforce tenant scoping

-- Helper macro comment: We'll drop permissive true policies and re-create tenant-based ones

-- social_mentions
drop policy if exists "Authenticated users can view social mentions" on public.social_mentions;
create policy "Tenant users can view social mentions" on public.social_mentions for select using (user_has_tenant(tenant_id));

-- Keep system insert/update (service role bypasses RLS); ensure authenticated users cannot insert/update unless tenant member
drop policy if exists "System can insert social mentions" on public.social_mentions;
create policy "System can insert social mentions" on public.social_mentions for insert with check (true);

drop policy if exists "System can update social mentions" on public.social_mentions;
create policy "System can update social mentions" on public.social_mentions for update using (true);

-- news_articles
drop policy if exists "Authenticated users can view news articles" on public.news_articles;
create policy "Tenant users can view news articles" on public.news_articles for select using (user_has_tenant(tenant_id));

drop policy if exists "System can insert news articles" on public.news_articles;
create policy "System can insert news articles" on public.news_articles for insert with check (true);

-- news_analysis
drop policy if exists "Authenticated users can view news analysis" on public.news_analysis;
create policy "Tenant users can view news analysis" on public.news_analysis for select using (user_has_tenant(tenant_id));

drop policy if exists "System can manage news analysis" on public.news_analysis;
create policy "System can manage news analysis" on public.news_analysis for all using (true) with check (true);

-- news_alerts
drop policy if exists "Authenticated users can view news alerts" on public.news_alerts;
create policy "Tenant users can view news alerts" on public.news_alerts for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can update news alerts" on public.news_alerts;
create policy "Tenant users can update news alerts" on public.news_alerts for update using (user_has_tenant(tenant_id));

-- news_sources
drop policy if exists "Authenticated users can view news sources" on public.news_sources;
create policy "Tenant users can view news sources" on public.news_sources for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can manage news sources" on public.news_sources;
create policy "Tenant users can manage news sources" on public.news_sources for all using (user_has_tenant(tenant_id)) with check (user_has_tenant(tenant_id));

-- citizens
drop policy if exists "Authenticated users can view citizens" on public.citizens;
create policy "Tenant users can view citizens" on public.citizens for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert citizens" on public.citizens;
create policy "Tenant users can insert citizens" on public.citizens for insert with check (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can update citizens" on public.citizens;
create policy "Tenant users can update citizens" on public.citizens for update using (user_has_tenant(tenant_id));

-- requests
drop policy if exists "Authenticated users can view requests" on public.requests;
create policy "Tenant users can view requests" on public.requests for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert requests" on public.requests;
create policy "Tenant users can insert requests" on public.requests for insert with check (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can update requests" on public.requests;
create policy "Tenant users can update requests" on public.requests for update using (user_has_tenant(tenant_id));

-- messages
drop policy if exists "Authenticated users can view messages" on public.messages;
create policy "Tenant users can view messages" on public.messages for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Tenant users can insert messages" on public.messages for insert with check (user_has_tenant(tenant_id));

-- appointments
drop policy if exists "Authenticated users can view appointments" on public.appointments;
create policy "Tenant users can view appointments" on public.appointments for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert appointments" on public.appointments;
create policy "Tenant users can insert appointments" on public.appointments for insert with check (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can update appointments" on public.appointments;
create policy "Tenant users can update appointments" on public.appointments for update using (user_has_tenant(tenant_id));

-- whatsapp_sessions
drop policy if exists "Authenticated users can view whatsapp sessions" on public.whatsapp_sessions;
create policy "Tenant users can view whatsapp sessions" on public.whatsapp_sessions for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert whatsapp sessions" on public.whatsapp_sessions;
create policy "Tenant users can insert whatsapp sessions" on public.whatsapp_sessions for insert with check (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can update whatsapp sessions" on public.whatsapp_sessions;
create policy "Tenant users can update whatsapp sessions" on public.whatsapp_sessions for update using (user_has_tenant(tenant_id));

-- monitored_keywords
drop policy if exists "Authenticated users can manage monitored keywords" on public.monitored_keywords;
create policy "Tenant users can manage monitored keywords" on public.monitored_keywords for all using (user_has_tenant(tenant_id)) with check (user_has_tenant(tenant_id));

-- analytics_metrics
drop policy if exists "Authenticated users can view analytics metrics" on public.analytics_metrics;
create policy "Tenant users can view analytics metrics" on public.analytics_metrics for select using (user_has_tenant(tenant_id));

drop policy if exists "Authenticated users can insert analytics metrics" on public.analytics_metrics;
create policy "Tenant users can insert analytics metrics" on public.analytics_metrics for insert with check (user_has_tenant(tenant_id));
