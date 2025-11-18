import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getTemporaryReport } from "@/lib/tempReportStore";

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

function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
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
  try {
    const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
    const reportId = body.reportId;
    if (!reportId) {
      return NextResponse.json({ error: "缺少 reportId" }, { status: 400 });
    }

    const checkoutLocale = body.locale === "en" ? "en" : "zh";
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

    const priceEnv =
      process.env.STRIPE_FULL_REPORT_PRICE_ID ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE ||
      process.env.NEXT_PUBLIC_STRIPE_FULL_PRICE_ID ||
      "";
    if (priceEnv.trim().length === 0) {
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
          .from("reports")
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
      | { id: string; status: string | null; provider_intent_id: string | null; user_id: string | null }
      | null = null;
    if (supabase) {
      const { data: order, error: orderQueryError } = await supabase
        .from("orders")
        .select("id, status, provider_intent_id, user_id")
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
    }

    const appUrl = resolveAppUrl();
    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceInfo.id,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/${checkoutLocale}/analysis-result/${reportId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${checkoutLocale}/analysis-result/${reportId}`,
      customer_email: userEmail,
      metadata: {
        reportId,
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
        amount_cents: priceInfo.unit_amount,
        payment_provider: "stripe",
        provider_intent_id: checkoutSession.id,
        metadata: {
          locale: checkoutLocale,
          priceId: priceInfo.id,
        },
      };

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
          .from("reports")
          .select("id")
          .eq("id", reportId)
          .maybeSingle();
        
        if (!reportCheck) {
          console.warn("[POST /api/pay/checkout] Report does not exist for order:", reportId);
          // 不插入订单，因为 report_id 是必需的
          throw new Error("报告不存在，无法创建订单");
        }
        
        if (existingOrder?.id) {
          await supabase.from("orders").update(orderPayload).eq("id", existingOrder.id);
        } else {
          await supabase.from("orders").insert(orderPayload);
        }
      } catch (error) {
        console.error("[POST /api/pay/checkout] order upsert failed", error);
        // 不返回错误，因为支付链接已经创建，订单记录失败不影响支付流程
      }
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/pay/checkout]", error);
    const safeMessage =
      error instanceof Error ? error.message : "创建支付会话失败，请稍后重试";
    
    // 如果是 Stripe API 密钥错误，提供更明确的提示
    if (error instanceof Error && error.message.includes("Invalid API Key")) {
      return NextResponse.json(
        {
          error: checkoutLocale === "zh"
            ? "Stripe API 密钥无效，请检查 STRIPE_SECRET_KEY 环境变量配置"
            : "Invalid Stripe API key. Please check STRIPE_SECRET_KEY environment variable",
        },
        { status: 500 },
      );
    }
    
    return NextResponse.json(
      {
        error: safeMessage,
      },
      { status: 500 },
    );
  }
}

