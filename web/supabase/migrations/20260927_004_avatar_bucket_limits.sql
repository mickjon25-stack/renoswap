-- Profile pictures: tighten the existing public-read `avatars` bucket
-- (created in 20260921_001_initial_schema.sql together with its own-folder
-- write/delete policies). The app resizes photos to 512px WebP/JPEG (<300 KB)
-- before upload; the server-side limits below are a safety net.

update storage.buckets
set file_size_limit = 1048576, -- 1 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- Explicit WITH CHECK so an update can't move an object into another user's folder.
drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- profiles.avatar_url already exists (initial schema); keep this idempotent.
alter table public.profiles add column if not exists avatar_url text;
