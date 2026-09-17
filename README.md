# RenoSwap (browser demo)

Texas-first, swap-first marketplace for leftover home renovation materials. This is a polished static SPA rebuilt from the Grok prototype — no backend, no Bubble, data stays in `localStorage`.

## Open the demo

**Option A — double-click / open file**

```bash
open /workspace/renoswap/index.html
# or open index.html in any modern browser
```

**Option B — local static server**

```bash
cd /workspace/renoswap
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Files

| File | Role |
|------|------|
| `index.html` | App shell |
| `styles.css` | Warm paper design system (accent `#c45c26`, Georgia headings) |
| `app.js` | Full SPA: browse, detail, post, my listings, messages, admin, account |

## Product rules (enforced)

- Intents: Swap (looking_for required), Sell (price required), Sell or Swap (both), Fast & Free ($0, pickup only, dumpster confirm; 24/48/72h window starts on **admin approve**)
- Free tier: 3 active listings (Pending Review / Approved / Claimed); 4+ needs $3.99/mo
- Canceling the plan while over 3 blocks new posts until you drop to ≤3 or resubscribe
- Browse sorts Fast & Free first, then soonest expiry (or distance when selected)
- Normal listings expire 45 days after approval
- Texas ZIP only (validated via USPS 3-digit TX prefixes 750–799, 733, 885); v1 is Texas-only — error: “Texas ZIP required in v1.”
- Pay at pickup: cash / Venmo / Zelle — no in-app checkout
- In-app messaging (threads per listing / offer) stored in `localStorage`
- Swap offers attach one of your Approved listings; Buy offers are message-only; Fast & Free stays Claim
- No agriculture / AgsSwap categories

## Demo login / profiles

Browser-only auth (no backend). On first visit — or after **Log out** / **Reset demo data** — a welcome screen appears before Browse:

1. **Create profile** — name, email, demo password, Homeowner/Contractor, city + Texas ZIP, optional bio/company
2. **Sign in** — email + password against `users` in localStorage
3. **Continue as demo user** — pick You / Elena / Hill Country Builds / Admin (password for all: `demo`)

Session: `currentUser` is a user id (or `null` when logged out). Account → **Edit profile**, **Log out**, upgrade toggle, and a demo-account switcher.

## localStorage schema (`renoswap_v1`)

Compatible extension of the original demo (listings are never wiped on upgrade):

- `listings` — prior fields unchanged; added optional `reject_reason` (string) when admin rejects
- `currentUser` — user id string, or `null` when logged out / no completed profile session
- `users` map — each user:
  - prior: `id`, `name`, `role`, `contractor`, `subscribed?`, `admin?`
  - added: `email`, `password` (demo-encoded `demo$…` via `btoa`, not real security), `city`, `zip`, `bio`, `company`, `profileComplete`
  - trust: `blocked` — array of blocked user ids (default `[]`; migrated on load)
  - Missing fields are filled from seed defaults on load (`ensureSchema` / `normalizeUser`)
- `offers[]` — `{ id, listingId, offeredListingId?, from, type: "Swap"|"Buy"|"Claim Free", message?, status: "Pending"|"Accepted"|"Declined"|"Withdrawn"|"Accepted", at }`
- `threads[]` — `{ id, listingId, offerId?, participants[], created_at, updated_at, lastRead: { [userId]: ts } }`
- `messages[]` — `{ id, threadId, from, body, at }`
- `reports[]` — `{ id, reporter, kind: "listing"|"user", listingId?, targetUserId?, reason, note, at, status: "Pending"|"Resolved"|"Dismissed", resolved_at?, resolved_by? }`

Older offers that used `listing` instead of `listingId` are migrated on load. Missing `reports` / `blocked` are added without wiping listings. Sample threads seed only when `threads` and `messages` are both empty. Seed demo emails: `you@renoswap.demo`, `elena@renoswap.demo`, `builds@renoswap.demo`, `admin@renoswap.demo`.

### Trust & safety (demo)

- **Admin nav** only if `users[currentUser].admin === true`; non-admins bounced to Browse
- **Report listing / Report user** from listing detail (not your own) or Messages thread → admin Pending reports (Resolve / Dismiss)
- **Block user** stores id on your profile; Browse hides their listings; messaging/offers disabled; Account → Blocked users → Unblock
- **Reject** prompts for optional reason → shown on poster’s My listings

## Seed listings

