import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RatingBadge } from "@/components/RatingBadge";
import { createClient } from "@/lib/supabase/server";
import { fetchRatings } from "@/lib/ratings";
import { ReportReview } from "./ReportReview";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function MemberPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, city, company, is_contractor")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const ratings = await fetchRatings(supabase, [id]);
  const { data: reviews } = await supabase
    .from("public_reviews")
    .select("id, stars, comment, created_at, reviewer_id")
    .eq("reviewee_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows =
    (reviews as { id: string; stars: number; comment: string; created_at: string; reviewer_id: string }[]) || [];
  const { data: reviewers } = rows.length
    ? await supabase.from("profiles").select("id, display_name").in("id", rows.map((r) => r.reviewer_id))
    : { data: [] };
  const names = new Map(
    ((reviewers as { id: string; display_name: string | null }[]) || []).map((p) => [p.id, p.display_name])
  );
  const list = rows.map((r) => ({ ...r, name: names.get(r.reviewer_id) || "Member" }));

  return (
    <div className="wrap stack">
      <div className="panel">
        <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}>
          <Avatar url={profile.avatar_url} name={profile.display_name || "Member"} />
          <div>
            <h2 style={{ margin: 0 }}>{profile.display_name || "Member"}</h2>
            <div className="meta">
              {profile.is_contractor && profile.company ? `Contractor · ${profile.company}` : profile.city || ""}
            </div>
            <RatingBadge rating={ratings[id]} />
          </div>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Reviews</h3>
        {list.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {list.map((r) => {
              return (
                <li key={r.id} className="review-item">
                  <div className="row">
                    <strong>{"⭐".repeat(r.stars)}</strong>
                    {user && user.id !== r.reviewer_id ? (
                      <ReportReview reviewId={r.id} userId={user.id} />
                    ) : null}
                  </div>
                  {r.comment ? <p style={{ margin: "4px 0" }}>{r.comment}</p> : null}
                  <div className="help">
                    {r.name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
