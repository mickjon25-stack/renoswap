import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { primaryPhotoUrl, statusChipClass } from "@/lib/listing-ui";
import type { Listing } from "@/lib/types";
import { BumpButton } from "@/components/BumpButton";
import {
  FREE_LISTING_CAP,
  isRecentlyBumped,
  listingCapForPlan,
} from "@/lib/billing";
import { ACTIVE_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase to manage your listings.</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_status")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("poster_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data as Listing[]) || [];
  const activeCount = listings.filter((l) =>
    (ACTIVE_STATUSES as readonly string[]).includes(l.status)
  ).length;
  const cap = listingCapForPlan(profile?.plan, profile?.plan_status);

  return (
    <div className="wrap">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>My listings</h2>
        <Link href="/post" className="primary">
          New post
        </Link>
      </div>
      <p className="help" style={{ marginBottom: 16 }}>
        Active listings: {activeCount}/{cap} (Pending / Approved / Claimed). Free
        tier is {FREE_LISTING_CAP}.{" "}
        <Link href="/billing">Manage billing &amp; upgrades</Link>.
      </p>
      {error ? <div className="err">{error.message}</div> : null}
      {listings.length === 0 ? (
        <div className="panel empty">You haven&apos;t posted yet.</div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Status</th>
                <th>Intent</th>
                <th>ZIP</th>
                <th>Boost</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const thumb = primaryPhotoUrl(l.listing_photos);
                const photoCount = l.listing_photos?.length ?? 0;
                return (
                  <tr key={l.id}>
                    <td style={{ width: 56 }}>
                      <div
                        className="thumb"
                        style={{
                          height: 44,
                          width: 44,
                          borderRadius: 8,
                          backgroundImage: thumb ? `url(${thumb})` : undefined,
                        }}
                      />
                    </td>
                    <td>
                      <Link href={`/listings/${l.id}`}>{l.title}</Link>
                      <div className="help">
                        {photoCount} photo{photoCount === 1 ? "" : "s"}
                      </div>
                      {l.status === "Rejected" && l.reject_reason ? (
                        <div className="help">Rejected: {l.reject_reason}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`status-chip ${statusChipClass(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>{l.intent}</td>
                    <td>
                      {l.city}, {l.zip}
                      {isRecentlyBumped(l.bumped_at) ? (
                        <div className="help">Bumped (7-day boost)</div>
                      ) : null}
                    </td>
                    <td>
                      <BumpButton listingId={l.id} bumpedAt={l.bumped_at} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
