import type { Metadata, Viewport } from "next";
import { getMyProfile } from "@/lib/supabase/my-profile";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ConfigBanner } from "@/components/ConfigBanner";
import { AuthHashHandler } from "@/components/AuthHashHandler";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RenoSwap — Texas leftover materials",
  description:
    "Texas-first marketplace for renovation leftovers. Swap first; sell when it helps.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1faab6",
};

async function getProfile(): Promise<Profile | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await getMyProfile(supabase);
    return data;
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
          <AuthHashHandler />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
