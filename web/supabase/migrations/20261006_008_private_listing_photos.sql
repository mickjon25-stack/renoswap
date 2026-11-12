-- H1: listing photos for unapproved listings were publicly downloadable and
-- both buckets allowed anonymous folder listing.
--
-- listing-photos: bucket becomes PRIVATE. The app renders photos through
-- short-lived signed URLs (web/src/lib/listing-photos.ts). A caller may sign /
-- download a photo only if they can see its listing_photos row, which RLS
-- already limits to Approved/Claimed listings for everyone, plus the owner and
-- admins for Pending/Rejected/Expired. Listing the bucket is only allowed
-- inside your own folder (needed for upsert uploads).
--
-- avatars: stays PUBLIC (profile pictures are meant to be public; public URLs
-- bypass RLS). The blanket SELECT policy is dropped so anonymous users can no
-- longer list folders; owners can still list/replace their own avatar.

update storage.buckets set public = false where id = 'listing-photos';

drop policy if exists "Listing photos are publicly accessible" on storage.objects;
drop policy if exists "Read photos of visible listings" on storage.objects;
create policy "Read photos of visible listings"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'listing-photos'
    and storage.allow_any_operation(array[
      'object.sign',
      'object.sign_many',
      'object.get_authenticated',
      'object.get_authenticated_info',
      'object.head_authenticated_info',
      'object.info_authenticated'
    ])
    -- RLS on listing_photos/listings decides visibility for the caller.
    and exists (
      select 1 from public.listing_photos lp
      where lp.storage_path = storage.objects.name
    )
  );

drop policy if exists "Owners read own listing photo folder" on storage.objects;
create policy "Owners read own listing photo folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Owners read own avatar folder" on storage.objects;
create policy "Owners read own avatar folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
