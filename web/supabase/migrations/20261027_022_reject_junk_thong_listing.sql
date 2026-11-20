-- One-shot: hide junk "Thong" listing from Browse (admin moderation).
alter table public.listings disable trigger listings_protect_moderation;

update public.listings
set status = 'Rejected',
    reject_reason = 'Prohibited / junk listing — removed by admin',
    expires_at = null,
    updated_at = now()
where id = 'bbb9e4b3-f715-4a20-b2b6-78b32e8034df'
  and title = 'Thong'
  and status = 'Approved';

alter table public.listings enable trigger listings_protect_moderation;
