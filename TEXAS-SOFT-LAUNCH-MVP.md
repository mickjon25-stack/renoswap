# RenoSwap — Texas soft-launch MVP

**Status:** Draft for Michael (Product)  
**Date:** 2026-09-21  
**Live clickable spec:** https://renoswap.com (browser demo; localStorage — not multi-user yet)

## North star
A Texas-first marketplace where leftover **renovation / home-construction materials** get swapped or sold instead of dumped. **Swap is the main action**; selling is allowed. Not a garage-sale app.

## Soft-launch goal (first 90 days)
Prove that enough homeowners and contractors in a tight geography will:
1. Post quality reno leftovers
2. Complete swaps / pickups / cash deals off-platform
3. Come back for a second listing or claim

**Success metrics (recommended):**
| Horizon | Signal |
|--------|--------|
| 30 days | 50+ approved listings; ≥15 completed pickups/swaps (self-reported or admin-marked); <10% scam/junk report rate |
| 90 days | 200+ approved listings; ≥40% of posters return; Fast & Free claim rate >25% when posted; paid upgrade conversion exists but not required for success |

## Who’s first
**Primary:** DIY homeowners mid-reno + small residential contractors (1–10 people).  
**Secondary:** Remodelers / specialty trades with leftover stock.  
**Not first:** General public dumping furniture, vehicle sellers, landlords listing rentals.

**Contractor badge:** Keep in MVP as **self-reported** + company name required; verify later.

## Where (geography)
**Phase A (soft launch) — LOCKED:** Outreach focus = **greater Austin + San Antonio**. Product still accepts **any Texas ZIP** so nearby/rural leftovers aren’t blocked.  
**Phase B:** Rest of Texas.  
**Out until later:** Other states.

## Must-have for real multi-user MVP
Replace localStorage demo with:

1. **Real accounts** — email + password (or magic link); Sign in / Sign out; editable profile (photo, city, ZIP).
2. **Database** — users, listings, offers, messages, reports, blocks.
3. **Photo storage** — 3+ images per listing in cloud storage (not browser data URLs).
4. **Server-enforced rules** — intents (Swap / Sell / Sell or Swap / Fast & Free), TX ZIP, categories, status flow, posting limits (3 free → $3.99).
5. **Admin queue** — approve/reject (with reason); reports; Fast & Free timer starts on approve.
6. **Messaging + swap-offer attach** — as in the demo.
7. **Trust** — report/block; safety copy; short ToS / “RenoSwap never holds materials payment.”
8. **Stripe** — $3.99/mo for 4+ active listings only (materials still cash/Venmo/Zelle at pickup).
9. **Near-me + matching** — ZIP/radius + looking-for ranking (can be v1.1 if schedule slips; keep search at minimum).

## Explicitly out of soft-launch MVP
- In-app checkout for materials
- Native iOS/Android app stores (PWA / “Add to Home Screen” OK)
- AgsSwap / agriculture catalog
- Guaranteed identity verification / bonded contractors
- Shipping logistics marketplace
- Background push that works when the site is closed (browser notifications while open are OK as interim)

## Operating model (soft launch)
- **Invite or waitlist** first 2–4 weeks, then open TX signup.
- **Human admin** reviews every listing before public (quality > speed).
- Seed **10–20 real** leftover posts from friends/contractors before opening waitlist.
- Support channel: email or form; response SLA informal but same-day during launch week.

## Engineering sequence (after this doc is locked)
1. Pick stack (suggested: managed auth + Postgres + object storage + one web app — e.g. Supabase or similar).
2. Migrate data model from the demo.
3. Re-skin/port UI from renoswap.com.
4. Stripe + admin + ToS.
5. Soft launch checklist + monitoring (errors, report volume, approval latency).

## Open decisions (Michael)
- [x] Confirm Phase A metros — **greater Austin + San Antonio** (locked 2026-09-21).
- [ ] Invite-only vs open TX from day one.
- [ ] Self-serve signup vs waitlist.
- [ ] Who runs admin queue daily at launch.
- [ ] Target date window for foundation + soft launch (no rush — quality first).

## Principle
Ship a **narrow, trustworthy Texas loop** (post → approve → match/message → pickup) before adding growth features. The demo is the product spec; the MVP is the same loop with real users and real data.
