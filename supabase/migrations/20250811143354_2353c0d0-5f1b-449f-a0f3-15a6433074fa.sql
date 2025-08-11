-- Ensure a profile exists for the admin user and set role to admin
insert into public.profiles (user_id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', u.email), 'admin'::public.app_role
from auth.users u
where u.email = 'joao@elesu.com.br'
  and not exists (
    select 1 from public.profiles p where p.user_id = u.id
  );

update public.profiles p
set role = 'admin'::public.app_role
from auth.users u
where p.user_id = u.id
  and u.email = 'joao@elesu.com.br';