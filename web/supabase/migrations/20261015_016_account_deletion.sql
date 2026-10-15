-- Self-service account deletion (016).
-- The app deletes the auth user server-side (service role, only for the
-- signed-in caller). These FK rules decide what happens to related rows:
--   CASCADE (removed):   profile, own listings (+listing_photos, offers on them,
--                        alert logs), own offers, saved_alerts, notification_prefs,
--                        reports/review_reports they filed, reviews ABOUT them.
--   SET NULL (kept, shown as "Deleted member"): thread participant, message
--                        sender, trade parties, reviews they WROTE about others,
--                        reports about them.
-- Storage files (listing-photos/<uid>/*, avatars/<uid>/*) are removed by the app first.

alter table public.threads alter column participant_a drop not null,
                           alter column participant_b drop not null;
alter table public.threads drop constraint threads_participant_a_fkey,
  add constraint threads_participant_a_fkey foreign key (participant_a) references public.profiles(id) on delete set null;
alter table public.threads drop constraint threads_participant_b_fkey,
  add constraint threads_participant_b_fkey foreign key (participant_b) references public.profiles(id) on delete set null;

alter table public.messages alter column sender_id drop not null;
alter table public.messages drop constraint messages_sender_id_fkey,
  add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete set null;

alter table public.trades alter column party_a drop not null,
                          alter column party_b drop not null,
                          alter column requested_by drop not null;
alter table public.trades drop constraint trades_party_a_fkey,
  add constraint trades_party_a_fkey foreign key (party_a) references public.profiles(id) on delete set null;
alter table public.trades drop constraint trades_party_b_fkey,
  add constraint trades_party_b_fkey foreign key (party_b) references public.profiles(id) on delete set null;
alter table public.trades drop constraint trades_requested_by_fkey,
  add constraint trades_requested_by_fkey foreign key (requested_by) references public.profiles(id) on delete set null;

alter table public.reviews alter column reviewer_id drop not null;
alter table public.reviews drop constraint reviews_reviewer_id_fkey,
  add constraint reviews_reviewer_id_fkey foreign key (reviewer_id) references public.profiles(id) on delete set null;
-- reviewee_id stays ON DELETE CASCADE: reviews about a deleted member go away.

-- Called by the server (service role) right before deleting the auth user.
-- Refuses if the user is the only admin; cancels their pending trades.
create or replace function private.prepare_account_deletion(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.profiles where id = p_user and is_admin)
     and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;
  update public.trades set status = 'Cancelled'
   where status = 'Pending' and (party_a = p_user or party_b = p_user);
end $$;
revoke all on function private.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function private.prepare_account_deletion(uuid) to service_role;

create or replace function public.prepare_account_deletion(p_user uuid)
returns void language sql security invoker set search_path = '' as $$
  select private.prepare_account_deletion(p_user);
$$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
