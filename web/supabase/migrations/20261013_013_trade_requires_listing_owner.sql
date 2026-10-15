-- A trade must involve the listing's poster, so two strangers can't "trade"
-- someone else's listing.
create or replace function public.request_trade_complete(p_thread_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_thread public.threads;
  v_trade public.trades;
  v_poster uuid;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  select * into v_thread from public.threads where id = p_thread_id;
  if not found or (v_thread.participant_a <> v_uid and v_thread.participant_b <> v_uid) then
    raise exception 'Not your conversation';
  end if;
  select poster_id into v_poster from public.listings where id = v_thread.listing_id;
  if v_poster is null or v_poster not in (v_thread.participant_a, v_thread.participant_b) then
    raise exception 'This conversation is not about one of your listings';
  end if;
  select * into v_trade from public.trades where thread_id = p_thread_id;
  if found then
    if v_trade.status = 'Confirmed' then raise exception 'This trade is already confirmed'; end if;
    if v_trade.status = 'Pending' then raise exception 'Already waiting for confirmation'; end if;
    update public.trades set status = 'Pending', requested_by = v_uid, confirmed_at = null, created_at = now()
      where id = v_trade.id;
    return v_trade.id;
  end if;
  insert into public.trades (thread_id, listing_id, party_a, party_b, requested_by)
    values (p_thread_id, v_thread.listing_id, v_thread.participant_a, v_thread.participant_b, v_uid)
    returning id into v_trade.id;
  return v_trade.id;
end;
$$;
revoke all on function public.request_trade_complete(uuid) from public, anon;
grant execute on function public.request_trade_complete(uuid) to authenticated;
