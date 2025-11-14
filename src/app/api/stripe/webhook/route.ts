import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { distributeAffiliateCommissions, reverseCommissionsForOrder } from "@/lib/affiliate/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

const stripe = getStripeClient();
const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

async function getSupabase() {
  return getSupabaseAdminClient();
}

async function upsertOrderFromSession(session: Stripe.Checkout.Session) {
  const supabase = await getSupabase();

  if (!session.metadata?.userId) {
    throw new Error("Checkout session 缺少 userId 元数据");
  }

  if (!session.amount_total || !session.currency) {
    throw new Error("Checkout session 缺少金额或币种信息");
  }

  const purchaserId = session.metadata.userId;
  const amount = (session.amount_total ?? 0) / 100;
  const currency = session.currency.toUpperCase();
  const productId = session.metadata.productId ?? "seeqi-pro";
  const productType = session.mode === "subscription" ? "subscription" : "one_time";

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("provider_session_id", session.id)
    .maybeSingle();

  if (existingOrder?.id && existingOrder.status === "paid") {
    return existingOrder.id as string;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("inviter_id")
    .eq("user_id", purchaserId)
    .maybeSingle();

  const referrerId = session.metadata.referrerId ?? profile?.inviter_id ?? null;

  if (existingOrder?.id) {
    await supabase
      .from("orders")
      .update({
        user_id: purchaserId,
        product_id: productId,
        product_type: productType,
        payment_provider: "stripe",
        provider_customer_id: session.customer?.toString() ?? null,
        provider_subscription_id: session.subscription?.toString() ?? null,
        status: "paid",
        amount,
        currency,
        locale: session.metadata.locale ?? "en",
        referrer_user_id: referrerId,
        referrer_level: referrerId ? 1 : null,
        metadata: session.metadata,
      })
      .eq("id", existingOrder.id);

    return existingOrder.id as string;
  }

  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      user_id: purchaserId,
      product_id: productId,
      product_type: productType,
      payment_provider: "stripe",
      provider_session_id: session.id,
      provider_customer_id: session.customer?.toString() ?? null,
      provider_subscription_id: session.subscription?.toString() ?? null,
      status: "paid",
      amount,
      currency,
      locale: session.metadata.locale ?? "en",
      referrer_user_id: referrerId,
      referrer_level: referrerId ? 1 : null,
      metadata: session.metadata,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    throw new Error(error?.message ?? "订单写入失败");
  }

  return inserted.id as string;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = await upsertOrderFromSession(session);
  await distributeAffiliateCommissions(await getSupabase(), {
    orderId,
    purchaserId: session.metadata?.userId as string,
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency?.toUpperCase() ?? "USD",
    metadata: {
      checkoutSessionId: session.id,
      plan: session.metadata?.plan ?? "seeqi-pro",
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const amountPaid = invoice.amount_paid ?? invoice.amount_due ?? 0;
  if (!subscriptionId || amountPaid <= 0) {
    return;
  }

  const supabase = await getSupabase();

  const mergedMetadata: Record<string, any> = {
    ...(invoice.metadata ?? {}),
  };

  if (!mergedMetadata.userId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    Object.assign(mergedMetadata, subscription.metadata ?? {});
  }

  if (!mergedMetadata.userId) {
    console.warn("stripe-webhook:invoice-missing-user", { invoiceId: invoice.id });
    return;
  }

  const purchaserId = mergedMetadata.userId as string;
  const amount = amountPaid / 100;
  const currency = invoice.currency?.toUpperCase() ?? "USD";
  const productId = mergedMetadata.productId ?? "seeqi-pro";

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("provider_session_id", invoice.id)
    .maybeSingle();

  if (existing?.id) {
    await distributeAffiliateCommissions(supabase, {
      orderId: existing.id as string,
      purchaserId,
      amount,
      currency,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId,
      },
    });
    return;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("inviter_id")
    .eq("user_id", purchaserId)
    .maybeSingle();

  const referrerId = mergedMetadata.referrerId ?? profile?.inviter_id ?? null;

  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      user_id: purchaserId,
      product_id: productId,
      product_type: "subscription_renewal",
      payment_provider: "stripe",
      provider_session_id: invoice.id,
      provider_customer_id: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
      provider_subscription_id: subscriptionId,
      status: "paid",
      amount,
      currency,
      locale: mergedMetadata.locale ?? "en",
      referrer_user_id: referrerId,
      referrer_level: referrerId ? 1 : null,
      metadata: {
        ...mergedMetadata,
        invoiceId: invoice.id,
      },
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("stripe-webhook:invoice-insert-error", error);
    return;
  }

  await distributeAffiliateCommissions(supabase, {
    orderId: inserted.id as string,
    purchaserId,
    amount,
    currency,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId,
    },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const supabase = await getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("provider_session_id", invoice.id)
    .maybeSingle();

  if (!order?.id) {
    return;
  }

  await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
  await reverseCommissionsForOrder(supabase, { orderId: order.id as string, reason: "payment_failed" });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const supabase = await getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("provider_subscription_id", subscription.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order?.id) {
    return;
  }

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
  await reverseCommissionsForOrder(supabase, { orderId: order.id as string, reason: "subscription_cancelled" });
}

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "缺少 Stripe 签名" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("stripe-webhook:signature-error", error);
    return NextResponse.json({ error: "签名验证失败" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("stripe-webhook:handler-error", {
      type: event.type,
      error,
    });
    return NextResponse.json({ error: "处理事件失败" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
