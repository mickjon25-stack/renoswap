"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Home used to be a server redirect to /browse. That broke password-reset (and
 * other) emails: Supabase Auth Site URL is the bare origin, so recovery links
 * land on `/#access_token=…&type=recovery`. A server 307 to /browse drops the
 * #fragment, so the session is never stored and the user just sees Browse.
 * Wait for AuthHashHandler when a hash is present; otherwise go to Browse.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("access_token=")) {
      const t = window.setTimeout(() => {
        // Fallback if AuthHashHandler didn't navigate (e.g. setSession failed).
        if ((window.location.hash || "").includes("type=recovery")) {
          router.replace("/auth/reset");
        } else if (window.location.pathname === "/") {
          router.replace("/account");
        }
      }, 2800);
      return () => window.clearTimeout(t);
    }
    router.replace("/browse");
  }, [router]);

  return (
    <div className="wrap">
      <p className="muted">Loading…</p>
    </div>
  );
}
