"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function OfferForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");

      const { data: listing } = await supabase
        .from("listings")
        .select("poster_id")
        .eq("id", listingId)
        .single();
      if (!listing) throw new Error("Listing not found");

      const { data: offer, error: offerErr } = await supabase
        .from("offers")
        .insert({
          listing_id: listingId,
          from_user_id: user.id,
          message,
          status: "Pending",
        })
        .select("id")
        .single();
      if (offerErr) throw offerErr;

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

      if (message.trim()) {
        await supabase.from("messages").insert({
          thread_id: thread.id,
          sender_id: user.id,
          body: message.trim(),
        });
      }

      setOk(true);
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="err">{error}</div> : null}
      {ok ? <div className="ok">Offer sent — a message thread was opened.</div> : null}
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
