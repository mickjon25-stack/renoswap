import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Message, Profile } from "@/lib/types";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type ThreadDetail = {
  id: string;
  listing_id: string | null;
  offer_id: string | null;
  participant_a: string;
  participant_b: string;
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

  const [{ data: otherProfile }, { data: messages, error: msgErr }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url, city")
        .eq("id", otherId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, thread_id, sender_id, body, created_at")
        .eq("thread_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const other = otherProfile as Pick<
    Profile,
    "id" | "display_name" | "avatar_url" | "city"
  > | null;
  const msgs = (messages as Message[] | null) || [];
  const listing = thread.listings;
  const offer = thread.offers;

  return (
    <div className="wrap">
      <Link href="/inbox" className="help">
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
              with {other?.display_name || "Member"}
              {other?.city ? ` · ${other.city}` : ""}
              {offer?.status ? ` · Offer ${offer.status}` : ""}
            </div>
          </div>
          {other?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar sm" src={other.avatar_url} alt="" />
          ) : (
            <div className="avatar sm" />
          )}
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
                    {mine ? "You" : other?.display_name || "Them"} ·{" "}
                    {formatWhen(m.created_at)}
                  </div>
                  <div className="message-body">{m.body}</div>
                </li>
              );
            })}
          </ul>
        )}
        <ReplyForm threadId={thread.id} />
      </div>

      <div className="warn" style={{ marginTop: 12 }}>
        Stay safe — meet in public for pickups. RenoSwap never holds materials
        payment (Venmo / Zelle / cash off-platform).
      </div>
    </div>
  );
}
