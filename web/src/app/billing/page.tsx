import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { hasStripeConfig } from "@/lib/stripe";
import {
  BUMP_PRICE_USD,
  FREE_LISTING_CAP,
  PLAN_PRICES,
  isPlanActive,
  listingCapForPlan,
} from "@/lib/billing";
import { ACTIVE_STATUSES } from "@/lib/constants";
import {
  ManageBillingButton,
  SubscribeButton,
} from "@/components/SubscribeButtons";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  checkout?: string;
  plan?: string;
}>;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <div className="wrap">
        <div className="warn">Configure Supabase to manage billing.</div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as Profile | null;
  const plan = p?.plan || "free";
  const planStatus = p?.plan_status || "none";
  const cap = listingCapForPlan(plan, planStatus);
  const paid = isPlanActive(plan, planStatus);

  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("poster_id", user.id)
    .in("status", [...ACTIVE_STATUSES]);

  const activeCount = count ?? 0;
  const stripeReady = hasStripeConfig();

  return (
    <div className="wrap">
      <div className="row" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Billing &amp; plans</h2>
        <Link href="/my-listings" className="ghost">
          My listings
        </Link>
      </div>
      <p className="help" style={{ marginBottom: 16 }}>
        RenoSwap never takes a cut of materials sales — you only pay for listing
        capacity and optional bumps. Arrange payment off-platform.
      </p>

      {sp.checkout === "success" ? (
        <div className="ok" style={{ marginBottom: 16 }}>
          Checkout complete
          {sp.plan ? ` (${sp.plan})` : ""}. If your plan doesn&apos;t update
          within a minute, refresh — the Stripe webhook writes your profile.
        </div>
      ) : null}
      {sp.checkout === "canceled" ? (
        <div className="warn" style={{ marginBottom: 16 }}>
          Checkout canceled. No charge was made.
        </div>
      ) : null}

      {!stripeReady ? (
        <div className="warn" style={{ marginBottom: 16 }}>
          Stripe keys are not configured on this server. Add{" "}
          <code>STRIPE_SECRET_KEY</code>,{" "}
          <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, price IDs, and webhook
          secret (see <code>.env.example</code>).
        </div>
      ) : null}

      <div className="panel" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Your plan</h3>
        <p style={{ margin: "0 0 8px" }}>
          <strong style={{ textTransform: "capitalize" }}>{plan}</strong>
          {paid ? (
            <span className="meta"> · {planStatus}</span>
          ) : (
            <span className="meta"> · free tier</span>
          )}
        </p>
        <p className="meta" style={{ margin: 0 }}>
          Active listings: {activeCount} / {cap}
          {p?.plan_period_end
            ? ` · Renews / ends ${new Date(p.plan_period_end).toLocaleDateString()}`
            : ""}
        </p>
        {p?.stripe_customer_id ? (
          <div style={{ marginTop: 12 }}>
            <ManageBillingButton />
          </div>
        ) : null}
      </div>

      <div className="grid" style={{ marginBottom: 18 }}>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p className="meta" style={{ marginTop: 0 }}>
            $0
          </p>
          <p>Up to {FREE_LISTING_CAP} active listings (Pending Review, Approved, or Claimed).</p>
          {!paid ? (
            <span className="status-chip status-approved">Current</span>
          ) : null}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>{PLAN_PRICES.homeowner.label}</h3>
          <p className="meta" style={{ marginTop: 0 }}>
            {PLAN_PRICES.homeowner.priceLabel}
          </p>
          <p>{PLAN_PRICES.homeowner.blurb}</p>
          {paid && plan === "homeowner" ? (
            <span className="status-chip status-approved">Current</span>
          ) : (
            <SubscribeButton
              plan="homeowner"
              label={`Subscribe · ${PLAN_PRICES.homeowner.priceLabel}`}
              disabled={!stripeReady}
            />
          )}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>{PLAN_PRICES.contractor.label}</h3>
          <p className="meta" style={{ marginTop: 0 }}>
            {PLAN_PRICES.contractor.priceLabel}
          </p>
          <p>{PLAN_PRICES.contractor.blurb}</p>
          {paid && plan === "contractor" ? (
            <span className="status-chip status-approved">Current</span>
          ) : (
            <SubscribeButton
              plan="contractor"
              label={`Subscribe · ${PLAN_PRICES.contractor.priceLabel}`}
              disabled={!stripeReady}
            />
          )}
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Listing bump</h3>
        <p>
          One-time <strong>${BUMP_PRICE_USD}</strong> per listing — boosts sort on
          Browse for 7 days. Use the bump button on{" "}
          <Link href="/my-listings">My listings</Link> or a listing you own.
        </p>
      </div>
    </div>
  );
}
