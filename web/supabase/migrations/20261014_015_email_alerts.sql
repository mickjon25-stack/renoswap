-- Email alerts: per-member on/off prefs, saved "Looking for" alerts, and
-- server-only send logs (throttle + de-dupe). Sending happens in Next.js API
-- routes with the service role; members only ever see their own rows.

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  message_alerts boolean not null default true,
  looking_for_alerts boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
drop policy if exists "Own prefs read" on public.notification_prefs;
create policy "Own prefs read" on public.notification_prefs
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Own prefs insert" on public.notification_prefs;
create policy "Own prefs insert" on public.notification_prefs
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Own prefs update" on public.notification_prefs;
create policy "Own prefs update" on public.notification_prefs
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.notification_prefs from anon;
revoke update on public.notification_prefs from authenticated;
grant update (message_alerts, looking_for_alerts, updated_at) on public.notification_prefs to authenticated;

create table if not exists public.saved_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keywords text not null check (char_length(trim(keywords)) between 2 and 80),
  category text,
  intent text,
  max_miles integer check (max_miles is null or max_miles between 1 and 3000),
  zip text check (zip is null or zip ~ '^\d{5}$'),
  created_at timestamptz not null default now(),
  constraint saved_alerts_distance_needs_zip check (max_miles is null or zip is not null)
);
create index if not exists saved_alerts_user_idx on public.saved_alerts (user_id);
alter table public.saved_alerts enable row level security;
drop policy if exists "Own alerts" on public.saved_alerts;
create policy "Own alerts" on public.saved_alerts
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.saved_alerts from anon;

-- Server-only logs (RLS on, no policies => only service role).
create table if not exists public.thread_email_log (
  thread_id uuid not null references public.threads (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  last_sent_at timestamptz not null default now(),
  primary key (thread_id, recipient_id)
);
alter table public.thread_email_log enable row level security;
revoke all on public.thread_email_log from anon, authenticated;

create table if not exists public.listing_alert_log (
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);
alter table public.listing_alert_log enable row level security;
revoke all on public.listing_alert_log from anon, authenticated;

-- Atomic throttle: true if we may email this recipient about this thread now
-- (no email in the last 15 minutes), and records the send slot.
create or replace function public.claim_thread_email(p_thread uuid, p_recipient uuid)
returns boolean language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  insert into public.thread_email_log as l (thread_id, recipient_id, last_sent_at)
  values (p_thread, p_recipient, now())
  on conflict (thread_id, recipient_id) do update set last_sent_at = now()
    where l.last_sent_at < now() - interval '15 minutes';
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.claim_thread_email(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_thread_email(uuid, uuid) to service_role;

-- Members whose saved alerts match an approved listing (never the poster,
-- only members with looking_for_alerts on). Distance reuses listing_distances.
create or replace function public.match_listing_alerts(p_listing uuid)
returns table (user_id uuid, alert_id uuid, keywords text)
language sql stable security invoker set search_path = public as $$
  select distinct on (a.user_id) a.user_id, a.id, a.keywords
  from public.saved_alerts a
  join public.listings l on l.id = p_listing
  left join public.notification_prefs p on p.user_id = a.user_id
  where l.status = 'Approved'
    and a.user_id <> l.poster_id
    and coalesce(p.looking_for_alerts, true)
    and (a.category is null or a.category = l.category)
    and (a.intent is null or a.intent = l.intent
         or (l.intent = 'Sell or Swap' and a.intent in ('Swap', 'Sell')))
    and not exists (
      select 1 from regexp_split_to_table(lower(trim(a.keywords)), '\s+') w
      where w <> '' and position(w in lower(l.title || ' ' || l.description || ' ' || l.category)) = 0
    )
    and (a.max_miles is null or exists (
      select 1 from public.listing_distances(a.zip, a.max_miles) d where d.listing_id = l.id
    ))
  order by a.user_id, a.created_at;
$$;
revoke all on function public.match_listing_alerts(uuid) from public, anon, authenticated;
grant execute on function public.match_listing_alerts(uuid) to service_role;

notify pgrst, 'reload schema';
