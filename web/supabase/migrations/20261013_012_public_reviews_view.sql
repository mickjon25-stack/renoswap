-- Public review feed: only reviews that passed the blind window and aren't hidden.
create or replace view public.public_reviews
with (security_invoker = true) as
  select r.id, r.trade_id, r.reviewer_id, r.reviewee_id, r.stars, r.comment, r.created_at
  from public.reviews r
  where private.review_is_public(r.id);
grant select on public.public_reviews to anon, authenticated;
