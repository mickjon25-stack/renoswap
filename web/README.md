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
| `/my-listings` | Poster’s listings + status |
| `/admin` | Approve/reject + reports (`is_admin`) |
| `/account` | Profile + avatar (`avatars` / `${userId}/…`) |

## Live marketplace (Supabase-backed)

Browse, listing detail, post (+ photos), my listings, and admin approve/reject
read/write `renoswap-prod` via the anon key + RLS. No localStorage in `web/`.

## Phase 1 TODOs (deferred)

- Stripe $3.99/mo for 4+ active listings
- Near-me ZIP/radius ranking
- Push / in-app notifications while closed
- Messaging inbox UI (offers/threads/messages tables + OfferForm write path exist)

## Static demo

Root `index.html` / `app.js` / `styles.css` remain the clickable localStorage spec. Do not remove them.
