"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/env";

/**
 * Home used to be a server redirect to /browse. That broke password-reset emails:
 * Supabase Site URL is the bare origin, so recovery links land on
 * `/#access_token=…&type=recovery`. A server 307 to /browse drops the #fragment.
 * When a hash (or recovery session) is present, stay put for AuthHashHandler;
 * otherwise go to Browse.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("access_token=") || hash.includes("type=recovery")) {
      const t = window.setTimeout(async () => {
        if (window.location.pathname !== "/") return;
        try {
          if (hasSupabaseConfig()) {
            const { data } = await createClient().auth.getSession();
            if (data.session) {
              router.replace("/auth/reset");
              return;
            }
          }
        } catch { /* fall through */ }
        router.replace("/auth/reset");
      }, 3200);
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
