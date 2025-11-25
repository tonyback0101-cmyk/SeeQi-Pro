import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAvailableProPlans } from "@/lib/billing/plans";
import type Stripe from "stripe";
import { getPublicAppUrl } from "@/lib/env/urls";

export const runtime = "nodejs";

async function getCurrentUserFromSession(): Promise<{ userId: string | null; email: string | null }> {
  try {
    const session = await getServerSession(authOptions);
    return {
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
    };
  } catch (error) {
    console.error("[getCurrentUserFromSession]", error);
    return { userId: null, email: null };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { planId, locale = "zh", reportId } = body;

    // 获取用户信息
    const { userId, email } = await getCurrentUserFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录后再尝试购买" },
        { status: 401 }
      );
    }

    // 获取可用方案
    const plans = getAvailableProPlans();
    const plan = plans.find((p) => p.id === planId);

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

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
        .eq("user_id", userId)
        .maybeSingle();
      referrerId = profile?.inviter_id ?? null;
      userRefCode = profile?.ref_code ?? null;
    } catch (error) {
      console.warn("[POST /api/billing/create-checkout-session] Failed to fetch user profile:", error);
    }

    // 构建 Stripe Checkout Session
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: plan.billingType === "one_time" ? "payment" : "subscription",
      customer_email: email ?? undefined,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId: plan.id,
        locale,
        productId: "seeqi-pro-v2",
        referrerId: referrerId ?? "",
        userRefCode: userRefCode ?? "",
      },
      success_url: reportId
        ? `${appUrl}/${locale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&success=1`
        : `${appUrl}/${locale}/v2/analysis-result?success=1`,
      cancel_url: reportId
        ? `${appUrl}/${locale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&canceled=1`
        : `${appUrl}/${locale}/v2/analysis-result?canceled=1`,
    };

    // 如果是订阅模式，添加订阅相关配置
    if (plan.billingType === "subscription") {
      checkoutParams.automatic_tax = { enabled: true };
      checkoutParams.allow_promotion_codes = true;
      checkoutParams.subscription_data = {
        metadata: {
          userId,
          planId: plan.id,
          locale,
          productId: "seeqi-pro-v2",
          referrerId: referrerId ?? "",
          userRefCode: userRefCode ?? "",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(checkoutParams);

    // 保存订单到 Supabase
    try {
      const supabase = getSupabaseAdminClient();
      const orderPayload: Record<string, unknown> = {
        user_id: userId,
        status: "pending",
        currency: "USD",
        amount_cents: Math.round(plan.price * 100),
        payment_provider: "stripe",
        provider_intent_id: session.payment_intent ?? null,
        provider_session_id: session.id,
        locale,
        plan_key: plan.id,
        price_id: plan.stripePriceId,
        product_id: "seeqi-pro-v2",
        product_type: plan.billingType,
      };

      const { data: existingOrder, error: findOrderError } = await supabase
        .from("orders")
        .select("id")
        .eq("provider_session_id", session.id)
        .maybeSingle();

      if (findOrderError) {
        console.warn("[POST /api/billing/create-checkout-session] order-fetch", findOrderError);
      } else if (existingOrder?.id) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ ...orderPayload, updated_at: new Date().toISOString() })
          .eq("id", existingOrder.id);
        if (updateError) {
          console.warn("[POST /api/billing/create-checkout-session] order-update", updateError);
        }
      } else {
        const { error: insertError } = await supabase.from("orders").insert({
          ...orderPayload,
          created_at: new Date().toISOString(),
        });
        if (insertError) {
          console.warn("[POST /api/billing/create-checkout-session] order-insert", insertError);
        }
      }
    } catch (orderError) {
      console.warn("[POST /api/billing/create-checkout-session] order-sync", orderError);
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/billing/create-checkout-session]", error);
    const message = error instanceof Error ? error.message : "创建支付会话失败";
    const safeMessage = message.includes("STRIPE") || message.includes("Stripe")
      ? "支付配置缺失，请联系管理员"
      : message;
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}

