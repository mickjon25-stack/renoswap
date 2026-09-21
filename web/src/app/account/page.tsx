"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { texasZipError } from "@/lib/texas-zip";
import type { Profile } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth");
          return;
        }
        const { data, error: err } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (err) throw err;
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
    const zipErr = form.zip ? texasZipError(form.zip) : null;
    if (zipErr) {
      setError(zipErr);
      return;
    }
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      let avatar_url = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${profile.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = pub.publicUrl;
      }

      const role = form.is_contractor ? "Contractor" : form.role === "Admin" ? "Admin" : "Homeowner";
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
          avatar_url,
          profile_complete,
        })
        .eq("id", profile.id)
        .select("*")
        .single();
      if (err) throw err;
      setProfile(data as Profile);
      setOk("Profile saved.");
      setAvatarFile(null);
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
        <p className="help">Photo, city, and Texas ZIP — editable anytime.</p>
        {error ? <div className="err">{error}</div> : null}
        {ok ? <div className="ok">{ok}</div> : null}

        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={profile.avatar_url} alt="" style={{ marginBottom: 12 }} />
        ) : (
          <div className="avatar" style={{ marginBottom: 12 }} />
        )}

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
          <div className="field">
            <label htmlFor="avatar">Avatar photo</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            <Link href="/my-listings" className="ghost">
              My listings
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
