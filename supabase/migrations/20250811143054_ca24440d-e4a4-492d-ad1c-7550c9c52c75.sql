-- Promote specific email to admin in user_roles (idempotent)
insert into public.user_roles (user_id, role, assigned_by)
select u.id, 'admin'::public.app_role, u.id
from auth.users u
where u.email = 'joao@elesu.com.br'
on conflict (user_id, role) do nothing;

-- Ensure the profile.role reflects admin for this user
update public.profiles p
set role = 'admin'::public.app_role
from auth.users u
where p.user_id = u.id
  and u.email = 'joao@elesu.com.br';