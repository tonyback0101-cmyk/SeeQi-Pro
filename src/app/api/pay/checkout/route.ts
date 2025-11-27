import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getTemporaryReport } from "@/lib/tempReportStore";
import { getPublicAppUrl } from "@/lib/env/urls";

export const runtime = "nodejs";

type CheckoutRequestBody = {
  reportId?: string;
  locale?: string;
};

type PriceCache = {
  id: string;
  unit_amount: number;
  currency: string;
};

const stripeClient = getStripeClient();

let cachedPrice: PriceCache | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

async function loadPrice(): Promise<PriceCache> {
  if (cachedPrice) {
    return cachedPrice;
  }
  const priceId = requireEnv("STRIPE_FULL_REPORT_PRICE_ID");
  const price = await stripeClient.prices.retrieve(priceId);
  if (!price.unit_amount || !price.currency) {
    throw new Error("Stripe 价格缺少金额或币种配置");
  }
  cachedPrice = {
    id: price.id,
    unit_amount: price.unit_amount,
    currency: price.currency.toUpperCase(),
  };
  return cachedPrice;
}

export async function POST(request: Request) {
  // 在函数作用域中定义 checkoutLocale，以便在 catch 块中也能访问
  let checkoutLocale: "zh" | "en" = "zh";
  
  try {
    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
    const reportId = body.reportId;
    if (!reportId) {
      return NextResponse.json({ error: "缺少 reportId" }, { status: 400 });
    }

    checkoutLocale = body.locale === "en" ? "en" : "zh";
    const session = await getServerSession(authOptions).catch(() => null);
    const userId = session?.user?.id ?? null;
    const userEmail = session?.user?.email ?? undefined;

    // 检查 Stripe 配置
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: checkoutLocale === "zh" 
            ? "Stripe 支付未配置，请在环境变量中设置 STRIPE_SECRET_KEY"
            : "Stripe payment not configured. Please set STRIPE_SECRET_KEY in environment variables",
        },
        { status: 500 },
      );
    }

    // 统一使用 V2 标准环境变量
    const priceEnv = process.env.STRIPE_FULL_REPORT_PRICE_ID;
    if (!priceEnv || priceEnv.trim().length === 0) {
      console.error("[POST /api/pay/checkout] 缺少环境变量 STRIPE_FULL_REPORT_PRICE_ID，请在 .env.local 或 Vercel 环境变量中配置");
      return NextResponse.json(
        {
          error: checkoutLocale === "zh"
            ? "Stripe 价格 ID 未配置，请在环境变量中设置 STRIPE_FULL_REPORT_PRICE_ID"
            : "Stripe price ID not configured. Please set STRIPE_FULL_REPORT_PRICE_ID in environment variables",
        },
        { status: 500 },
      );
    }

    let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
    try {
      supabase = getSupabaseAdminClient();
    } catch (error) {
      console.warn("[POST /api/pay/checkout] Supabase client unavailable", error);
    }

    let report: { session_id: string | null; unlocked: boolean } | null = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("report_v2")
          .select("id, unlocked, session_id")
          .eq("id", reportId)
          .maybeSingle();
        if (error) {
          console.warn("[POST /api/pay/checkout] report query failed", error);
        } else if (data) {
          report = {
            session_id: data.session_id ?? null,
            unlocked: Boolean(data.unlocked),
          };
        }
      } catch (error) {
        console.warn("[POST /api/pay/checkout] report query threw", error);
      }
    }

    if (!report) {
      const local = getTemporaryReport(reportId);
      if (local) {
        report = {
          session_id: local.report.session_id ?? null,
          unlocked: Boolean(local.report.unlocked),
        };
      }
    }

    if (!report) {
      return NextResponse.json({ error: "报告不存在或已过期" }, { status: 404 });
    }

    if (report.unlocked) {
      return NextResponse.json({ alreadyUnlocked: true }, { status: 200 });
    }

    const priceInfo = await loadPrice();
    let existingOrder:
      | { id: string; status: string | null; stripe_checkout_session_id: string | null; user_id: string | null }
      | null = null;
    if (supabase) {
      const { data: order, error: orderQueryError } = await supabase
        .from("orders")
        .select("id, status, stripe_checkout_session_id, user_id")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderQueryError) {
        console.warn("[POST /api/pay/checkout] order query failed", orderQueryError);
      } else {
        existingOrder = order ?? null;
      }

      if (existingOrder?.status === "paid") {
        return NextResponse.json({ alreadyUnlocked: true }, { status: 200 });
      }

      // 如果存在 pending 订单且有 checkout_session_id，检查是否仍有效
      if (existingOrder?.status === "pending" && existingOrder.stripe_checkout_session_id) {
        try {
          const session = await stripeClient.checkout.sessions.retrieve(
            existingOrder.stripe_checkout_session_id
          );
          if (session.status === "complete" || session.payment_status === "paid") {
            // 支付已完成，但订单状态未更新，返回已解锁
            return NextResponse.json({ alreadyUnlocked: true }, { status: 200 });
          }
          if (session.status === "open") {
            // 支付会话仍有效，返回现有会话 URL
            if (session.url) {
              return NextResponse.json({ url: session.url }, { status: 200 });
            }
          }
        } catch (error) {
          console.warn("[POST /api/pay/checkout] Failed to retrieve existing session", error);
          // 继续创建新会话
        }
      }
    }

    const appUrl = getPublicAppUrl();
    const successUrl = `${appUrl}/${checkoutLocale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/${checkoutLocale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}&cancel=1`;
    
    console.log("checkout redirect", { success_url: successUrl, cancel_url: cancelUrl });
    
    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceInfo.id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        user_id: userId ?? "", // V2 统一格式：user_id
        mode: "single", // V2 统一格式：标记为单次报告购买
        report_id: reportId, // V2 统一格式：report_id
        reportId, // 兼容旧格式
        sessionId: report.session_id ?? "",
        orderId: existingOrder?.id ?? "",
        locale: checkoutLocale,
      },
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe 未返回支付链接");
    }

    if (supabase) {
      const orderPayload: Record<string, unknown> = {
        user_id: userId ?? existingOrder?.user_id ?? null,
        session_id: report.session_id ?? null,
        report_id: reportId,
        status: "pending",
        currency: priceInfo.currency,
        amount: priceInfo.unit_amount, // 金额（分），使用 amount 字段（与 webhook 一致）
        kind: "single", // V2 统一格式：标记为单次报告购买
        payment_provider: "stripe",
        stripe_checkout_session_id: checkoutSession.id, // V2 统一格式：使用 stripe_checkout_session_id
        stripe_payment_intent_id: null, // 支付成功后由 webhook 更新
        metadata: {
          locale: checkoutLocale,
          priceId: priceInfo.id,
        },
      };

      // 订单插入重试机制
      let orderInserted = false;
      const maxRetries = 3;
      let retryCount = 0;
      
      while (!orderInserted && retryCount < maxRetries) {
        try {
          // 如果 session_id 不为 null，验证 session 存在
          if (orderPayload.session_id) {
            const { data: sessionCheck } = await supabase
              .from("sessions")
              .select("id")
              .eq("id", orderPayload.session_id as string)
              .maybeSingle();
            
            if (!sessionCheck) {
              console.warn("[POST /api/pay/checkout] Session does not exist for order:", orderPayload.session_id);
              // 将 session_id 设为 null，避免外键约束错误
              orderPayload.session_id = null;
            }
          }
          
          // 验证 report_id 存在
          const { data: reportCheck } = await supabase
            .from("report_v2")
            .select("id")
            .eq("id", reportId)
            .maybeSingle();
          
          if (!reportCheck) {
            console.warn("[POST /api/pay/checkout] Report does not exist for order:", reportId);
            // 不插入订单，因为 report_id 是必需的
            throw new Error("报告不存在，无法创建订单");
          }
          
          if (existingOrder?.id) {
            const { error: updateError } = await supabase.from("orders").update(orderPayload).eq("id", existingOrder.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from("orders").insert(orderPayload);
            if (insertError) throw insertError;
          }
          
          orderInserted = true;
          console.log("[POST /api/pay/checkout] Order successfully saved");
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error("[POST /api/pay/checkout] order upsert failed after retries", error);
            // 最后一次重试失败，记录警告但不阻止支付流程
            // 因为支付链接已经创建，订单记录失败可以通过 webhook 补充
          } else {
            console.warn(`[POST /api/pay/checkout] order upsert failed, retrying (${retryCount}/${maxRetries})`, error);
            // 等待后重试（指数退避）
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
      }
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/pay/checkout]", error);
    
    // 检查是否是 Stripe 认证错误
    const isStripeAuthError = 
      (error as any)?.type === "StripeAuthenticationError" ||
      (error as any)?.rawType === "invalid_request_error" ||
      (error instanceof Error && (
        error.message.includes("Invalid API Key") ||
        error.message.includes("Invalid API") ||
        error.message.includes("authentication")
      ));
    
    if (isStripeAuthError) {
      const errorMessage = (error as any)?.raw?.message || (error as Error)?.message || "";
      const isPlaceholder = errorMessage.includes("sk_test_xxx") || errorMessage.includes("sk_live_xxx");
      
      return NextResponse.json(
        {
          error: checkoutLocale === "zh"
            ? isPlaceholder
              ? "Stripe API 密钥配置错误：检测到占位值 'sk_test_xxx'。请在 Vercel 环境变量中设置真实的 Stripe 密钥（从 Stripe Dashboard > Developers > API keys 获取）"
              : "Stripe API 密钥无效或已过期。请检查 Vercel 环境变量中的 STRIPE_SECRET_KEY 是否正确（从 Stripe Dashboard 获取）"
            : isPlaceholder
              ? "Stripe API key misconfigured: placeholder 'sk_test_xxx' detected. Please set a real Stripe key in Vercel environment variables (get it from Stripe Dashboard > Developers > API keys)"
              : "Stripe API key is invalid or expired. Please check STRIPE_SECRET_KEY in Vercel environment variables (get it from Stripe Dashboard)",
        },
        { status: 500 },
      );
    }
    
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

