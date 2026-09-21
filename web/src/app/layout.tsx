import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ConfigBanner } from "@/components/ConfigBanner";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RenoSwap — Texas leftover materials",
  description:
    "Texas-first marketplace for renovation leftovers. Swap first; sell when it helps.",
};

async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (data as Profile) || null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Nav profile={profile} />
          <ConfigBanner />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
