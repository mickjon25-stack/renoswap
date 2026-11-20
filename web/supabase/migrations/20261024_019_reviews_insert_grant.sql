-- Fix: reviews inserts were denied because authenticated lacked INSERT.
-- (Migration 011 granted column INSERT; live DB only had SELECT/DELETE.)
grant select on public.reviews to anon, authenticated;
grant insert (trade_id, reviewer_id, reviewee_id, stars, comment) on public.reviews to authenticated;
grant update (hidden) on public.reviews to authenticated;
-- Table-level INSERT is required alongside column grants on some Postgres setups.
grant insert on public.reviews to authenticated;
revoke insert on public.reviews from anon;
revoke update on public.reviews from anon;
revoke delete on public.reviews from anon;
-- Keep delete admin-only via RLS; authenticated needs DELETE privilege for the
-- policy to be evaluable when an admin uses the authenticated role… admins use
-- the same role, so leave DELETE granted (gated by RLS).
