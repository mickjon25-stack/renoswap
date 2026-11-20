-- RenoSwap 025 · Close leftover insert/token/storage/trade holes found in a
-- security review (AgsSwap port, reference only).
--
-- Update locks were already in place (listing status, bump, is_admin, billing).
-- This migration tightens INSERT paths and a few related checks.
-- It does not change: admin approve, owner edit/re-review, Stripe webhook
-- bumps (service_role), offer accept/decline (UPDATE), report resolve
-- (admin UPDATE), account deletion, or email unsubscribe (service_role
-- looks up prefs by token).
--
-- DO NOT apply until Michael approves. This file is not applied to production.

-- ---------------------------------------------------------------------------
-- 1. Listings: clients can't insert a pre-approved or pre-bumped listing
-- ---------------------------------------------------------------------------
create or replace function public.listings_sanitize_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_is_admin() then
    return new;
  end if;
  new.status := 'Pending Review';
  new.reject_reason := '';
  new.approved_at := null;
  new.expires_at := null;
  new.bumped_at := null;
  return new;
end;
$$;

drop trigger if exists listings_sanitize_insert on public.listings;
create trigger listings_sanitize_insert
  before insert on public.listings
  for each row execute function public.listings_sanitize_insert();

revoke all on function public.listings_sanitize_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Profiles: clients can't insert themselves as admin or on a paid plan
--    (UPDATE already locked by profiles_protect_admin / _billing).
-- ---------------------------------------------------------------------------
create or replace function public.profiles_sanitize_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.is_admin := false;
  new.stripe_customer_id := null;
  new.plan := 'free';
  new.plan_status := 'none';
  new.plan_period_end := null;
  new.subscribed := false;
  -- is_contractor stays self-serve. Role may only be Homeowner or Contractor.
  if new.role is distinct from 'Homeowner' and new.role is distinct from 'Contractor' then
    new.role := 'Homeowner';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sanitize_insert on public.profiles;
create trigger profiles_sanitize_insert
  before insert on public.profiles
  for each row execute function public.profiles_sanitize_insert();

revoke all on function public.profiles_sanitize_insert() from public, anon, authenticated;

-- App upserts only id, email, display_name (ignoreDuplicates). Tighten grants
-- so a crafted INSERT can't set is_admin / plan even if the trigger is bypassed.
revoke insert on table public.profiles from anon, authenticated;
grant insert (id, email, display_name) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Offers and reports must be created as Pending
-- ---------------------------------------------------------------------------
drop policy if exists "Users create offers" on public.offers;
create policy "Users create offers"
  on public.offers for insert
  with check (from_user_id = auth.uid() and status = 'Pending');

drop policy if exists "Authenticated create reports" on public.reports;
create policy "Authenticated create reports"
  on public.reports for insert
  with check (reporter_id = auth.uid() and status = 'Pending');

-- ---------------------------------------------------------------------------
-- 4. Notification unsubscribe tokens are not client-writable
--    (unsubscribe route uses service_role). Clients may still create their
--    row (user_id only) and flip the two alert toggles.
-- ---------------------------------------------------------------------------
revoke insert, update on table public.notification_prefs from authenticated;
grant select on table public.notification_prefs to authenticated;
grant insert (user_id, message_alerts, looking_for_alerts, updated_at)
  on table public.notification_prefs to authenticated;
grant update (message_alerts, looking_for_alerts, updated_at)
  on table public.notification_prefs to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Listing photo bucket: size cap + images only (avatars already limited)
-- ---------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 20971520,           -- 20 MB
       allowed_mime_types = array['image/*']
 where id = 'listing-photos';

