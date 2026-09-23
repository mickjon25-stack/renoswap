# RenoSwap web (Phase 1 foundation)

Next.js App Router + TypeScript + Supabase auth, Postgres, and Storage.

Mirrors the locked [Texas soft-launch MVP](../TEXAS-SOFT-LAUNCH-MVP.md) and the static demo at the repo root.

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project (live: `renoswap-prod`)

## Local setup

```bash
cd web
cp .env.example .env.local
# Edit .env.local with your project URL + anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/browse`).

### Build without real keys

`npm run build` works with placeholder env values (see `.env.example`). Auth and data calls need a real project.

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
npm run build
```

## Supabase Auth URL configuration (required for local email auth)

In the Supabase dashboard for **renoswap-prod** → **Authentication** → **URL Configuration**:

1. **Site URL:** `http://localhost:3000`
2. **Redirect URLs** — include at least:
   - `http://localhost:3000/auth/callback`
   - (optional) `http://localhost:3000/**`

Without these, email confirmation / magic-link redirects will fail after signup.

When you deploy later, add the production site URL and `https://YOUR_DOMAIN/auth/callback` as well.

## Apply migrations (Supabase SQL editor)

Schema + RLS + buckets are already applied on the live project. **Do not drop/recreate tables.**

If bootstrapping a fresh project:

1. Open your Supabase project → **SQL Editor**.
2. Paste the contents of `supabase/migrations/20260921_001_initial_schema.sql`.
3. Run it. This creates:
   - Tables: `profiles`, `listings`, `listing_photos`, `offers`, `threads`, `messages`, `reports`
   - RLS policies
   - Storage buckets: `avatars`, `listing-photos`
   - Trigger to auto-create a profile on signup
   - `is_texas_zip()` helper (prefixes 750–799, 733, 885)

### Make yourself admin (after first signup)

```sql
update public.profiles
set is_admin = true, role = 'Admin'
where email = 'you@example.com';
```

Replace `you@example.com` with the email you used to sign up.

## App routes

| Path | Purpose |
|------|---------|
| `/auth` | Sign up / sign in |
| `/auth/callback` | PKCE email-confirm / OAuth code exchange |
| `/browse` | Approved listings + filters |
| `/listings/[id]` | Detail, offer/message, report |
| `/post` | Create listing + photo upload (`listing-photos` / `${userId}/…`) |
| `/inbox` | Threads for signed-in user (listing title, counterparty, last preview) |
| `/inbox/[id]` | Thread detail + reply (`messages` insert) |
| `/my-listings` | Poster’s listings + status |
| `/admin` | Approve/reject + reports (`is_admin`) |
| `/account` | Profile + avatar (`avatars` / `${userId}/…`) |
| `/billing` | Plans, Stripe Checkout, Customer Portal, bump info |

## Live marketplace (Supabase-backed)

Browse, listing detail, post (+ photos), my listings, admin approve/reject, and
inbox / thread messaging read/write `renoswap-prod` via the anon key + RLS.
No localStorage in `web/`. OfferForm creates `offers` + `threads` + `messages`
and deep-links into `/inbox/[id]`.

### Smoke-test inbox (two users)

1. User A posts a listing; admin approves it.
2. User B (second browser / incognito) opens the listing → **Send offer**.
3. User B lands on `/inbox/[threadId]` and can reply.
4. User A opens **Inbox**, opens the same thread, replies; message persists after refresh.

Same-account self-offer is blocked (participants must differ).

## Monetization (Stripe)

Pricing (locked):

| Product | Amount | Effect |
|---------|--------|--------|
| Free | $0 | 3 active listings (Pending Review + Approved + Claimed) |
| Homeowner | $4.99/mo | Cap raised to **10** active listings |
| Contractor | $19/mo | Cap **25** + `is_contractor` / Contractor role when subscribed |
| Bump | $5 one-time | Sets `listings.bumped_at`; Browse sorts recent bumps (7 days) first |

No materials payment / marketplace take-rate — Venmo/Zelle/cash stay off-platform.

### Env vars

See `.env.example`. Required for live billing:

- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Test mode: `sk_test_…` / `pk_test_…`)
- `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or Dashboard webhook endpoint)
- `STRIPE_PRICE_HOMEOWNER`, `STRIPE_PRICE_CONTRACTOR`, `STRIPE_PRICE_BUMP`
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**; webhook route uses it to update `profiles` / `listings.bumped_at` (RLS triggers block client writes to billing fields)

### Create Stripe Products / Prices (Dashboard, Test mode)

1. Open [Stripe Dashboard](https://dashboard.stripe.com/test/products) → **Products** → **Add product**.
2. **Homeowner** — recurring monthly **$4.99** → copy Price id → `STRIPE_PRICE_HOMEOWNER`.
3. **Contractor** — recurring monthly **$19.00** → `STRIPE_PRICE_CONTRACTOR`.
4. **Listing bump** — one-time **$5.00** → `STRIPE_PRICE_BUMP`.
5. Developers → **Webhooks** → Add endpoint `https://YOUR_DOMAIN/api/stripe/webhook` (local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
6. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
7. Copy signing secret → `STRIPE_WEBHOOK_SECRET`.
8. Enable Customer Portal (Settings → Billing → Customer portal) so **Manage billing** works.

### Routes

| Path | Purpose |
|------|---------|
| `/billing` | Plan cards, Subscribe (Checkout), Manage (Customer Portal) |
| `/api/stripe/checkout` | Creates Checkout Session (subscription or bump payment) |
| `/api/stripe/portal` | Stripe Customer Portal session |
| `/api/stripe/webhook` | Applies plan / `bumped_at` via service role |

Migration: `supabase/migrations/20260922_002_billing_stripe.sql` (applied on renoswap-prod).

## Deferred

- Near-me ZIP/radius ranking
- Push / in-app notifications while closed

## Static demo

Root `index.html` / `app.js` / `styles.css` remain the clickable localStorage spec. Do not remove them.
