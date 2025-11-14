import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAvailableProPlans, getDefaultProPlan, type ProPlanInfo, type ProPlanKey } from "@/lib/proPlans";
import type Stripe from "stripe";

export const runtime = "nodejs";

function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录后再尝试购买" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const checkoutLocale = body?.locale === "zh" ? "zh" : "en";

    const stripe = getStripeClient();
    const appUrl = resolveAppUrl();

    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("inviter_id, ref_code")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const referrerId = profile?.inviter_id ?? null;

    const plans = await getAvailableProPlans();
    const requestedPlan = (body?.plan as ProPlanKey | undefined) ?? undefined;

    let selectedPlan: ProPlanInfo | null = null;
    if (requestedPlan) {
      selectedPlan = plans.find((plan) => plan.key === requestedPlan) ?? null;
    }

    if (!selectedPlan) {
      selectedPlan = getDefaultProPlan(plans);
    }

    if (!selectedPlan) {
      return NextResponse.json({ error: "当前未配置可用的订阅方案" }, { status: 503 });
    }

    const checkoutCommon: Stripe.Checkout.SessionCreateParams = {
      success_url: `${appUrl}/${checkoutLocale}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${checkoutLocale}/billing/cancel`,
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        phone: session.user.phone ?? "",
        locale: checkoutLocale,
        plan: selectedPlan.key,
        productId: "seeqi-pro",
        referrerId: referrerId ?? "",
        userRefCode: profile?.ref_code ?? "",
      },
    };

    if (selectedPlan.type === "recurring") {
      checkoutCommon.mode = "subscription";
      checkoutCommon.automatic_tax = { enabled: true };
      checkoutCommon.allow_promotion_codes = true;
      checkoutCommon.subscription_data = {
        metadata: {
          userId: session.user.id,
          locale: checkoutLocale,
          plan: selectedPlan.key,
          productId: "seeqi-pro",
          referrerId: referrerId ?? "",
          userRefCode: profile?.ref_code ?? "",
        },
      };
    } else {
      checkoutCommon.mode = "payment";
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutCommon);

    if (supabase) {
      try {
        const orderPayload: Record<string, unknown> = {
          user_id: session.user.id,
          status: "pending",
          currency: selectedPlan.currency,
          amount_cents: selectedPlan.amount,
          payment_provider: "stripe",
          provider_intent_id: checkoutSession.payment_intent ?? null,
          provider_session_id: checkoutSession.id,
          locale: checkoutLocale,
          plan_key: selectedPlan.key,
          price_id: selectedPlan.priceId,
        };

        const { data: existingOrder, error: findOrderError } = await supabase
          .from("orders")
          .select("id")
          .eq("provider_session_id", checkoutSession.id)
          .maybeSingle();

        if (findOrderError) {
          console.warn("create-checkout-session:order-fetch", findOrderError);
        } else if (existingOrder?.id) {
          const { error: updateError } = await supabase
            .from("orders")
            .update({ ...orderPayload, updated_at: new Date().toISOString() })
            .eq("id", existingOrder.id);
          if (updateError) {
            console.warn("create-checkout-session:order-update", updateError);
          }
        } else {
          const { error: insertError } = await supabase.from("orders").insert({
            ...orderPayload,
            created_at: new Date().toISOString(),
          });
          if (insertError) {
            console.warn("create-checkout-session:order-insert", insertError);
          }
        }
      } catch (orderError) {
        console.warn("create-checkout-session:order-sync", orderError);
      }
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("create-checkout-session:error", error);
    const message = error instanceof Error ? error.message : "创建支付会话失败";
    const safeMessage = message.includes("STRIPE") || message.includes("Stripe") ? "支付配置缺失，请联系管理员" : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
