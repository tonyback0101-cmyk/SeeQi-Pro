import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getProPlanById, getDefaultProPlan, type ProPlan } from "@/lib/billing/plans";
import { getPublicAppUrl } from "@/lib/env/urls";
import type Stripe from "stripe";

export const runtime = "nodejs";

type CheckoutRequestBody = {
  plan?: "single" | "monthly" | "yearly";
  locale?: "zh" | "en";
  reportId?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录后再尝试购买" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
    const checkoutLocale = body.locale === "en" ? "en" : "zh";
    const reportId = body.reportId;

    const stripe = getStripeClient();
    const appUrl = getPublicAppUrl();

    // 获取用户推荐信息（用于返佣）
    let referrerId: string | null = null;
    let userRefCode: string | null = null;
    try {
      const supabase = getSupabaseAdminClient();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("inviter_id, ref_code")
        .eq("user_id", session.user.id)
        .maybeSingle();
      referrerId = profile?.inviter_id ?? null;
      userRefCode = profile?.ref_code ?? null;
    } catch (error) {
      console.warn("[POST /api/v2/subscription/checkout] Failed to fetch user profile:", error);
    }

    // 选择方案
    const requestedPlan = body.plan;
    let selectedPlan: ProPlan | null = requestedPlan
      ? getProPlanById(requestedPlan)
      : getDefaultProPlan();

    if (!selectedPlan || !selectedPlan.stripePriceId) {
      return NextResponse.json(
        { error: "当前未配置可用的订阅方案" },
        { status: 503 }
      );
    }

    // 构建 Stripe Checkout Session
    const checkoutCommon: Stripe.Checkout.SessionCreateParams = {
      success_url: reportId
        ? `${appUrl}/${checkoutLocale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&success=1&session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/${checkoutLocale}/v2/analysis-result?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: reportId
        ? `${appUrl}/${checkoutLocale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&canceled=1`
        : `${appUrl}/${checkoutLocale}/v2/analysis-result?canceled=1`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        phone: session.user.phone ?? "",
        locale: checkoutLocale,
        plan: selectedPlan.id,
        productId: "seeqi-pro-v2",
        referrerId: referrerId ?? "",
        userRefCode: userRefCode ?? "",
      },
    };

    // 统一使用 Stripe Price ID（无论是订阅还是一次性支付）
    checkoutCommon.line_items = [
      {
        price: selectedPlan.stripePriceId,
        quantity: 1,
      },
    ];

    if (selectedPlan.billingType === "subscription") {
      // 订阅模式（月订阅或年订阅）
      checkoutCommon.mode = "subscription";
      checkoutCommon.automatic_tax = { enabled: true };
      checkoutCommon.allow_promotion_codes = true;
      checkoutCommon.subscription_data = {
        metadata: {
          userId: session.user.id,
          locale: checkoutLocale,
          plan: selectedPlan.id,
          productId: "seeqi-pro-v2",
          referrerId: referrerId ?? "",
          userRefCode: userRefCode ?? "",
        },
      };
    } else {
      // 一次性支付模式（单次解锁）
      checkoutCommon.mode = "payment";
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutCommon);

    // 保存订单到 Supabase（如果需要）
    try {
      const supabase = getSupabaseAdminClient();
      const orderPayload: Record<string, unknown> = {
        user_id: session.user.id,
        status: "pending",
        currency: "USD",
        amount_cents: Math.round(selectedPlan.price * 100),
        payment_provider: "stripe",
        provider_intent_id: checkoutSession.payment_intent ?? null,
        provider_session_id: checkoutSession.id,
        locale: checkoutLocale,
        plan_key: selectedPlan.id,
        price_id: selectedPlan.stripePriceId,
        product_id: "seeqi-pro-v2",
        product_type: selectedPlan.billingType,
      };

      const { data: existingOrder, error: findOrderError } = await supabase
        .from("orders")
        .select("id")
        .eq("provider_session_id", checkoutSession.id)
        .maybeSingle();

      if (findOrderError) {
        console.warn("[POST /api/v2/subscription/checkout] order-fetch", findOrderError);
      } else if (existingOrder?.id) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ ...orderPayload, updated_at: new Date().toISOString() })
          .eq("id", existingOrder.id);
        if (updateError) {
          console.warn("[POST /api/v2/subscription/checkout] order-update", updateError);
        }
      } else {
        const { error: insertError } = await supabase.from("orders").insert({
          ...orderPayload,
          created_at: new Date().toISOString(),
        });
        if (insertError) {
          console.warn("[POST /api/v2/subscription/checkout] order-insert", insertError);
        }
      }
    } catch (orderError) {
      console.warn("[POST /api/v2/subscription/checkout] order-sync", orderError);
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/v2/subscription/checkout]", error);
    const message = error instanceof Error ? error.message : "创建支付会话失败";
    const safeMessage = message.includes("STRIPE") || message.includes("Stripe")
      ? "支付配置缺失，请联系管理员"
      : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}

