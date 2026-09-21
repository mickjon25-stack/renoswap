import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { primaryPhotoUrl } from "@/lib/listing-ui";
import type { Listing, Report } from "@/lib/types";
import { AdminActions } from "./AdminActions";
import { ReportActions } from "./ReportActions";

export const dynamic = "force-dynamic";

type PendingListing = Listing & {
  profiles?: { display_name: string | null } | null;
};

export default async function AdminPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase for the admin queue.</div>
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
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="wrap">
        <div className="err">
          Admin only. Set <code>profiles.is_admin = true</code> for your user in
          Supabase.
        </div>
      </div>
    );
  }

  const { data: pending } = await supabase
    .from("listings")
    .select(
      "*, listing_photos(*), profiles:poster_id(display_name)"
    )
    .eq("status", "Pending Review")
    .order("created_at", { ascending: true });

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "Pending")
    .order("created_at", { ascending: true });

  const listings = (pending as PendingListing[]) || [];
  const pendingReports = (reports as Report[]) || [];

  return (
    <div className="wrap stack">
      <h2 style={{ margin: 0 }}>Admin queue</h2>
      <p className="help">
        Approve / reject listings. Fast & Free timer starts on approve.
      </p>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>
          Pending listings ({listings.length})
        </h3>
        {listings.length === 0 ? (
          <p className="muted">No pending listings.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Intent / ZIP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const thumb = primaryPhotoUrl(l.listing_photos);
                const posterName = l.profiles?.display_name || "Member";
                return (
                  <tr key={l.id}>
                    <td style={{ width: 64 }}>
                      <div
                        className="thumb"
                        style={{
                          height: 52,
                          width: 52,
                          borderRadius: 10,
                          backgroundImage: thumb ? `url(${thumb})` : undefined,
                        }}
                      />
                    </td>
                    <td>
                      <Link href={`/listings/${l.id}`}>
                        <strong>{l.title}</strong>
                      </Link>
                      <div className="help">
                        {l.category} · {l.condition} · by {posterName}
                      </div>
                      <div className="help">{l.description.slice(0, 140)}</div>
                    </td>
                    <td>
                      {l.intent}
                      <div className="help">
                        {l.city}, {l.zip}
                      </div>
                      <div className="help">
                        {(l.listing_photos?.length ?? 0)} photo
                        {(l.listing_photos?.length ?? 0) === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td>
                      <AdminActions
                        listingId={l.id}
                        intent={l.intent}
                        fastWindowHours={l.fast_window_hours}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>
          Pending reports ({pendingReports.length})
        </h3>
        {pendingReports.length === 0 ? (
          <p className="muted">No pending reports.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Reason</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.map((r) => (
                <tr key={r.id}>
                  <td>{r.reason}</td>
                  <td>
                    <div className="help">{r.details || "—"}</div>
                    <div className="help">
                      listing:{" "}
                      {r.listing_id ? (
                        <Link href={`/listings/${r.listing_id}`}>
                          {r.listing_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}{" "}
                      · user: {r.reported_user_id || "—"}
                    </div>
                  </td>
                  <td>
                    <ReportActions reportId={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
