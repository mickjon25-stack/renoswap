-- Browse must not show Approved/Claimed listings with zero photos.
-- Block approve without ≥1 listing_photos row; if the last photo is removed
-- from an active listing, kick it back to Pending Review.

create or replace function public.listing_has_photo(p_listing uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.listing_photos p
    where p.listing_id = p_listing
      and coalesce(trim(p.storage_path), '') <> ''
  );
$$;

revoke all on function public.listing_has_photo(uuid) from public, anon;
grant execute on function public.listing_has_photo(uuid) to authenticated, service_role;

create or replace function public.require_photo_for_active_listing()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status in ('Approved', 'Claimed') and not public.listing_has_photo(new.id) then
    raise exception 'Add at least one photo before approving this listing'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_require_photo_for_active on public.listings;
create trigger listings_require_photo_for_active
  before insert or update of status on public.listings
  for each row execute function public.require_photo_for_active_listing();

-- If the last real photo is deleted from an Approved/Claimed listing, un-approve.
create or replace function public.listing_photos_guard_last_photo()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_left int;
  v_status text;
begin
  select count(*)::int into v_left
  from public.listing_photos
  where listing_id = old.listing_id
    and id is distinct from old.id
    and coalesce(trim(storage_path), '') <> '';

  if v_left > 0 then
    return old;
  end if;

  select status into v_status from public.listings where id = old.listing_id;
  if v_status in ('Approved', 'Claimed') then
    update public.listings
       set status = 'Pending Review',
           approved_at = null,
           reject_reason = 'Needs a photo before it can stay on Browse'
     where id = old.listing_id;
  end if;
  return old;
end;
$$;

drop trigger if exists listing_photos_guard_last on public.listing_photos;
create trigger listing_photos_guard_last
  before delete on public.listing_photos
  for each row execute function public.listing_photos_guard_last_photo();

-- Soft-unapprove any currently active listings that somehow have no photos.
update public.listings l
   set status = 'Pending Review',
       approved_at = null,
       reject_reason = 'Needs a photo before it can stay on Browse'
 where l.status in ('Approved', 'Claimed')
   and not public.listing_has_photo(l.id);

notify pgrst, 'reload schema';