1. Moulton plywood — Fast & Free  
2. La Grange subway tile — Swap  
3. Gonzales Kohler faucet — Sell or Swap  
4. Shiner framing nailer — Sell  
5. Moulton interior door — Swap (**yours**, so Propose a swap works immediately)  

On first load / reset, sample **Messages** threads are seeded (tile chat, nailer chat, plus Elena’s pending swap offer on your door).  

Use **Account → Reset demo data** to restore seeds + sample message threads (returns to the login screen).

**Quick try (auth)**
1. Clear site data for the page (or Reset demo) → welcome screen.
2. **Create profile** → land on Browse as that user; cards show your name.
3. **Account → Log out** → sign back in with the same email/password.
4. **Edit profile** (change name or switch to Contractor) → badge/name update on listings.
5. Or **Continue as demo user → You** for the seeded door / Elena offer walkthrough.

## Try the swap-offer flow

**Accept an incoming offer (seeded)**
1. Open **My listings** — see Elena’s Pending swap on your door (tile ↔ door).
2. **Accept** or **Decline** (also works from the offer’s **Messages** thread).

**Propose a swap yourself**
1. Browse → open **Unused subway tile** or **Kohler faucet**.
2. **Propose a swap** → pick your Approved door (or another Approved listing of yours).
3. Optional note → **Send swap offer** → lands in the thread.
4. Outgoing offer appears under **My listings → Your offers** (Withdraw while Pending).

**Messaging**
1. On any listing that isn’t yours → **Message poster**.
2. **Messages** nav lists threads; badge shows unread lightly.

If you have no Approved listings, Propose a swap shows “Post and get a listing approved first.”



## Near-me browse & swap matching

**Location controls (Browse)**  
Replace the old disabled “Texas first” select with:

1. **Search ZIP** — defaults to your profile ZIP when logged in (seed You = `77975`).
2. **Radius** — 25 / 50 / 100 miles, or **Anywhere in Texas** (no distance filter).
3. **Sort** — Soonest expiry (default) or Distance. Fast & Free always sorts first.

Distance uses a compact TX ZIP → lat/lng table (exact city ZIPs + 3-digit prefix centroids). Haversine miles appear on cards when a search ZIP is set (e.g. `12 mi`). Unknown ZIPs still show; distance is `—`.

**ZIP table limits**  
- Exact coords for seed towns (Moulton, La Grange, Gonzales, Shiner) plus ~120 common TX city ZIPs.  
- Any other accepted TX ZIP falls back to its **3-digit prefix centroid** (coarser — fine for 25/50/100 mi demo filters).  
- Non-TX / malformed ZIP → no origin; listings show without filtering by radius.

**Swap matching**  
When proposing a swap (and as a hint on Swap / Sell or Swap detail), your Approved listings are scored against the target’s `looking_for` (title/category tokens). Best matches surface first in the attach picker. Browse may show a light **Matches for you** strip when your Approved listings have `looking_for` text that overlaps other Approved listings.

### How to test near-me + matching

1. **Continue as You** (`77975` Moulton). Browse should show Search ZIP `77975`.
2. Set radius **25 miles** — nearby seeds (Shiner `77984`, Gonzales `78629`, La Grange `78945`) stay or drop by distance; miles appear on cards.
3. Switch ZIP to `78701` (Austin), radius **50** — Central TX listings may fall outside; **Anywhere in Texas** restores the full grid.
4. Sort **Distance** — after Fast & Free, nearer cards first.
5. Open **Unused subway tile** (Elena looks for door/quartz) → **Propose a swap** — your door should rank under “Best matches for their looking for.”
6. Detail page for that tile should hint your door as a match when looking_for overlaps.

## Trust & safety — how to test

1. **Admin gate** — Continue as **You** → Admin must not appear in nav. Switch to **Admin** (or sign in `admin@renoswap.demo` / `demo`) → Admin appears. As You, open console and `go('admin')` → bounce to Browse.
2. **Texas ZIP** — Create/Edit profile or Post with ZIP `10001` or `90210` → alert “Texas ZIP required in v1.” Use `77975` / `78701` → accepted.
3. **Report** — As You, open Elena’s tile listing → Report listing (pick reason) → switch to Admin → Pending reports → Resolve or Dismiss.
4. **Block** — As You, Block Elena from her listing → Browse no longer shows her posts; Message / offer disabled. Account → Blocked users → Unblock.
5. **Reject reason** — As Admin, reject a Pending listing with a short reason → as poster, My listings shows the reject reason under the card.
