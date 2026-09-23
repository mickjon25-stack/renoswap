"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminActions({
  listingId,
  intent,
  fastWindowHours,
}: {
  listingId: string;
  intent: string;
  fastWindowHours: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const now = new Date();
      const patch: Record<string, unknown> = {
        status: "Approved",
        approved_at: now.toISOString(),
        reject_reason: "",
      };
      if (intent === "Fast & Free") {
        const hours = fastWindowHours || 24;
        patch.expires_at = new Date(
          now.getTime() + hours * 3600 * 1000
        ).toISOString();
      } else {
        // Default ~45 day soft expiry for non-fast listings
        patch.expires_at = new Date(
          now.getTime() + 45 * 86400 * 1000
        ).toISOString();
      }
      const { error: err } = await supabase
        .from("listings")
        .update(patch)
        .eq("id", listingId);
      if (err) throw err;
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const reason = window.prompt("Reject reason (optional)", "") ?? "";
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("listings")
        .update({
          status: "Rejected",
          reject_reason: reason.trim().slice(0, 200),
        })
        .eq("id", listingId);
      if (err) throw err;
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {error ? <div className="err">{error}</div> : null}
      <div className="actions">
        <button className="primary" type="button" disabled={busy} onClick={approve}>
          Approve
        </button>
        <button className="danger" type="button" disabled={busy} onClick={reject}>
          Reject
        </button>
      </div>
    </div>
  );
}
