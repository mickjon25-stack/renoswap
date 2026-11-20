-- Nationwide soft launch: accept any valid U.S. ZIP (5-digit or ZIP+4)
-- instead of Texas-only prefixes on listing insert.

create or replace function public.is_us_zip(zip text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select zip ~ '^\d{5}(-\d{4})?$';
$$;

-- Keep old name as alias so any leftover callers still work during rollout
create or replace function public.is_texas_zip(zip text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select public.is_us_zip(zip);
$$;

drop policy if exists "Users insert own listings" on public.listings;
create policy "Users insert own listings"
  on public.listings for insert
  with check (
    auth.uid() = poster_id
    and public.is_us_zip(zip)
  );

notify pgrst, 'reload schema';
