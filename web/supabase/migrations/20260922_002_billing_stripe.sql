-- RenoSwap billing: Stripe plan fields + listing bumps
-- Apply via Supabase MCP apply_migration or SQL editor.

-- ---------------------------------------------------------------------------
-- Profiles: Stripe / plan columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists plan text not null default 'free',
  add column if not exists plan_status text not null default 'none',
  add column if not exists plan_period_end timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_check
      check (plan in ('free', 'homeowner', 'contractor'));
  end if;
end $$;

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_idx on public.profiles (plan);

comment on column public.profiles.stripe_customer_id is 'Stripe Customer id; set by server/webhook only';
comment on column public.profiles.plan is 'free | homeowner | contractor';
comment on column public.profiles.plan_status is 'Stripe subscription status (none|active|trialing|past_due|canceled|…)';
comment on column public.profiles.plan_period_end is 'Current period end from Stripe subscription';
comment on column public.profiles.subscribed is 'Derived convenience: true when plan is paid and status is active/trialing';

-- ---------------------------------------------------------------------------
-- Listings: bump timestamp
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists bumped_at timestamptz;

create index if not exists listings_bumped_at_idx
  on public.listings (bumped_at desc nulls last);

comment on column public.listings.bumped_at is 'Last paid bump; boosts Browse sort for 7 days. Set by webhook only.';

-- ---------------------------------------------------------------------------
-- Protect billing columns on profiles (clients cannot self-grant plans)
-- Service role (webhook) bypasses via auth.role() = service_role
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
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

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing_fields();

-- ---------------------------------------------------------------------------
-- Protect bumped_at on listings (clients cannot free-bump)
-- ---------------------------------------------------------------------------
create or replace function public.protect_listing_bumped_at()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.bumped_at := old.bumped_at;
  return new;
end;
$$;

drop trigger if exists listings_protect_bumped_at on public.listings;
create trigger listings_protect_bumped_at
  before update on public.listings
  for each row execute function public.protect_listing_bumped_at();

-- RLS already allows users to SELECT own profile (and everyone can read profiles).
-- Billing fields are readable; only service role / webhook may change them (trigger).
