"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type TradeInfo = {
  id: string;
  status: "Pending" | "Confirmed" | "Cancelled";
  requested_by: string;
} | null;

export function TradePanel({
  threadId,
  userId,
  otherId,
  otherName,
  trade,
  myReview,
}: {
  threadId: string;
  userId: string;
  otherId: string;
  otherName: string;
  trade: TradeInfo;
  myReview: { stars: number; comment: string } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await fn();
      if (err) throw new Error(err.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const supabase = createClient();

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!trade) return;
    if (stars < 1) {
      setError("Pick 1 to 5 stars.");
      return;
    }
    await run(() =>
      supabase.from("reviews").insert({
        trade_id: trade.id,
        reviewer_id: userId,
        reviewee_id: otherId,
        stars,
        comment: comment.trim().slice(0, 500),
      })
    );
  }

  let body: React.ReactNode;
  if (!trade || trade.status === "Cancelled") {
    body = (
      <>
        <p className="help" style={{ marginTop: 0 }}>
          Done swapping or selling? Mark it complete. Once {otherName} confirms,
          you can both leave a review.
        </p>
        <button
          className="primary"
          type="button"
          disabled={busy}
          onClick={() => run(() => supabase.rpc("request_trade_complete", { p_thread_id: threadId }))}
        >
          Mark trade complete
        </button>
      </>
    );
  } else if (trade.status === "Pending" && trade.requested_by === userId) {
    body = (
      <>
        <p className="help" style={{ marginTop: 0 }}>
          Waiting for {otherName} to confirm the trade.
        </p>
        <button
          className="ghost"
          type="button"
          disabled={busy}
          onClick={() => run(() => supabase.rpc("respond_trade_complete", { p_trade_id: trade.id, p_accept: false }))}
        >
          Cancel request
        </button>
      </>
    );
  } else if (trade.status === "Pending") {
    body = (
      <>
        <p className="help" style={{ marginTop: 0 }}>
          {otherName} says this trade is complete. Is that right?
        </p>
        <div className="actions">
          <button
            className="primary"
            type="button"
            disabled={busy}
            onClick={() => run(() => supabase.rpc("respond_trade_complete", { p_trade_id: trade.id, p_accept: true }))}
          >
            Yes, confirm trade
          </button>
          <button
            className="ghost"
            type="button"
            disabled={busy}
            onClick={() => run(() => supabase.rpc("respond_trade_complete", { p_trade_id: trade.id, p_accept: false }))}
          >
            Not yet
          </button>
        </div>
      </>
    );
  } else if (myReview) {
    body = (
      <p className="help" style={{ marginTop: 0 }}>
        Trade confirmed. You gave {otherName} {"⭐".repeat(myReview.stars)}
        {myReview.comment ? ` — “${myReview.comment}”` : ""}. Reviews show on
        profiles once you both review, or after 7 days.
      </p>
    );
  } else {
    body = (
      <form onSubmit={submitReview}>
        <p className="help" style={{ marginTop: 0 }}>
          Trade confirmed. How did it go with {otherName}? They won&apos;t see
          your review until they leave one too (or after 7 days).
        </p>
        <div className="star-picker" role="radiogroup" aria-label="Stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= stars ? "on" : ""}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-checked={n === stars}
              role="radio"
              onClick={() => setStars(n)}
            >
              ★
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="review-comment">Comment (optional)</label>
          <textarea
            id="review-comment"
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Showed up on time, tile was as pictured."
          />
          <div className="help">{comment.length}/500</div>
        </div>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Post review"}
        </button>
      </form>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>Trade &amp; review</h3>
      {error ? <div className="err">{error}</div> : null}
      {body}
    </div>
  );
}
