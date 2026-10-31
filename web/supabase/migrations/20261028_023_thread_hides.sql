-- "Delete for me": a participant can hide a conversation from their own inbox.
-- Messages and threads are never deleted, so the other person and admins keep
-- the full history. New messages after hidden_at make the thread reappear,
-- showing only messages newer than hidden_at to the hider.
create table if not exists public.thread_hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

alter table public.thread_hides enable row level security;

drop policy if exists thread_hides_select_own on public.thread_hides;
create policy thread_hides_select_own on public.thread_hides
  for select to authenticated
  using (user_id = auth.uid() or public.current_is_admin());

drop policy if exists thread_hides_insert_own on public.thread_hides;
create policy thread_hides_insert_own on public.thread_hides
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

drop policy if exists thread_hides_update_own on public.thread_hides;
create policy thread_hides_update_own on public.thread_hides
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists thread_hides_delete_own on public.thread_hides;
create policy thread_hides_delete_own on public.thread_hides
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.thread_hides to authenticated;
