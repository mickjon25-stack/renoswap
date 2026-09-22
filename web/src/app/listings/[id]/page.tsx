import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { sortedPhotos, statusChipClass } from "@/lib/listing-ui";
import type { Listing } from "@/lib/types";
import { OfferForm } from "./OfferForm";
import { ReportForm } from "./ReportForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase to view listing detail.</div>
        <Link href="/browse" className="ghost">
          ← Browse
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, listing_photos(*), profiles:poster_id(id, display_name, avatar_url, city, company, is_contractor)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const listing = data as Listing;
  const photos = sortedPhotos(listing.listing_photos);
  const poster = listing.profiles;

  return (
    <div className="wrap">
      <Link href="/browse" className="help">
        ← Back to browse
      </Link>
      <div className="detail-grid" style={{ marginTop: 12 }}>
        <div className="stack">
          <div className="photos">
            {photos[0]?.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0].public_url} alt={listing.title} />
            ) : (
              <div className="thumb" style={{ height: 220, borderRadius: 14 }} />
            )}
            <div className="stack">
              {photos.slice(1, 3).map((p) =>
                p.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} className="small" src={p.public_url} alt="" />
                ) : null
              )}
            </div>
          </div>
          <div className="panel">
            <div className="row">
              <h2 style={{ margin: 0 }}>{listing.title}</h2>
              <span className={`status-chip ${statusChipClass(listing.status)}`}>
                {listing.status}
              </span>
            </div>
            <p className="meta">
              {listing.intent} · {listing.category} · {listing.condition}
            </p>
            <p>{listing.description}</p>
            {listing.looking_for ? (
              <p>
                <strong>Looking for:</strong> {listing.looking_for}
              </p>
            ) : null}
            <p className="meta">
              {listing.city}, {listing.zip}
              {listing.pickup_ok ? " · Pickup OK" : ""}
              {listing.shipping_ok ? " · Shipping OK" : ""}
              {listing.dumpster_bound ? " · Dumpster-bound" : ""}
            </p>
            <p>
              {listing.intent === "Fast & Free"
                ? "Free — claim before the window closes"
                : listing.price > 0
                  ? `$${Number(listing.price).toFixed(2)}`
                  : "Open to swap"}
            </p>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Poster</h3>
            <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
              {poster?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={poster.avatar_url} alt="" />
              ) : (
                <div className="avatar" />
              )}
              <div>
                <strong>{poster?.display_name || "Member"}</strong>
                <div className="meta">
                  {poster?.is_contractor && poster.company
                    ? `Contractor · ${poster.company}`
                    : poster?.city || "Texas"}
                </div>
              </div>
            </div>
          </div>

          {user && user.id !== listing.poster_id && listing.status === "Approved" ? (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Make an offer / message</h3>
              <p className="help" style={{ marginTop: 0 }}>
                Sends an offer and opens a thread in your{" "}
                <Link href="/inbox">Inbox</Link>.
              </p>
              <OfferForm listingId={listing.id} />
            </div>
          ) : null}

          {user ? (
            <div className="panel">
              <h3 style={{ marginTop: 0 }}>Report</h3>
              <ReportForm listingId={listing.id} reportedUserId={listing.poster_id} />
            </div>
          ) : (
            <div className="panel">
              <p className="help">
                <Link href="/auth">Sign in</Link> to message or report.
              </p>
            </div>
          )}

          <div className="warn">
            RenoSwap never holds materials payment. Arrange pickup / Venmo /
            Zelle / cash off-platform. Stay safe — public places for first meetups.
          </div>
        </div>
      </div>
    </div>
  );
}
