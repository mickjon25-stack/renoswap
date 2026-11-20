-- Distance filter: US ZIP (ZCTA) centroids from the US Census 2024 Gazetteer,
-- plus an RPC that returns approximate miles from an origin ZIP to listings.
-- Centroid rows are loaded separately (public data, ~33.8k rows).

create table if not exists public.zip_centroids (
  zip text primary key check (zip ~ '^\d{5}$'),
  lat double precision not null,
  lng double precision not null
);

alter table public.zip_centroids enable row level security;
-- Public reference data: read-only for everyone, no writes via API.
drop policy if exists "Anyone reads zip centroids" on public.zip_centroids;
create policy "Anyone reads zip centroids"
  on public.zip_centroids for select using (true);

-- Returns listing ids visible on Browse with approximate distance (miles,
-- rounded) from origin_zip. max_miles null = no limit. Only whole miles are
-- exposed, never coordinates or addresses.
create or replace function public.listing_distances(origin_zip text, max_miles double precision default null)
returns table (listing_id uuid, miles integer)
language sql
stable
security invoker
set search_path = public
as $$
  with o as (
    select lat, lng from public.zip_centroids where zip = left(trim(origin_zip), 5)
  ), d as (
    select l.id,
      3958.8 * 2 * asin(sqrt(
        power(sin(radians(c.lat - o.lat) / 2), 2) +
        cos(radians(o.lat)) * cos(radians(c.lat)) *
        power(sin(radians(c.lng - o.lng) / 2), 2)
      )) as dist
    from public.listings l
    join public.zip_centroids c on c.zip = left(l.zip, 5)
    cross join o
    where l.status in ('Approved', 'Claimed')
  )
  select id, round(dist)::integer from d
  where max_miles is null or dist <= max_miles;
$$;

revoke all on function public.listing_distances(text, double precision) from public;
grant execute on function public.listing_distances(text, double precision) to anon, authenticated;

notify pgrst, 'reload schema';
