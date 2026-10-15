import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Message, Profile } from "@/lib/types";
import { ReplyForm } from "./ReplyForm";
import { TradePanel, type TradeInfo } from "./TradePanel";
import { RatingBadge } from "@/components/RatingBadge";
import { fetchRatings } from "@/lib/ratings";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type ThreadDetail = {
  id: string;
  listing_id: string | null;
  offer_id: string | null;
  participant_a: string | null;
  participant_b: string | null;
  created_at: string;
  listings: { id: string; title: string; status: string } | null;
  offers: { id: string; status: string; message: string } | null;
};


function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default async function ThreadPage({ params }: { params: Params }) {
  const { id } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase to view this thread.</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: threadData, error: threadErr } = await supabase
    .from("threads")
    .select(
      "id, listing_id, offer_id, participant_a, participant_b, created_at, listings:listing_id(id, title, status), offers:offer_id(id, status, message)"
    )
    .eq("id", id)
    .maybeSingle();

  if (threadErr || !threadData) notFound();
  const raw = threadData as unknown as ThreadDetail & {
    listings: ThreadDetail["listings"] | ThreadDetail["listings"][];
    offers: ThreadDetail["offers"] | ThreadDetail["offers"][];
  };
  const thread: ThreadDetail = {
    ...raw,
    listings: one(raw.listings),
    offers: one(raw.offers),
  };

  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    notFound();
  }

  const otherId =
    thread.participant_a === user.id
      ? thread.participant_b
      : thread.participant_a;

  const otherDeleted = !otherId;
  const [{ data: otherProfile }, { data: messages, error: msgErr }, { data: tradeRow }, ratings] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, city")
        .eq("id", otherId ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, thread_id, sender_id, body, created_at")
        .eq("thread_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("trades")
        .select("id, status, requested_by")
        .eq("thread_id", id)
        .maybeSingle(),
      fetchRatings(supabase, otherId ? [otherId] : []),
    ]);
  const trade = (tradeRow as TradeInfo) || null;
  let myReview: { stars: number; comment: string } | null = null;
  if (trade?.status === "Confirmed") {
    const { data: rv } = await supabase
      .from("reviews")
      .select("stars, comment")
      .eq("trade_id", trade.id)
      .eq("reviewer_id", user.id)
      .maybeSingle();
    myReview = (rv as { stars: number; comment: string } | null) || null;
  }

  const other = otherProfile as Pick<
    Profile,
    "id" | "display_name" | "avatar_url" | "city"
  > | null;
  const msgs = (messages as Message[] | null) || [];
  const listing = thread.listings;
  const offer = thread.offers;

  return (
    <div className="wrap">
      <Link href="/inbox" className="back-link">
        ← Back to inbox
      </Link>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="row">
          <div>
            <h2 style={{ margin: "0 0 4px" }}>
              {listing ? (
                <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
              ) : (
                "Conversation"
              )}
            </h2>
            <div className="meta">
              with{" "}
              {otherDeleted ? (
                "Deleted member"
              ) : (
                <Link href={`/members/${otherId}`}>{other?.display_name || "Member"}</Link>
              )}
              {other?.city ? ` · ${other.city}` : ""}
              {offer?.status ? ` · Offer ${offer.status}` : ""}
            </div>
            {otherId ? <RatingBadge rating={ratings[otherId]} /> : null}
          </div>
          <Avatar url={other?.avatar_url} name={otherDeleted ? "Deleted member" : other?.display_name || "Member"} />
        </div>
      </div>

      {msgErr ? <div className="err">{msgErr.message}</div> : null}

      <div className="panel thread-panel" style={{ marginTop: 12 }}>
        {msgs.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            No messages in this thread yet.
          </div>
        ) : (
          <ul className="message-list">
            {msgs.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <li
                  key={m.id}
                  className={`message-bubble ${mine ? "mine" : "theirs"}`}
                >
                  <div className="message-meta">
                    {mine ? null : (
                      <Avatar url={other?.avatar_url} name={other?.display_name || "Member"} size="xs" />
                    )}
                    {mine ? "You" : m.sender_id && !otherDeleted ? other?.display_name || "Them" : "Deleted member"} ·{" "}
                    {formatWhen(m.created_at)}
                  </div>
                  <div className="message-body">{m.body}</div>
                </li>
              );
            })}
          </ul>
        )}
        {otherDeleted ? (
          <div className="help" style={{ padding: 12 }}>
            This member deleted their account, so you can&apos;t reply.
          </div>
        ) : (
          <ReplyForm threadId={thread.id} />
        )}
      </div>

      {listing && otherId ? (
        <TradePanel
          threadId={thread.id}
          userId={user.id}
          otherId={otherId}
          otherName={other?.display_name || "the other member"}
          trade={trade}
          myReview={myReview}
        />
      ) : null}

      <div className="warn" style={{ marginTop: 12 }}>
        Stay safe — meet in public for pickups. RenoSwap never holds materials
        payment (Venmo / Zelle / cash off-platform).
      </div>
    </div>
  );
}
