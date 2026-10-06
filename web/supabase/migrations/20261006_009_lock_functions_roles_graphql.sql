-- M3: SECURITY DEFINER helpers were executable by anon/authenticated via
-- /rest/v1/rpc. H2: public role='Admin' label. M4: pg_graphql exposure.

-- 1. current_is_admin(): RLS policies need every role to evaluate it, so keep
--    the SECURITY DEFINER body but move it to a non-API schema. Policies keep
--    pointing at it (they reference the function, not its name). A thin
--    SECURITY INVOKER wrapper stays in public for triggers/functions that call
--    public.current_is_admin() by name.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'current_is_admin'
      and pronamespace = 'public'::regnamespace
      and prosecdef
  ) then
    alter function public.current_is_admin() set schema private;
  end if;
end $$;

create or replace function private.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;
revoke all on function private.current_is_admin() from public;
grant execute on function private.current_is_admin() to anon, authenticated, service_role;

create or replace function public.current_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.current_is_admin();
$$;
grant execute on function public.current_is_admin() to anon, authenticated, service_role;

-- 2. Trigger-only functions: nobody needs to call them directly. Triggers fire
--    regardless of EXECUTE grants. listing_cap_for_user is only used inside the
--    SECURITY DEFINER cap trigger (it leaked any user's plan tier to anon).
revoke execute on function public.listing_cap_for_user(uuid) from public, anon, authenticated;
revoke execute on function public.enforce_listing_cap() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_listing_bumped_at() from public, anon, authenticated;
revoke execute on function public.protect_listing_moderation_fields() from public, anon, authenticated;
revoke execute on function public.protect_profile_admin_fields() from public, anon, authenticated;
revoke execute on function public.protect_profile_billing_fields() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 3. role='Admin' is only a label; real admin is profiles.is_admin. Clear the
--    label on non-admins and make it impossible to store it without is_admin
--    (the profiles_protect_admin trigger already strips client attempts).
update public.profiles set role = 'Homeowner' where role = 'Admin' and not is_admin;
alter table public.profiles drop constraint if exists profiles_admin_role_requires_is_admin;
alter table public.profiles
  add constraint profiles_admin_role_requires_is_admin
  check (role <> 'Admin' or is_admin);

-- 4. The app uses PostgREST only; GraphQL is unused. Dropping pg_graphql removes
--    the /graphql/v1 schema exposure (re-enable any time in Database → Extensions).
drop extension if exists pg_graphql;
