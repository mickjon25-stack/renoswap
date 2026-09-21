"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseConfig,
  MISSING_SUPABASE_ENV_MESSAGE,
} from "@/lib/supabase/env";
import { CATEGORIES, CONDITIONS, INTENTS } from "@/lib/constants";
import { texasZipError } from "@/lib/texas-zip";

export default function PostPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0] as string,
    intent: INTENTS[0] as string,
    condition: CONDITIONS[2] as string,
    description: "",
    looking_for: "",
    price: "0",
    city: "",
    zip: "",
    pickup_ok: true,
    shipping_ok: false,
    dumpster_bound: false,
    fast_window_hours: "24",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasSupabaseConfig()) {
        setAuthChecked(true);
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/auth");
        return;
      }
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasSupabaseConfig()) {
      setError(MISSING_SUPABASE_ENV_MESSAGE);
      return;
    }

    const zipErr = texasZipError(form.zip);
    if (zipErr) {
      setError(zipErr);
      return;
    }
    if (!form.title.trim() || !form.city.trim()) {
      setError("Title and city are required.");
      return;
    }
    if (!files || files.length < 1) {
      setError("Add at least one photo (up to 6). Photos are required for listings.");
      return;
    }

    setLoading(true);
    let createdListingId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // TODO(phase2): enforce 3 free active listings then Stripe $3.99/mo
      const price =
        form.intent === "Fast & Free" || form.intent === "Swap"
          ? 0
          : Number(form.price) || 0;

      const { data: listing, error: insertErr } = await supabase
        .from("listings")
        .insert({
          poster_id: user.id,
          title: form.title.trim(),
          category: form.category,
          intent: form.intent,
          condition: form.condition,
          description: form.description.trim(),
          looking_for: form.looking_for.trim(),
          price,
          city: form.city.trim(),
          zip: form.zip.trim(),
          pickup_ok: form.pickup_ok,
          shipping_ok: form.shipping_ok,
          dumpster_bound: form.dumpster_bound,
          fast_window_hours: Number(form.fast_window_hours) || 24,
          status: "Pending Review",
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      createdListingId = listing.id;

      const max = Math.min(files.length, 6);
      for (let i = 0; i < max; i++) {
        const file = files[i];
        const ext = (file.name.split(".").pop() || "jpg")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const path = `${user.id}/${listing.id}/${i}.${ext || "jpg"}`;
        const { error: upErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, file, {
            upsert: true,
            contentType: file.type || "image/jpeg",
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);
        const { error: photoErr } = await supabase.from("listing_photos").insert({
          listing_id: listing.id,
          storage_path: path,
          public_url: pub.publicUrl,
          sort_order: i,
        });
        if (photoErr) throw photoErr;
      }

      router.push("/my-listings");
      router.refresh();
    } catch (err) {
      if (createdListingId && hasSupabaseConfig()) {
        try {
          const supabase = createClient();
          await supabase.from("listings").delete().eq("id", createdListingId);
        } catch {
          // best-effort rollback so we don't leave photo-less pending listings
        }
      }
      setError(err instanceof Error ? err.message : "Failed to post listing");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="wrap">
        <div className="panel empty">Checking sign-in…</div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="panel" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Post leftovers</h2>
        <p className="help">
          Listings start as <strong>Pending Review</strong>. Admins approve before
          they appear on Browse. Texas ZIP required.
        </p>
        {!hasSupabaseConfig() ? (
          <div className="err">{MISSING_SUPABASE_ENV_MESSAGE}</div>
        ) : null}
        {error ? <div className="err">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder='Leftover 3/4" sanded plywood, 7 sheets'
            />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="intent">Intent</label>
            <select
              id="intent"
              value={form.intent}
              onChange={(e) => set("intent", e.target.value)}
            >
              {INTENTS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="condition">Condition</label>
            <select
              id="condition"
              value={form.condition}
              onChange={(e) => set("condition", e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="looking_for">Looking for (swaps)</label>
            <input
              id="looking_for"
              value={form.looking_for}
              onChange={(e) => set("looking_for", e.target.value)}
              placeholder="Subway tile, quartz remnant…"
            />
          </div>
          {form.intent === "Sell" || form.intent === "Sell or Swap" ? (
            <div className="field">
              <label htmlFor="price">Price (USD)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
          ) : null}
          {form.intent === "Fast & Free" ? (
            <div className="field">
              <label htmlFor="fast">Fast & Free window (hours after approve)</label>
              <input
                id="fast"
                type="number"
                min="1"
                value={form.fast_window_hours}
                onChange={(e) => set("fast_window_hours", e.target.value)}
              />
              <p className="help">Timer starts when an admin approves.</p>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="zip">Texas ZIP</label>
            <input
              id="zip"
              required
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
              placeholder="78701"
            />
          </div>
          <div className="field check-row">
            <label>
              <input
                type="checkbox"
                checked={form.pickup_ok}
                onChange={(e) => set("pickup_ok", e.target.checked)}
              />
              Pickup OK
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.shipping_ok}
                onChange={(e) => set("shipping_ok", e.target.checked)}
              />
              Shipping OK
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.dumpster_bound}
                onChange={(e) => set("dumpster_bound", e.target.checked)}
              />
              Dumpster-bound
            </label>
          </div>
          <div className="field">
            <label htmlFor="photos">Photos (required, up to 6)</label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              required
              onChange={(e) => setFiles(e.target.files)}
            />
            <p className="help">
              Stored in bucket <code>listing-photos</code> at{" "}
              <code>{"${userId}/${listingId}/…"}</code>. Prefer 3+ clear photos.
            </p>
          </div>
          <div className="actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Posting…" : "Submit for review"}
            </button>
            <Link href="/browse" className="ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
