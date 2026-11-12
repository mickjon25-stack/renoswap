-- RenoSwap Phase 1 schema (mirrors TEXAS-SOFT-LAUNCH-MVP.md + demo app.js)
-- Apply in Supabase SQL editor (or via supabase db push).

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email text,
  city text not null default '',
  zip text not null default '',
  bio text not null default '',
  company text not null default '',
  role text not null default 'Homeowner'
    check (role in ('Homeowner', 'Contractor', 'Admin')),
  avatar_url text,
  is_admin boolean not null default false,
  is_contractor boolean not null default false,
  profile_complete boolean not null default false,
  -- TODO(phase2): Stripe subscription for 4+ active listings ($3.99/mo)
  subscribed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_zip_idx on public.profiles (zip);
create index if not exists profiles_is_admin_idx on public.profiles (is_admin);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null,
  intent text not null
    check (intent in ('Swap', 'Sell', 'Sell or Swap', 'Fast & Free')),
  condition text not null,
  description text not null default '',
  looking_for text not null default '',
  price numeric(10, 2) not null default 0,
  city text not null,
  zip text not null,
  pickup_ok boolean not null default true,
  shipping_ok boolean not null default false,
  fast_window_hours integer not null default 24,
  dumpster_bound boolean not null default false,
  status text not null default 'Pending Review'
    check (status in ('Pending Review', 'Approved', 'Claimed', 'Rejected', 'Expired')),
  reject_reason text not null default '',
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_poster_idx on public.listings (poster_id);
create index if not exists listings_zip_idx on public.listings (zip);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_created_idx on public.listings (created_at desc);

-- ---------------------------------------------------------------------------
-- Listing photos (paths in storage bucket listing-photos)
-- ---------------------------------------------------------------------------
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  public_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_idx
  on public.listing_photos (listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- Offers (swap / interest on a listing)
-- ---------------------------------------------------------------------------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  offered_listing_id uuid references public.listings (id) on delete set null,
  message text not null default '',
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Declined', 'Withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_listing_idx on public.offers (listing_id);
create index if not exists offers_from_user_idx on public.offers (from_user_id);

-- ---------------------------------------------------------------------------
-- Threads + messages
-- ---------------------------------------------------------------------------
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  offer_id uuid references public.offers (id) on delete set null,
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint threads_distinct_participants check (participant_a <> participant_b)
);

create index if not exists threads_listing_idx on public.threads (listing_id);
create index if not exists threads_participants_idx
  on public.threads (participant_a, participant_b);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx
  on public.messages (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text not null default '',
  status text not null default 'Pending'
    check (status in ('Pending', 'Resolved', 'Dismissed')),
  created_at timestamptz not null default now(),
  constraint reports_has_target check (
    listing_id is not null or reported_user_id is not null
  )
);

create index if not exists reports_status_idx on public.reports (status);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

drop trigger if exists threads_updated_at on public.threads;
create trigger threads_updated_at
  before update on public.threads
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Texas ZIP prefix check (750–799, 733, 885) — also enforced in app
create or replace function public.is_texas_zip(zip text)
returns boolean
language sql
immutable
as $$
  select
    zip ~ '^\d{5}$'
    and left(zip, 3) in (
      '733', '885',
      '750','751','752','753','754','755','756','757','758','759',
      '760','761','762','763','764','765','766','767','768','769',
      '770','771','772','773','774','775','776','777','778','779',
      '780','781','782','783','784','785','786','787','788','789',
      '790','791','792','793','794','795','796','797','798','799'
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.offers enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create or replace function public.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Listings: public can see Approved/Claimed; owners see own; admins see all
drop policy if exists "Public read approved listings" on public.listings;
create policy "Public read approved listings"
  on public.listings for select
  using (
    status in ('Approved', 'Claimed')
    or poster_id = auth.uid()
    or public.current_is_admin()
  );

drop policy if exists "Users insert own listings" on public.listings;
create policy "Users insert own listings"
  on public.listings for insert
  with check (
    auth.uid() = poster_id
    and public.is_texas_zip(zip)
  );

drop policy if exists "Owners update own listings" on public.listings;
create policy "Owners update own listings"
  on public.listings for update
  using (poster_id = auth.uid() or public.current_is_admin())
  with check (poster_id = auth.uid() or public.current_is_admin());

drop policy if exists "Owners delete own listings" on public.listings;
create policy "Owners delete own listings"
  on public.listings for delete
  using (poster_id = auth.uid() or public.current_is_admin());

-- Listing photos follow listing visibility
drop policy if exists "Read listing photos" on public.listing_photos;
create policy "Read listing photos"
  on public.listing_photos for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          l.status in ('Approved', 'Claimed')
          or l.poster_id = auth.uid()
          or public.current_is_admin()
        )
    )
  );

drop policy if exists "Owners insert listing photos" on public.listing_photos;
create policy "Owners insert listing photos"
  on public.listing_photos for insert
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.poster_id = auth.uid()
    )
  );

drop policy if exists "Owners delete listing photos" on public.listing_photos;
create policy "Owners delete listing photos"
  on public.listing_photos for delete
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.poster_id = auth.uid() or public.current_is_admin())
    )
  );

-- Offers
drop policy if exists "Offer participants can read" on public.offers;
create policy "Offer participants can read"
  on public.offers for select
  using (
    from_user_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.poster_id = auth.uid()
    )
    or public.current_is_admin()
  );

drop policy if exists "Users create offers" on public.offers;
create policy "Users create offers"
  on public.offers for insert
  with check (from_user_id = auth.uid());

drop policy if exists "Offer parties update" on public.offers;
create policy "Offer parties update"
  on public.offers for update
  using (
    from_user_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.poster_id = auth.uid()
    )
    or public.current_is_admin()
  );

-- Threads
drop policy if exists "Thread participants read" on public.threads;
create policy "Thread participants read"
  on public.threads for select
  using (
    participant_a = auth.uid()
    or participant_b = auth.uid()
    or public.current_is_admin()
  );

drop policy if exists "Authenticated create threads" on public.threads;
create policy "Authenticated create threads"
  on public.threads for insert
  with check (
    auth.uid() = participant_a or auth.uid() = participant_b
  );

-- Messages
drop policy if exists "Thread participants read messages" on public.messages;
create policy "Thread participants read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (t.participant_a = auth.uid() or t.participant_b = auth.uid()
             or public.current_is_admin())
    )
  );

drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

-- Reports
drop policy if exists "Reporters and admins read reports" on public.reports;
create policy "Reporters and admins read reports"
  on public.reports for select
  using (reporter_id = auth.uid() or public.current_is_admin());

drop policy if exists "Authenticated create reports" on public.reports;
create policy "Authenticated create reports"
  on public.reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports"
  on public.reports for update
  using (public.current_is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets: avatars + listing-photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Listing photos are publicly accessible" on storage.objects;
create policy "Listing photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Users upload listing photos" on storage.objects;
create policy "Users upload listing photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update listing photos" on storage.objects;
create policy "Users update listing photos"
  on storage.objects for update
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete listing photos" on storage.objects;
create policy "Users delete listing photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.current_is_admin())
  );
