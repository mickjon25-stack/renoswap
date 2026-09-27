"use client";

import { getMyProfile } from "@/lib/supabase/my-profile";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveClientUser } from "@/lib/supabase/client-auth";
import {
  hasSupabaseConfig,
  MISSING_SUPABASE_ENV_MESSAGE,
} from "@/lib/supabase/env";
import { texasZipError } from "@/lib/texas-zip";
import type { Profile } from "@/lib/types";
import { AvatarEditor } from "@/components/AvatarEditor";

export default function AccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    city: "",
    zip: "",
    bio: "",
    company: "",
    role: "Homeowner",
    is_contractor: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!hasSupabaseConfig()) {
          setError(MISSING_SUPABASE_ENV_MESSAGE);
          return;
        }
        const user = await resolveClientUser();
        if (!user) {
          router.push("/auth");
          return;
        }
        if (cancelled) return;
        setUserId(user.id);
        setUserEmail(user.email ?? null);

        const supabase = createClient();
        const { data: existing, error: err } = await getMyProfile(supabase);
        if (err) throw err;

        let data = existing;
        if (!data) {
          const displayName =
            (user.user_metadata?.display_name as string | undefined) ||
            (user.email ? user.email.split("@")[0] : "user");
          // Insert-if-missing (ON CONFLICT DO NOTHING); private columns
          // aren't readable via the API, so re-read through getMyProfile().
          const { error: upErr } = await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email ?? null,
              display_name: displayName,
            },
            { onConflict: "id", ignoreDuplicates: true }
          );
          if (upErr) throw upErr;
          const { data: fresh, error: freshErr } = await getMyProfile(supabase);
          if (freshErr) throw freshErr;
          data = fresh;
        }

        if (!cancelled && data) {
          const p = data as Profile;
          setProfile(p);
          setForm({
            display_name: p.display_name || "",
            city: p.city || "",
            zip: p.zip || "",
            bio: p.bio || "",
            company: p.company || "",
            role: p.role || "Homeowner",
            is_contractor: p.is_contractor || p.role === "Contractor",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!hasSupabaseConfig()) {
      setError(MISSING_SUPABASE_ENV_MESSAGE);
      return;
    }
    if (!userId) {
      setError("Not signed in.");
      return;
    }

    const zipErr = form.zip ? texasZipError(form.zip) : null;
    if (zipErr) {
      setError(zipErr);
      return;
    }
    if (!form.display_name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (form.is_contractor && !form.company.trim()) {
      setError("Company name is required for contractors.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      // Never demote an admin via the account form.
      const role =
        profile?.is_admin || form.role === "Admin"
          ? "Admin"
          : form.is_contractor
            ? "Contractor"
            : "Homeowner";
      const profile_complete = Boolean(
        form.display_name.trim() && form.city.trim() && form.zip.trim()
      );

      const { data, error: err } = await supabase
        .from("profiles")
        .update({
            display_name: form.display_name.trim(),
            city: form.city.trim(),
            zip: form.zip.trim(),
            bio: form.bio.trim(),
            company: form.is_contractor ? form.company.trim() : "",
            role,
            is_contractor: form.is_contractor,
            profile_complete,
          })
        .eq("id", userId)
        .select("id");
      if (err) throw err;
      if (!data?.length) throw new Error("Save failed: profile not found.");
      const { data: fresh, error: freshErr } = await getMyProfile(supabase);
      if (freshErr) throw freshErr;
      setProfile(fresh);
      setOk(
        profile_complete
          ? "Profile saved."
          : "Saved. Add city and Texas ZIP to mark your profile complete."
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="wrap">
        <p className="muted">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="panel" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>Account</h2>
          <form action="/auth/signout" method="post">
            <button className="ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <p className="help">
          Photo, city, and Texas ZIP — editable anytime. Profile is complete when
          display name, city, and ZIP are set.
        </p>
        {error ? <div className="err">{error}</div> : null}
        {ok ? <div className="ok">{ok}</div> : null}

        {userId ? (
          <AvatarEditor
            userId={userId}
            name={form.display_name || profile?.display_name || userEmail || ""}
            url={profile?.avatar_url ?? null}
            onChange={(url) =>
              setProfile((p) => (p ? { ...p, avatar_url: url } : p))
            }
          />
        ) : null}

        <form onSubmit={onSave}>
          <div className="field">
            <label htmlFor="display_name">Display name</label>
            <input
              id="display_name"
              required
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="zip">Texas ZIP</label>
            <input
              id="zip"
              inputMode="numeric"
              maxLength={5}
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              placeholder="78701"
            />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="field check-row">
            <label>
              <input
                type="checkbox"
                checked={form.is_contractor}
                onChange={(e) =>
                  setForm({ ...form, is_contractor: e.target.checked })
                }
              />
              I&apos;m a contractor (self-reported)
            </label>
          </div>
          {form.is_contractor ? (
            <div className="field">
              <label htmlFor="company">Company name</label>
              <input
                id="company"
                required={form.is_contractor}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
          ) : null}
          <div className="actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            <Link href="/my-listings" className="ghost">
              My listings
            </Link>
            <Link href="/billing" className="ghost">
              Billing
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
