import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Every production host other than renoswap.com is sent to renoswap.com.
 * Each host keeps its own sign-in cookie, so a user signed in on
 * renoswap.vercel.app or www could come back from Stripe Checkout (which
 * returns to renoswap.com) signed in as a different account.
 */
const CANONICAL_HOST = "renoswap.com";
const ALIAS_HOSTS = new Set(["www.renoswap.com", "renoswap.vercel.app"]);

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const isPage =
    request.method === "GET" || request.method === "HEAD";
  // Leave API routes alone (e.g. Stripe webhooks don't follow redirects).
  // Production deployment links (e.g. renoswap-abc123-reno-swap.vercel.app
  // from the Vercel dashboard) also keep their own sign-in, so send them to
  // renoswap.com too. Preview deployments are left alone.
  const isProdVercelUrl =
    process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app");
  if (
    (ALIAS_HOSTS.has(host) || isProdVercelUrl) &&
    isPage &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${CANONICAL_HOST}`
    );
    return NextResponse.redirect(url, 308);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
