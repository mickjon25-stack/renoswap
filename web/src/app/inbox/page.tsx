import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Message, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type ThreadRow = {
  id: string;
  listing_id: string | null;
  offer_id: string | null;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
  listings: { id: string; title: string; status: string } | null;
};


function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function previewBody(body: string, max = 90) {
  const t = body.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
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

export default async function InboxPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase to view your inbox.</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: threadRows, error } = await supabase
    .from("threads")
    .select(
      "id, listing_id, offer_id, participant_a, participant_b, created_at, updated_at, listings:listing_id(id, title, status)"
    )
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const threads = ((threadRows as unknown as ThreadRow[] | null) || []).map((t) => ({
    ...t,
    listings: one(t.listings as ThreadRow["listings"] | ThreadRow["listings"][]),
  }));
  const threadIds = threads.map((t) => t.id);

  const lastByThread = new Map<string, Message>();
  if (threadIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    for (const m of (msgs as Message[] | null) || []) {
      if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    }
  }

  const counterpartIds = [
    ...new Set(
      threads.map((t) =>
        t.participant_a === user.id ? t.participant_b : t.participant_a
      )
    ),
  ];

  const profileById = new Map<string, Pick<Profile, "id" | "display_name" | "avatar_url">>();
  if (counterpartIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", counterpartIds);
    for (const p of profiles || []) {
      profileById.set(p.id, p as Pick<Profile, "id" | "display_name" | "avatar_url">);
    }
  }

  const rows = threads
    .map((t) => {
      const otherId = t.participant_a === user.id ? t.participant_b : t.participant_a;
      const last = lastByThread.get(t.id) || null;
      const sortAt = last?.created_at || t.updated_at || t.created_at;
      return { thread: t, otherId, last, sortAt };
    })
    .sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0));

  return (
    <div className="wrap">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Inbox</h2>
        <Link href="/browse" className="ghost">
          Browse listings
        </Link>
      </div>
      <p className="help" style={{ marginBottom: 16 }}>
        Offers and messages about listings you posted or contacted. Arrange
        pickup off-platform — RenoSwap never holds payment.
      </p>
      {error ? <div className="err">{error.message}</div> : null}
      {rows.length === 0 ? (
        <div className="panel empty">
          No conversations yet.{" "}
          <Link href="/browse">Browse</Link> a listing and send an offer to start
          one.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <ul className="inbox-list">
            {rows.map(({ thread, otherId, last, sortAt }) => {
              const other = profileById.get(otherId);
              const title = thread.listings?.title || "Listing";
              return (
                <li key={thread.id}>
                  <Link href={`/inbox/${thread.id}`} className="inbox-row">
                    {other?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="avatar sm" src={other.avatar_url} alt="" />
                    ) : (
                      <div className="avatar sm" />
                    )}
                    <div className="inbox-row-body">
                      <div className="row" style={{ gap: 8 }}>
                        <strong>{title}</strong>
                        <span className="meta">{formatWhen(sortAt)}</span>
                      </div>
                      <div className="meta">
                        with {other?.display_name || "Member"}
                      </div>
                      <div className="inbox-preview">
                        {last
                          ? previewBody(last.body)
                          : "No messages yet — open to reply."}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
