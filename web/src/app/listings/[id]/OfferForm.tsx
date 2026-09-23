"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function OfferForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setThreadId(null);
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Write a message first.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");

      const { data: listing, error: listingErr } = await supabase
        .from("listings")
        .select("poster_id")
        .eq("id", listingId)
        .single();
      if (listingErr) throw listingErr;
      if (!listing) throw new Error("Listing not found");
      if (listing.poster_id === user.id) {
        throw new Error("You can't offer on your own listing");
      }

      // Reuse an existing thread for this listing + counterparty when present.
      const { data: existingThreads } = await supabase
        .from("threads")
        .select("id, participant_a, participant_b")
        .eq("listing_id", listingId)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

      const existing = (existingThreads || []).find(
        (t) =>
          (t.participant_a === user.id &&
            t.participant_b === listing.poster_id) ||
          (t.participant_b === user.id && t.participant_a === listing.poster_id)
      );
      let openThreadId = existing?.id as string | undefined;

      const { data: offer, error: offerErr } = await supabase
        .from("offers")
        .insert({
          listing_id: listingId,
          from_user_id: user.id,
          message: trimmed,
          status: "Pending",
        })
        .select("id")
        .single();
      if (offerErr) throw offerErr;

      if (!openThreadId) {
        const { data: thread, error: threadErr } = await supabase
          .from("threads")
          .insert({
            listing_id: listingId,
            offer_id: offer.id,
            participant_a: user.id,
            participant_b: listing.poster_id,
          })
          .select("id")
          .single();
        if (threadErr) throw threadErr;
        openThreadId = thread.id;
      }

      if (!openThreadId) throw new Error("Could not open message thread");

      const { error: msgErr } = await supabase.from("messages").insert({
        thread_id: openThreadId,
        sender_id: user.id,
        body: trimmed,
      });
      if (msgErr) throw msgErr;

      setMessage("");
      setThreadId(openThreadId);
      router.refresh();
      router.push(`/inbox/${openThreadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="err">{error}</div> : null}
      {threadId ? (
        <div className="ok">
          Offer sent.{" "}
          <Link href={`/inbox/${threadId}`}>Open conversation</Link> or{" "}
          <Link href="/inbox">view inbox</Link>.
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="offer-msg">Message</label>
        <textarea
          id="offer-msg"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I'd swap my leftover tile for this…"
        />
      </div>
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send offer"}
      </button>
    </form>
  );
}
