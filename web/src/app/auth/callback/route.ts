import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/account";
  const next = nextRaw.startsWith("/") ? nextRaw : "/account";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(`${origin}/auth?error=not_configured`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error.message)}`
    );
  }

  // Belt-and-suspenders: ensure a profiles row exists after email confirm.
  const user = data.user ?? data.session?.user;
  if (user) {
    const displayName =
      (user.user_metadata?.display_name as string | undefined) ||
      (user.email ? user.email.split("@")[0] : "user");
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: displayName,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
