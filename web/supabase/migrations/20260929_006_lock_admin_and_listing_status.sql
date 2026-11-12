-- C1/C2: Lock admin self-promote and listing self-approve (2026-09-29 audit).
-- Clients cannot set profiles.is_admin or role='Admin'; only service_role can.
-- Listing moderation fields (status, approved_at, reject_reason, expires_at)
-- may only change via service_role or current_is_admin().
-- Also fix mutable search_path on related trigger helpers.

-- ---------------------------------------------------------------------------
-- C1a. Column privilege: no client UPDATE on is_admin
-- Table-level UPDATE makes REVOKE UPDATE (is_admin) a no-op, so revoke table
-- UPDATE then re-grant only safe columns. Billing cols stay trigger-locked too.
-- (Live also has follow-up migration lock_admin_column_grants for the same fix.)
-- ---------------------------------------------------------------------------
revoke update on table public.profiles from anon, authenticated;

grant update (
  display_name,
  email,
  city,
  zip,
  bio,
  company,
  role,
  avatar_url,
  is_contractor,
  profile_complete,
  updated_at
) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- C1b. Trigger: freeze is_admin; clients may only set Homeowner/Contractor role
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Never allow clients to flip the admin flag
  new.is_admin := old.is_admin;

  -- Clients may change role only between Homeowner and Contractor.
  -- Any other value (including Admin) is forced back to the previous role.
  if new.role is distinct from old.role
     and new.role is distinct from 'Homeowner'
     and new.role is distinct from 'Contractor' then
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

-- ---------------------------------------------------------------------------
-- C2. Trigger: freeze listing moderation fields for non-admins
-- Owners may still edit title, description, price, etc.
-- Admin UI (AdminActions.tsx) continues to work via current_is_admin().
-- Stripe webhook (service_role) is unaffected (also keeps bumped_at protect).
-- ---------------------------------------------------------------------------
create or replace function public.protect_listing_moderation_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if public.current_is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.approved_at is distinct from old.approved_at
     or new.reject_reason is distinct from old.reject_reason
     or new.expires_at is distinct from old.expires_at then
    raise exception 'Only admins can change listing moderation fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_protect_moderation on public.listings;
create trigger listings_protect_moderation
  before update on public.listings
  for each row execute function public.protect_listing_moderation_fields();

-- ---------------------------------------------------------------------------
-- Harden search_path on helpers we touch / that advisors flag
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.stripe_customer_id := old.stripe_customer_id;
  new.plan := old.plan;
  new.plan_status := old.plan_status;
  new.plan_period_end := old.plan_period_end;
  new.subscribed := old.subscribed;
  return new;
end;
$$;

create or replace function public.protect_listing_bumped_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.bumped_at := old.bumped_at;
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_texas_zip(zip text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    zip ~ '^\d{5}$'
    and left(zip, 3) in (
      '733', '885',
      '750','751','752','753','754','755','756','757','758','759',
      '760','761','762','763','764','765','766','767','768','769',
      '770','771','772','773','774','775','776','777','778','779',
      '780','781','782','783','784','785','786','787','788','789',
      '790','791','792','793','794','795','796','797','798','799'
    );
$$;

-- Ensure current_is_admin stays SECURITY DEFINER with fixed search_path
-- (AdminActions client updates rely on this returning true for real admins)
create or replace function public.current_is_admin()
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

notify pgrst, 'reload schema';
