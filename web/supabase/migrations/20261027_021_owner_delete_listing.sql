-- Soft-delete: owners (or admins) can remove a listing from Browse without
-- cascading away offers/threads. Status "Deleted" is not publicly readable.

alter table public.listings drop constraint listings_status_check;
alter table public.listings
  add constraint listings_status_check
  check (status = any (array[
    'Pending Review'::text,
    'Approved'::text,
    'Claimed'::text,
    'Rejected'::text,
    'Expired'::text,
    'Deleted'::text
  ]));

-- Owner/admin soft-delete. SECURITY DEFINER so moderation trigger does not
-- block the status change; auth.uid() still identifies the caller.
create or replace function public.delete_own_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poster uuid;
  v_status text;
  v_is_admin boolean := public.current_is_admin();
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select poster_id, status into v_poster, v_status
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_poster <> auth.uid() and not v_is_admin then
    raise exception 'Only the owner or an admin can delete this listing'
      using errcode = '42501';
  end if;

  if v_status = 'Deleted' then
    return;
  end if;

  update public.listings
  set
    status = 'Deleted',
    reject_reason = case
      when v_is_admin and v_poster <> auth.uid() then 'Removed by admin'
      else 'Removed by owner'
    end,
    expires_at = null,
    updated_at = now()
  where id = p_listing_id;

  -- Close open offers on this listing; leave Accepted history alone.
  update public.offers
  set status = 'Withdrawn', updated_at = now()
  where listing_id = p_listing_id
    and status = 'Pending';
end;
$$;

revoke all on function public.delete_own_listing(uuid) from public, anon;
grant execute on function public.delete_own_listing(uuid) to authenticated;

notify pgrst, 'reload schema';

-- Allow listing owners to soft-delete (status → Deleted) despite moderation lock.
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

  -- Owner soft-delete only: any prior status → Deleted (approved_at unchanged)
  if new.poster_id = auth.uid()
     and old.status is distinct from 'Deleted'
     and new.status = 'Deleted'
     and new.approved_at is not distinct from old.approved_at then
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
