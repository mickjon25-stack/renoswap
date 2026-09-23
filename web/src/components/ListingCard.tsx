import Link from "next/link";
import type { Listing } from "@/lib/types";
import { primaryPhotoUrl } from "@/lib/listing-ui";
import { isRecentlyBumped } from "@/lib/billing";

function intentClass(intent: string) {
  if (intent === "Fast & Free") return "free";
  if (intent === "Sell") return "sell";
  return "swap";
}

export function ListingCard({ listing }: { listing: Listing }) {
  const photo = primaryPhotoUrl(listing.listing_photos);

  return (
    <Link href={`/listings/${listing.id}`} className="card">
      <div
        className="thumb"
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      >
        <span className={`badge ${intentClass(listing.intent)}`}>
          {listing.intent}
        </span>
        {listing.status === "Claimed" ? (
          <span className="badge claimed">Claimed</span>
        ) : null}
        {listing.status === "Pending Review" ? (
          <span className="badge status-pending">Pending</span>
        ) : null}
        {isRecentlyBumped(listing.bumped_at) ? (
          <span className="badge claimed">Bumped</span>
        ) : null}
      </div>
      <div className="card-body">
        <h3>{listing.title}</h3>
        <div className="meta">
          {listing.category} · {listing.condition}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="meta">
            {listing.city}, {listing.zip}
          </span>
          <span className="meta">
            {listing.intent === "Fast & Free"
              ? "Free"
              : listing.price > 0
                ? `$${Number(listing.price).toFixed(0)}`
                : "Swap"}
          </span>
        </div>
      </div>
    </Link>
  );
}
