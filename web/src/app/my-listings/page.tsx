import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Listing } from "@/lib/types";

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

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("poster_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data as Listing[]) || [];

  return (
    <div className="wrap">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>My listings</h2>
        <Link href="/post" className="primary">
          New post
        </Link>
      </div>
      <p className="help" style={{ marginBottom: 16 }}>
        {/* TODO(phase2): Stripe — 3 free active listings, then $3.99/mo */}
        Free tier: up to 3 active listings (Pending / Approved / Claimed). Paid
        upgrade coming later.
      </p>
      {error ? <div className="err">{error.message}</div> : null}
      {listings.length === 0 ? (
        <div className="panel empty">You haven&apos;t posted yet.</div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Intent</th>
                <th>ZIP</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/listings/${l.id}`}>{l.title}</Link>
                    {l.status === "Rejected" && l.reject_reason ? (
                      <div className="help">Rejected: {l.reject_reason}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className="status-chip">{l.status}</span>
                  </td>
                  <td>{l.intent}</td>
                  <td>
                    {l.city}, {l.zip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
