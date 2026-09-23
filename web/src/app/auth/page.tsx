"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseConfig,
  MISSING_SUPABASE_ENV_MESSAGE,
} from "@/lib/supabase/env";

async function ensureProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string | undefined,
  displayName: string
) {
  await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      display_name: displayName,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = hasSupabaseConfig();

  useEffect(() => {
    const q = searchParams.get("error");
    if (q) {
      setError(
        q === "not_configured"
          ? MISSING_SUPABASE_ENV_MESSAGE
          : q === "missing_code"
            ? "Auth callback missing code. Check Supabase redirect URLs."
            : decodeURIComponent(q)
      );
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // Read the live form values as a fallback for browser/automation fills that
    // update the DOM before React receives the corresponding input event.
    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");
    const submittedDisplayName = String(formData.get("displayName") ?? "");
    const currentEmail = submittedEmail || email.trim();
    const currentPassword = submittedPassword || password;
    const currentDisplayName = submittedDisplayName || displayName;

    setEmail(currentEmail);
    setPassword(currentPassword);
    setDisplayName(currentDisplayName);

    if (!configured) {
      setError(MISSING_SUPABASE_ENV_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const name = currentDisplayName.trim() || currentEmail.split("@")[0];

      if (mode === "signup") {
        const origin = window.location.origin;
        const { data, error: err } = await supabase.auth.signUp({
          email: currentEmail,
          password: currentPassword,
          options: {
            data: { display_name: name },
            emailRedirectTo: `${origin}/auth/callback?next=/account`,
          },
        });
        if (err) throw err;

        if (data.user) {
          await ensureProfile(supabase, data.user.id, data.user.email, name);
        }

        if (data.session) {
          router.push("/account");
          router.refresh();
          return;
        }

        setInfo(
          "Check your email to confirm (if confirmations are enabled), then sign in. Confirm links return to /auth/callback."
        );
        setMode("signin");
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });
        if (err) throw err;
        if (data.user) {
          await ensureProfile(
            supabase,
            data.user.id,
            data.user.email,
            (data.user.user_metadata?.display_name as string) ||
              currentEmail.split("@")[0]
          );
        }
        router.push("/browse");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 440, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>
        {mode === "signin" ? "Sign in" : "Create account"}
      </h2>
      <p className="help" style={{ marginBottom: 16 }}>
        Texas-only marketplace. Email + password for Phase 1.
      </p>
      {!configured ? (
        <div className="err">{MISSING_SUPABASE_ENV_MESSAGE}</div>
      ) : null}
      {error ? <div className="err">{error}</div> : null}
      {info ? <div className="ok">{info}</div> : null}
      <form onSubmit={onSubmit}>
        {mode === "signup" ? (
          <div className="field">
            <label htmlFor="name">Display name</label>
            <input
              id="name"
              name="displayName"
              value={displayName}
              onInput={(e) => setDisplayName(e.currentTarget.value)}
              placeholder="Alex"
            />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>
        <div className="actions">
          <button
            className="primary"
            type="submit"
            disabled={loading || !configured}
          >
            {loading
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
          >
            {mode === "signin" ? "Need an account?" : "Have an account?"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="wrap">
      <Suspense
        fallback={
          <div className="panel" style={{ maxWidth: 440, margin: "0 auto" }}>
            <p className="muted">Loading…</p>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
