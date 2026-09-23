import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("your-stripe") || key.includes("placeholder")) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to web/.env.local (test mode sk_test_…)."
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
  return key.startsWith("sk_") && pub.startsWith("pk_");
}

export function appBaseUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, "");
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${proto}://${host}`;
  }
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
      "Missing env STRIPE_PRICE_BUMP. Create a $5 one-time Price in Stripe Dashboard."
    );
  }
  return id;
}
