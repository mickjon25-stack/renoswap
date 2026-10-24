"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/env";

/**
 * Implicit-flow auth links land with `#access_token=…&refresh_token=…`
 * (and usually `type=recovery|signup|magiclink|invite`). The server-side
 * /auth/callback can't see the fragment. Pick tokens up here, store the
 * session, then continue:
 *   - recovery → always /auth/reset (even if Supabase fell back to Site URL /)
 *   - otherwise → `?next=` when present, else /account when on /auth*
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) return;
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const hashType = params.get("type");
    if (!access_token || !refresh_token) return;

    (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      const url = new URL(window.location.href);
      url.hash = "";
      // Drop the fragment so a refresh doesn't re-run this.
      window.history.replaceState(null, "", url.pathname + url.search);
      if (error) {
        router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
        return;
      }
      // Password-recovery must always land on the set-password page, even when
      // Supabase Auth Site URL is still the bare homepage (common after a domain cutover).
      if (hashType === "recovery") {
        router.replace("/auth/reset");
        router.refresh();
        return;
      }
      const nextRaw = url.searchParams.get("next") ?? "";
      const next =
        nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.startsWith("/\\")
          ? nextRaw
          : "/account";
      if (url.pathname === "/auth" || url.pathname === "/auth/callback" || url.pathname === "/") {
        router.replace(next);
      } else {
        router.replace(url.pathname + url.search);
      }
      router.refresh();
    })();
  }, [router]);

  return null;
}
