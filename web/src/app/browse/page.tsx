import { fetchRatings, type Rating } from "@/lib/ratings";
import { ListingCard, intentClass } from "@/components/ListingCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { CATEGORIES, INTENTS } from "@/lib/constants";
import type { Listing } from "@/lib/types";
import { withSignedPhotoUrls } from "@/lib/listing-photos";
import { BUMP_WINDOW_DAYS, compareBrowseListings } from "@/lib/billing";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  intent?: string;
}>;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const category = sp.category || "";
  const intent = sp.intent || "";

  let listings: Listing[] = [];
  let fetchError: string | null = null;
  let ratings: Record<string, Rating> = {};

  if (hasSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const build = () => {
        let query = supabase
          .from("listings")
          .select("*, listing_photos(*)")
          .in("status", ["Approved", "Claimed"]);
        if (category) query = query.eq("category", category);
        if (intent === "Swap" || intent === "Sell") {
          query = query.in("intent", [intent, "Sell or Swap"]);
        } else if (intent) query = query.eq("intent", intent);
        if (q) {
          query = query.or(
            `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,looking_for.ilike.%${q}%`
          );
        }
        return query;
      };

      // Recently boosted listings are fetched separately so an older boosted
      // listing is not cut off by the newest-60 limit.
      const boostCutoff = new Date(
        Date.now() - BUMP_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      const [recent, boosted] = await Promise.all([
        build().order("created_at", { ascending: false }).limit(60),
        build()
          .gte("bumped_at", boostCutoff)
          .order("bumped_at", { ascending: false })
          .limit(24),
      ]);
      const error = recent.error || boosted.error;
      if (error) fetchError = error.message;
      else {
        const byId = new Map<string, Listing>();
        for (const l of [
          ...((boosted.data as Listing[]) || []),
          ...((recent.data as Listing[]) || []),
        ]) {
          byId.set(l.id, l);
        }
        listings = await withSignedPhotoUrls(
          supabase,
          Array.from(byId.values()).sort(compareBrowseListings)
        );
        ratings = await fetchRatings(supabase, listings.map((l) => l.poster_id));
      }
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "Failed to load listings";
    }
  }

  return (
    <div className="wrap">
      <section className="hero welcome">
        <div className="hero-copy">
          <h2>Leftover reno materials, still useful.</h2>
          <p>
            Swap or sell leftover tile, lumber, paint and more with neighbors.
            Soft launch — open to early testers across the U.S.
          </p>
          <div className="hero-actions">
            <a href="#listings" className="btn btn-lg hero-btn">
              Find materials near you
            </a>
          </div>
          <ul className="hero-intents" aria-label="Ways to trade">
            {INTENTS.map((i) => (
              <li key={i} className={`badge ${intentClass(i)}`}>
                {i}
              </li>
            ))}
          </ul>
        </div>
        <svg className="hero-house" viewBox="0 0 120 120" aria-hidden="true">
          <path d="M60 14 12 54h14v48h68V54h14L60 14Z" fill="rgba(255,255,255,.16)" />
          <path d="M44 78l11 11 22-24" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </section>

      <form className="filters" method="get" role="search" id="listings">
        <div className="search-field">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
            />
          </svg>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search title, city, looking for…"
            aria-label="Search listings"
          />
        </div>
        <select name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="intent" defaultValue={intent} aria-label="Intent">
          <option value="">All intents</option>
          {INTENTS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <button className="primary filters-submit" type="submit">
          Filter
        </button>
      </form>

      {/* TODO(phase2): near-me ZIP/radius ranking + notification matching */}

      {fetchError ? <div className="err">{fetchError}</div> : null}

      {!hasSupabaseConfig() ? (
        <div className="panel empty">
          Connect Supabase to load live listings. The static demo remains at the
          repo root (<code>index.html</code>).
        </div>
      ) : listings.length === 0 ? (
        <div className="panel empty">
          <div className="empty-icon" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-64.png" alt="" width={48} height={48} />
          </div>
          <p>No approved listings yet. Be the first to post.</p>
          <Link href="/post" className="primary cta">
            Post leftovers
          </Link>
        </div>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} rating={ratings[l.poster_id]} />
          ))}
        </div>
      )}
    </div>
  );
}
