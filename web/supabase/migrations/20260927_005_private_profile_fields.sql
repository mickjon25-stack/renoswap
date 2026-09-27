-- Hide private profile fields from the public API.
-- Before: "Profiles are viewable by everyone" + table-wide SELECT meant anyone with
-- the public (anon) key could read every user's email, ZIP and billing fields.
-- After: anon/authenticated can SELECT only public columns. Users read their own
-- full row via get_my_profile(); admins can read anyone's via admin_get_profile();
-- the server (service_role) is unaffected.

-- Public columns (shown on listings, inbox, header):
--   id, display_name, city, bio, company, role, avatar_url, is_contractor,
--   profile_complete, created_at, updated_at
-- Private columns: email, zip, is_admin, subscribed, stripe_customer_id,
--   plan, plan_status, plan_period_end

revoke select on table public.profiles from anon, authenticated;
grant select (
  id, display_name, city, bio, company, role, avatar_url, is_contractor,
  profile_complete, created_at, updated_at
) on table public.profiles to anon, authenticated;

-- The signed-in user's own full profile row.
create or replace function public.get_my_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.profiles where id = auth.uid();
$$;

-- Any profile's full row, admins only (returns nothing for non-admins).
create or replace function public.admin_get_profile(p_id uuid)
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.* from public.profiles p
  where p.id = p_id and public.current_is_admin();
$$;

revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.admin_get_profile(uuid) from public, anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.admin_get_profile(uuid) to authenticated;

notify pgrst, 'reload schema';
