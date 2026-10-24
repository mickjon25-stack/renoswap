-- Swap offers can link one or more of the offerer's own active (Approved) listings.
create table if not exists public.offer_listings (
  offer_id uuid not null references public.offers (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, listing_id)
);
create index if not exists offer_listings_listing_idx on public.offer_listings (listing_id);

alter table public.offer_listings enable row level security;

-- Database-level guard (runs regardless of caller): linked listing must belong
-- to the offer's sender, be Approved, and not be the listing being offered on.
create or replace function public.offer_listings_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare o record; l record;
begin
  select from_user_id, listing_id into o from public.offers where id = new.offer_id;
  select poster_id, status into l from public.listings where id = new.listing_id;
  if o is null or l is null then raise exception 'Offer or listing not found'; end if;
  if l.poster_id <> o.from_user_id then raise exception 'You can only offer your own listings'; end if;
  if l.status <> 'Approved' then raise exception 'Only active approved listings can be offered'; end if;
  if new.listing_id = o.listing_id then raise exception 'Cannot offer the same listing'; end if;
  return new;
end $$;
revoke all on function public.offer_listings_guard() from public, anon, authenticated;

drop trigger if exists offer_listings_guard on public.offer_listings;
create trigger offer_listings_guard before insert or update on public.offer_listings
  for each row execute function public.offer_listings_guard();

drop policy if exists "Offer parties read linked listings" on public.offer_listings;
create policy "Offer parties read linked listings" on public.offer_listings for select
  using (exists (
    select 1 from public.offers o join public.listings tl on tl.id = o.listing_id
    where o.id = offer_id
      and (o.from_user_id = auth.uid() or tl.poster_id = auth.uid() or public.current_is_admin())
  ));

drop policy if exists "Offerer links own listings" on public.offer_listings;
create policy "Offerer links own listings" on public.offer_listings for insert
  with check (
    exists (select 1 from public.offers o where o.id = offer_id and o.from_user_id = auth.uid())
    and exists (select 1 from public.listings l
                where l.id = listing_id and l.poster_id = auth.uid() and l.status = 'Approved')
  );

drop policy if exists "Offerer unlinks own listings" on public.offer_listings;
create policy "Offerer unlinks own listings" on public.offer_listings for delete
  using (exists (select 1 from public.offers o where o.id = offer_id and o.from_user_id = auth.uid()));

revoke all on public.offer_listings from anon, authenticated;
grant select, insert, delete on public.offer_listings to authenticated;