-- ---------------------------------------------------------------------------
-- 6. Trade RPCs: don't treat NULL (deleted member) as a match, and don't
--    start or confirm a trade when one party is gone.
-- ---------------------------------------------------------------------------
create or replace function public.request_trade_complete(p_thread_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_thread public.threads;
  v_trade public.trades;
  v_poster uuid;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  select * into v_thread from public.threads where id = p_thread_id;
  if not found
     or (v_thread.participant_a is distinct from v_uid
         and v_thread.participant_b is distinct from v_uid) then
    raise exception 'Not your conversation';
  end if;
  if v_thread.participant_a is null or v_thread.participant_b is null then
    raise exception 'The other member deleted their account, so you can''t mark this trade complete';
  end if;
  select poster_id into v_poster from public.listings where id = v_thread.listing_id;
  if v_poster is null
     or (v_poster is distinct from v_thread.participant_a
         and v_poster is distinct from v_thread.participant_b) then
    raise exception 'This conversation is not about one of your listings';
  end if;
  select * into v_trade from public.trades where thread_id = p_thread_id;
  if found then
    if v_trade.status = 'Confirmed' then raise exception 'This trade is already confirmed'; end if;
    if v_trade.status = 'Pending' then raise exception 'Already waiting for confirmation'; end if;
    update public.trades set status = 'Pending', requested_by = v_uid, confirmed_at = null, created_at = now()
      where id = v_trade.id;
    return v_trade.id;
  end if;
  insert into public.trades (thread_id, listing_id, party_a, party_b, requested_by)
    values (p_thread_id, v_thread.listing_id, v_thread.participant_a, v_thread.participant_b, v_uid)
    returning id into v_trade.id;
  return v_trade.id;
end;
$$;

create or replace function public.respond_trade_complete(p_trade_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trade public.trades;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  select * into v_trade from public.trades where id = p_trade_id for update;
  if not found
     or (v_trade.party_a is distinct from v_uid
         and v_trade.party_b is distinct from v_uid) then
    raise exception 'Not your trade';
  end if;
  if v_trade.status <> 'Pending' then raise exception 'Nothing to confirm'; end if;
  if p_accept then
    if v_trade.party_a is null or v_trade.party_b is null then
      raise exception 'The other member deleted their account, so this trade can''t be confirmed';
    end if;
    if v_trade.requested_by = v_uid then
      raise exception 'The other member has to confirm';
    end if;
    update public.trades set status = 'Confirmed', confirmed_at = now() where id = p_trade_id;
  else
    update public.trades set status = 'Cancelled' where id = p_trade_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Verify: every public table has RLS, and the new locks are in place.
-- (Does not rewrite legacy table grants such as TRUNCATE; see review notes.)
-- ---------------------------------------------------------------------------
do $verify$
declare
  r record;
  missing text[] := '{}';
begin
  for r in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and not c.relrowsecurity
  loop
    missing := missing || ('RLS disabled: public.' || r.relname);
  end loop;

  if not exists (
    select 1 from pg_trigger
     where tgrelid = 'public.listings'::regclass
       and tgname = 'listings_sanitize_insert'
       and not tgisinternal
  ) then
    missing := missing || 'missing trigger listings_sanitize_insert';
  end if;

  if not exists (
    select 1 from pg_trigger
     where tgrelid = 'public.profiles'::regclass
       and tgname = 'profiles_sanitize_insert'
       and not tgisinternal
  ) then
    missing := missing || 'missing trigger profiles_sanitize_insert';
  end if;

  if has_column_privilege('authenticated', 'public.notification_prefs', 'unsubscribe_token', 'INSERT')
     or has_column_privilege('authenticated', 'public.notification_prefs', 'unsubscribe_token', 'UPDATE') then
    missing := missing || 'authenticated can still write notification_prefs.unsubscribe_token';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'INSERT')
     or has_column_privilege('authenticated', 'public.profiles', 'plan', 'INSERT') then
    missing := missing || 'authenticated can still insert profiles.is_admin or plan';
  end if;

  if not exists (
    select 1
      from storage.buckets
     where id = 'listing-photos'
       and file_size_limit is not null
       and allowed_mime_types is not null
  ) then
    missing := missing || 'listing-photos bucket still has no size/MIME limits';
  end if;

  if array_length(missing, 1) > 0 then
    raise exception 'RenoSwap 025 verification failed:%', E'\n  ' || array_to_string(missing, E'\n  ');
  end if;
end
$verify$;
