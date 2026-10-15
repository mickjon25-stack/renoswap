-- Enforce active-listing caps in the database (the /post page check is client-side only).
-- Free = 3, Homeowner (active/trialing) = 10, Contractor (active/trialing) = 25.
-- Active = Pending Review + Approved + Claimed. Service role and admins bypass.

create or replace function public.listing_cap_for_user(uid uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.plan = 'contractor' and lower(p.plan_status) in ('active','trialing') then 25
    when p.plan = 'homeowner'  and lower(p.plan_status) in ('active','trialing') then 10
    else 3
  end
  from public.profiles p where p.id = uid
$$;

create or replace function public.enforce_listing_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  cap integer;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    return new;
  end if;
  if new.status not in ('Pending Review','Approved','Claimed') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('Pending Review','Approved','Claimed') then
    return new; -- already counted; not a new activation
  end if;

  select count(*) into active_count
  from public.listings
  where poster_id = new.poster_id
    and status in ('Pending Review','Approved','Claimed')
    and id is distinct from new.id;

  cap := coalesce(public.listing_cap_for_user(new.poster_id), 3);
  if active_count >= cap then
    raise exception 'listing_cap_reached: % of % active listings used. Upgrade on /billing.', active_count, cap
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_enforce_cap on public.listings;
create trigger listings_enforce_cap
  before insert or update of status on public.listings
  for each row execute function public.enforce_listing_cap();
