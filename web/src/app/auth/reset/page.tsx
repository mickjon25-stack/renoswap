"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveClientUser } from "@/lib/supabase/client-auth";
import { friendlyAuthError } from "@/lib/auth-messages";

/** Landing page for password-reset links (via /auth/callback?next=/auth/reset). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "no-session">("checking");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    resolveClientUser()
      .then((u) => setReady(u ? "ok" : "no-session"))
      .catch(() => setReady("no-session"));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const pw = String(new FormData(e.currentTarget).get("password") ?? "") || password;
    setLoading(true);
    try {
      const { error: err } = await createClient().auth.updateUser({ password: pw });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="panel auth-panel">
        <h2 style={{ marginTop: 0 }}>Set a new password</h2>
        {ready === "checking" ? <p className="muted">Checking your reset link…</p> : null}
        {ready === "no-session" ? (
          <div className="err">
            This reset link has expired or was opened on a different device.{" "}
            <Link href="/auth">Request a new one</Link>.
          </div>
        ) : null}
        {ready === "ok" && saved ? (
          <div className="ok" role="status">Password updated. Taking you to your account…</div>
        ) : null}
        {ready === "ok" && !saved ? (
          <form onSubmit={onSubmit}>
            {error ? <div className="err" role="alert">{error}</div> : null}
            <div className="field">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
              <p className="help">At least 6 characters.</p>
            </div>
            <button className="primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
