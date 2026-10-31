-- Follow-up to lock_admin_and_listing_status: table-level UPDATE on profiles
-- made REVOKE UPDATE (is_admin) ineffective. Convert to column grants.
-- Idempotent with the corrected 006 grant list.

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
