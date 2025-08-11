-- Ensure required extension
create extension if not exists pgcrypto with schema public;

-- Create enum for roles if missing and ensure values exist
create type if not exists public.app_role as enum ('admin', 'moderator', 'operator', 'viewer');
alter type public.app_role add value if not exists 'admin';
alter type public.app_role add value if not exists 'moderator';
alter type public.app_role add value if not exists 'operator';
alter type public.app_role add value if not exists 'viewer';

-- Create user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create has_role function (security definer) to be used in policies
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Drop existing policies if any (idempotent)
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Users can view their own roles') then
    drop policy "Users can view their own roles" on public.user_roles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can view all roles') then
    drop policy "Admins can view all roles" on public.user_roles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can insert roles') then
    drop policy "Admins can insert roles" on public.user_roles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can update roles') then
    drop policy "Admins can update roles" on public.user_roles;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can delete roles') then
    drop policy "Admins can delete roles" on public.user_roles;
  end if;
end $$;

-- Policies
create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
  on public.user_roles
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
  on public.user_roles
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
  on public.user_roles
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Promote the requested email to admin if present in auth.users
insert into public.user_roles (user_id, role, assigned_by)
select u.id, 'admin'::public.app_role, u.id
from auth.users u
where u.email = 'joao@elesu.com.br'
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = u.id and ur.role = 'admin'
  );