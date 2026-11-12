-- Owner edit listing + anti bait-and-switch re-review.
-- * If a non-admin owner changes title, description, category, condition or
--   "looking for" on an Approved/Claimed listing, it goes back to Pending Review
--   (leaves Browse) until an admin re-approves. Same if they add or delete a photo.
-- * Editing a Rejected listing's content resubmits it as Pending Review.
-- * Price, intent, location, pickup/shipping flags stay live.
-- * Owners still cannot set Approved/Claimed/etc. themselves.
-- No new tables (so no new GRANTs needed).

create or replace function public.protect_listing_moderation_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_content_changed boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if public.current_is_admin() then
    return new;
  end if;

  -- Owner soft-delete only: Pending/Approved/Claimed/Rejected/Expired -> Deleted
  if new.poster_id = auth.uid()
     and old.status is distinct from 'Deleted'
     and new.status = 'Deleted'
     and new.approved_at is not distinct from old.approved_at then
    return new;
  end if;

  if old.status = 'Deleted' then
    raise exception 'Deleted listings cannot be edited' using errcode = '42501';
  end if;

  -- Owner downgrade back to review (used by the photo-change trigger and edits).
  -- Never lets an owner raise a listing to Approved.
  if new.poster_id = auth.uid()
     and new.status = 'Pending Review'
     and old.status in ('Approved', 'Claimed', 'Rejected')
     and new.expires_at is not distinct from old.expires_at then
    new.approved_at := null;
    return new;
  end if;

  v_content_changed :=
       new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.category is distinct from old.category
    or new.condition is distinct from old.condition
    or new.looking_for is distinct from old.looking_for;

  -- Bait-and-switch guard: content edits on live or rejected listings re-enter review.
  if v_content_changed
     and new.status is not distinct from old.status
     and old.status in ('Approved', 'Claimed', 'Rejected')
     and new.approved_at is not distinct from old.approved_at
     and new.reject_reason is not distinct from old.reject_reason
     and new.expires_at is not distinct from old.expires_at then
    new.status := 'Pending Review';
    new.approved_at := null;
    new.reject_reason := '';
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

-- Photo added/removed by the owner on a live listing -> back to review.
create or replace function public.listing_photos_rereview()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_listing uuid := coalesce(new.listing_id, old.listing_id);
begin
  if auth.role() = 'service_role' or public.current_is_admin() then
    return null;
  end if;
  update public.listings
     set status = 'Pending Review', approved_at = null
   where id = v_listing
     and poster_id = auth.uid()
     and status in ('Approved', 'Claimed');
  return null;
end;
$$;

drop trigger if exists listing_photos_rereview on public.listing_photos;
create trigger listing_photos_rereview
  after insert or delete on public.listing_photos
  for each row execute function public.listing_photos_rereview();

-- Owners need to read their photos' DB rows to delete them (already allowed by
-- "Read listing photos"); owner photo delete is allowed by "Owners delete listing photos".
-- Block deleting the last photo on any non-deleted listing (keep at least 1).
create or replace function public.listing_photos_keep_one()
returns trigger
language plpgsql
set search_path = public
as $$
declare v_left int; v_status text;
begin
  if auth.role() = 'service_role' or public.current_is_admin() then
    return old;
  end if;
  select status into v_status from public.listings where id = old.listing_id;
  if v_status is null or v_status = 'Deleted' then
    return old;
  end if;
  select count(*) into v_left from public.listing_photos
   where listing_id = old.listing_id and id <> old.id;
  if v_left < 1 then
    raise exception 'Keep at least one photo on your listing' using errcode = '23514';
  end if;
  return old;
end;
$$;

drop trigger if exists listing_photos_keep_one on public.listing_photos;
create trigger listing_photos_keep_one
  before delete on public.listing_photos
  for each row execute function public.listing_photos_keep_one();
