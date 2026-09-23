import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { planFromPriceId, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasStripeConfig()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET missing" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(admin, stripe, session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(admin, sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook handler error";
    console.error("[stripe webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createServiceClient>,
  stripe: ReturnType<typeof getStripe>,
  session: Stripe.Checkout.Session
) {
  const kind = session.metadata?.kind;
  const userId =
    session.metadata?.supabase_user_id || session.client_reference_id || null;

  if (kind === "bump") {
    const listingId = session.metadata?.listing_id;
    if (!listingId) return;
    const { error } = await admin
      .from("listings")
      .update({ bumped_at: new Date().toISOString() })
      .eq("id", listingId);
    if (error) throw error;
    return;
  }

  // Subscription checkout
  if (session.mode !== "subscription") return;
  if (!userId) return;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  let plan = (session.metadata?.plan as PlanId | undefined) || null;
  let periodEnd: string | null = null;
  let status = "active";

  if (session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);
    status = sub.status;
    periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;
    const priceId = sub.items.data[0]?.price?.id;
    plan = plan || planFromPriceId(priceId);
    await applyPlanUpdate(admin, {
      userId,
      customerId,
      plan: plan || "homeowner",
      status,
      periodEnd,
    });
  } else if (plan) {
    await applyPlanUpdate(admin, {
      userId,
      customerId,
      plan,
      status,
      periodEnd,
    });
  }
}

async function handleSubscriptionChange(
  admin: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription
) {
  const userId =
    sub.metadata?.supabase_user_id ||
    (await findUserIdByCustomer(
      admin,
      typeof sub.customer === "string" ? sub.customer : sub.customer.id
    ));
  if (!userId) {
    console.warn("[stripe webhook] no user for subscription", sub.id);
    return;
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id;
  const planFromMeta = sub.metadata?.plan as PlanId | undefined;
  const plan = planFromMeta || planFromPriceId(priceId) || "free";
  const status = sub.status;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  const canceled =
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired";

  await applyPlanUpdate(admin, {
    userId,
    customerId,
    plan: canceled ? "free" : plan,
    status: canceled ? "canceled" : status,
    periodEnd: canceled ? null : periodEnd,
  });
}

async function findUserIdByCustomer(
  admin: ReturnType<typeof createServiceClient>,
  customerId: string
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function applyPlanUpdate(
  admin: ReturnType<typeof createServiceClient>,
  args: {
    userId: string;
    customerId?: string | null;
    plan: PlanId | string;
    status: string;
    periodEnd: string | null;
  }
) {
  const paidActive =
    (args.plan === "homeowner" || args.plan === "contractor") &&
    (args.status === "active" || args.status === "trialing");

  const patch: Record<string, unknown> = {
    plan: args.plan === "homeowner" || args.plan === "contractor" ? args.plan : "free",
    plan_status: args.status || "none",
    plan_period_end: args.periodEnd,
    subscribed: paidActive,
  };
  if (args.customerId) patch.stripe_customer_id = args.customerId;
  if (args.plan === "contractor" && paidActive) {
    patch.is_contractor = true;
    patch.role = "Contractor";
  }

  const { error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", args.userId);
  if (error) throw error;
}
