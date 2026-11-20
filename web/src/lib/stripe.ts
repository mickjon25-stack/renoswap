import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("your-stripe") || key.includes("placeholder")) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to web/.env.local (sk_… or restricted rk_… key)."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function hasStripeConfig(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  if (!key || !pub) return false;
  if (key.includes("your-stripe") || key.includes("placeholder")) return false;
  if (pub.includes("your-stripe") || pub.includes("placeholder")) return false;
  // Accept a standard (sk_) or restricted (rk_) secret key.
  return (key.startsWith("sk_") || key.startsWith("rk_")) && pub.startsWith("pk_");
}

/**
 * True when Stripe says the customer doesn't exist in this mode/account, e.g.
 * a test-mode cus_ id stored before switching to live keys.
 */
export function isMissingCustomerError(e: unknown): boolean {
  const err = e as { code?: string; raw?: { code?: string }; message?: string };
  const code = err?.code || err?.raw?.code;
  return (
    code === "resource_missing" ||
    /No such customer/i.test(err?.message || "")
  );
}

/**
 * Returns the stored customer id if it still exists in the current Stripe
 * mode, or null if it's missing/deleted (so the caller can create a new one).
 */
export async function existingCustomerId(
  stripe: Stripe,
  customerId: string | null | undefined
): Promise<string | null> {
  if (!customerId) return null;
  try {
    const c = await stripe.customers.retrieve(customerId);
    if ((c as { deleted?: boolean }).deleted) return null;
    return customerId;
  } catch (e) {
    if (isMissingCustomerError(e)) return null;
    throw e;
  }
}

/**
 * Absolute base URL for Stripe success/cancel/return URLs.
 * Order: NEXT_PUBLIC_APP_URL (set this for Production only, e.g.
 * https://renoswap.com) → the incoming request's host (works for Vercel
 * previews, www, and local dev) → VERCEL_URL → localhost (local dev only).
 */
export function appBaseUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, "");
  if (req) {
    const host = (
      req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
    )
      .split(",")[0]
      .trim();
    if (host) {
      const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
      const proto =
        (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim() ||
        (isLocal ? "http" : "https");
      return `${proto}://${host}`;
    }
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function priceIdForPlan(plan: "homeowner" | "contractor"): string {
  const id =
    plan === "homeowner"
      ? process.env.STRIPE_PRICE_HOMEOWNER
      : process.env.STRIPE_PRICE_CONTRACTOR;
  if (!id) {
    throw new Error(
      `Missing env STRIPE_PRICE_${plan.toUpperCase()}. Create the Price in Stripe Dashboard and set the id.`
    );
  }
  return id;
}

export function bumpPriceId(): string {
  const id = process.env.STRIPE_PRICE_BUMP;
  if (!id) {
    throw new Error(
      "Missing env STRIPE_PRICE_BUMP. Create a $1.99 one-time Price (listing boost) in Stripe Dashboard."
    );
  }
  return id;
}
