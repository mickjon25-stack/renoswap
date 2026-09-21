# RenoSwap web (Phase 1 foundation)

Next.js App Router + TypeScript + Supabase auth, Postgres, and Storage.

Mirrors the locked [Texas soft-launch MVP](../TEXAS-SOFT-LAUNCH-MVP.md) and the static demo at the repo root.

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project

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

## Apply migrations (Supabase SQL editor)

1. Open your Supabase project → **SQL Editor**.
2. Paste the contents of `supabase/migrations/20260921_001_initial_schema.sql`.
3. Run it. This creates:
   - Tables: `profiles`, `listings`, `listing_photos`, `offers`, `threads`, `messages`, `reports`
   - RLS policies
   - Storage buckets: `avatars`, `listing-photos`
   - Trigger to auto-create a profile on signup
   - `is_texas_zip()` helper (prefixes 750–799, 733, 885)

4. Make yourself admin (after you sign up once):

```sql
update public.profiles
set is_admin = true, role = 'Admin'
where email = 'you@example.com';
```

## App routes

| Path | Purpose |
|------|---------|
| `/auth` | Sign up / sign in |
| `/browse` | Approved listings + filters |
| `/listings/[id]` | Detail, offer/message, report |
| `/post` | Create listing + photo upload |
| `/my-listings` | Poster’s listings + status |
| `/admin` | Approve/reject + reports (`is_admin`) |
| `/account` | Profile + avatar |

## Phase 1 TODOs (deferred)

- Stripe $3.99/mo for 4+ active listings
- Near-me ZIP/radius ranking
- Push / in-app notifications while closed

## Static demo

Root `index.html` / `app.js` / `styles.css` remain the clickable localStorage spec. Do not remove them.
