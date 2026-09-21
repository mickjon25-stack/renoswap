import { hasSupabaseConfig } from "@/lib/supabase/env";

export function ConfigBanner() {
  if (hasSupabaseConfig()) return null;
  return (
    <div className="wrap" style={{ paddingBottom: 0 }}>
      <div className="warn">
        Supabase env not configured. Set{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>{" "}
        (see <code>.env.example</code>). Pages render; auth/data need real keys.
      </div>
    </div>
  );
}
