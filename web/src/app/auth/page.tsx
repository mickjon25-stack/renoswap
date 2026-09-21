"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        });
        if (err) throw err;
        setInfo(
          "Check your email to confirm (if confirmations are enabled), then sign in."
        );
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
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
    <div className="wrap">
      <div className="panel" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>
        <p className="help" style={{ marginBottom: 16 }}>
          Texas-only marketplace. Email + password for Phase 1.
        </p>
        {error ? <div className="err">{error}</div> : null}
        {info ? <div className="ok">{info}</div> : null}
        <form onSubmit={onSubmit}>
          {mode === "signup" ? (
            <div className="field">
              <label htmlFor="name">Display name</label>
              <input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
              />
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          <div className="actions">
            <button className="primary" type="submit" disabled={loading}>
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
    </div>
  );
}
