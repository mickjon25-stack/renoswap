import { ListingCard } from "@/components/ListingCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { CATEGORIES, INTENTS } from "@/lib/constants";
import type { Listing } from "@/lib/types";
import { compareBrowseListings } from "@/lib/billing";
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

  if (hasSupabaseConfig()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .in("status", ["Approved", "Claimed"])
        .order("created_at", { ascending: false })
        .limit(60);

      if (category) query = query.eq("category", category);
      if (intent) query = query.eq("intent", intent);
      if (q) {
        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,looking_for.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error) fetchError = error.message;
      else {
        listings = ((data as Listing[]) || []).slice().sort(compareBrowseListings);
      }
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "Failed to load listings";
    }
  }

  return (
    <div className="wrap">
      <section className="hero">
        <h2>Leftover reno materials, still useful.</h2>
        <p>
          Swap or sell leftovers across Texas. Soft-launch focus: greater Austin
          + San Antonio — any Texas ZIP welcome.
        </p>
        <Link href="/post" className="primary">
          Post leftovers
        </Link>
      </section>

      <form className="filters" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, city, looking for…"
        />
        <select name="category" defaultValue={category}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="intent" defaultValue={intent}>
          <option value="">All intents</option>
          {INTENTS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <button className="primary" type="submit" style={{ gridColumn: "1 / -1", justifySelf: "start" }}>
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
        <div className="panel empty">No approved listings yet. Be the first to post.</div>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
