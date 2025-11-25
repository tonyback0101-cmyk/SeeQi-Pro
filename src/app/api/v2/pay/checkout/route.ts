import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { validateStripePriceEnvVars } from "@/lib/env/stripePrices";
import { getPublicAppUrl } from "@/lib/env/urls";

export const runtime = "nodejs";

// 在模块加载时验证环境变量
validateStripePriceEnvVars();

type CheckoutRequestBody = {
  mode: "single" | "sub_month" | "sub_year";
  reportId?: string; // 仅 single 模式需要
  locale?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    console.error(`[POST /api/v2/pay/checkout] 缺少环境变量 ${name}，请在 .env.local 或 Vercel 环境变量中配置`);
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value.trim();
}

export async function POST(request: Request) {
  let checkoutLocale: "zh" | "en" = "zh";
  
  try {
    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
    const { mode, reportId, locale } = body;
    
    checkoutLocale = locale === "en" ? "en" : "zh";
    
    // 验证 mode
    if (!mode || !["single", "sub_month", "sub_year"].includes(mode)) {
      return NextResponse.json(
        { error: checkoutLocale === "zh" ? "缺少或无效的 mode 参数" : "Missing or invalid mode parameter" },
        { status: 400 }
      );
    }

    // single 模式必须提供 reportId
    if (mode === "single" && !reportId) {
      return NextResponse.json(
        { error: checkoutLocale === "zh" ? "single 模式必须提供 reportId" : "reportId is required for single mode" },
        { status: 400 }
      );
    }

    // 订阅模式也建议提供 reportId（用于返回页面），但不强制
    // 如果没有 reportId，使用默认返回 URL
    
    // 检查登录状态
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: checkoutLocale === "zh" ? "请先登录" : "Please sign in first" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email ?? undefined;

    // 检查 Stripe 配置
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: checkoutLocale === "zh" 
            ? "Stripe 支付未配置" : "Stripe payment not configured",
        },
        { status: 500 },
      );
    }

    // 根据 mode 选择 Price ID
    const priceId =
      mode === "single"
        ? requireEnv("STRIPE_FULL_REPORT_PRICE_ID")
        : mode === "sub_month"
        ? requireEnv("STRIPE_PRICE_SUB_MONTH_USD")
        : requireEnv("STRIPE_PRICE_SUB_YEAR_USD");

    // 确定 Stripe mode 和 planId
    const stripeMode: "payment" | "subscription" = mode === "single" ? "payment" : "subscription";
    const planId: "single" | "monthly" | "yearly" = 
      mode === "single" ? "single" 
      : mode === "sub_month" ? "monthly" 
      : "yearly";

    // 生成/复用 stripe_customer_id（写回 user_profiles）
    const stripeClient = getStripeClient();
    const supabase = getSupabaseAdminClient();
    
    let stripeCustomerId: string | null = null;
    try {
      // 从 user_profiles 查询现有的 stripe_customer_id
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        // 复用现有的 customer_id
        stripeCustomerId = profile.stripe_customer_id;
        
        // 验证 customer 是否仍然存在于 Stripe
        try {
          await stripeClient.customers.retrieve(stripeCustomerId);
        } catch (error) {
          // 如果 customer 不存在，创建新的
          console.warn(`[POST /api/v2/pay/checkout] Stripe customer ${stripeCustomerId} not found, creating new one`);
          stripeCustomerId = null;
        }
      }

      // 如果没有有效的 customer_id，创建新的
      if (!stripeCustomerId) {
        const customer = await stripeClient.customers.create({
          email: userEmail,
          metadata: {
            userId,
          },
        });
        stripeCustomerId = customer.id;

        // 写回 user_profiles
        await supabase
          .from("user_profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("user_id", userId);
        
        console.log(`[POST /api/v2/pay/checkout] Created new Stripe customer: ${stripeCustomerId} for user: ${userId}`);
      }
    } catch (error) {
      console.error("[POST /api/v2/pay/checkout] Failed to get/create Stripe customer:", error);
      // 如果创建 customer 失败，继续使用 customer_email（降级处理）
    }

    const appUrl = getPublicAppUrl();
    
    // 统一回到当前 report 页（如果有 reportId）
    // 支付成功后的回跳地址必须统一：/${locale}/v2/analysis-result?reportId=<id>&success=1
    const baseResultUrl = reportId
      ? `${appUrl}/${checkoutLocale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}`
      : `${appUrl}/${checkoutLocale}/v2/analysis-result`;

    // 创建 Stripe Checkout Session
    // 统一写 metadata（简化格式）
    const checkoutSessionParams: any = {
      mode: stripeMode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseResultUrl}&success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: reportId ? `${baseResultUrl}&canceled=1` : `${baseResultUrl}?canceled=1`,
      metadata: {
        user_id: userId,
        mode, // 'single' | 'sub_month' | 'sub_year'
        report_id: mode === "single" ? reportId : null, // 仅 single 模式设置
      },
    };

    // 如果有 stripe_customer_id，使用 customer；否则使用 customer_email
    if (stripeCustomerId) {
      checkoutSessionParams.customer = stripeCustomerId;
    } else {
      checkoutSessionParams.customer_email = userEmail;
    }

    // 创建 Stripe Checkout Session
    const checkoutSession = await stripeClient.checkout.sessions.create(checkoutSessionParams);

    if (!checkoutSession.id) {
      throw new Error("Stripe 未返回 checkout session ID");
    }

    // 在 Supabase orders 写一条 status='pending' 的订单（便于 Webhook 对账）
    try {
      // 获取价格信息以计算金额（分）
      let amountCents = 0;
      try {
        const price = await stripeClient.prices.retrieve(priceId);
        amountCents = price.unit_amount ?? 0;
      } catch (error) {
        console.warn("[POST /api/v2/pay/checkout] Failed to retrieve price, using 0:", error);
      }

      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          stripe_checkout_session_id: checkoutSession.id,
          stripe_payment_intent_id: null, // 支付成功后由 Webhook 更新
          amount: amountCents, // 金额（分）
          currency: "usd",
          kind: mode === "single" ? "single" : mode === "sub_month" ? "sub_month" : "sub_year",
          report_id: mode === "single" ? reportId : null,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (orderError) {
        console.error("[POST /api/v2/pay/checkout] Failed to create pending order:", orderError);
        // 不阻止流程继续，订单创建失败不影响支付
      } else {
        console.log(`[POST /api/v2/pay/checkout] Created pending order for session: ${checkoutSession.id}`);
      }
    } catch (error) {
      console.error("[POST /api/v2/pay/checkout] Error creating pending order:", error);
      // 不阻止流程继续，订单创建失败不影响支付
    }

    if (!checkoutSession.url) {
      throw new Error("Stripe 未返回支付链接");
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/v2/pay/checkout]", error);
    
    const safeMessage =
      error instanceof Error ? error.message : "创建支付会话失败，请稍后重试";
    
    return NextResponse.json(
      {
        error: safeMessage,
      },
      { status: 500 },
    );
  }
}

