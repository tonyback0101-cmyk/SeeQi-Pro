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

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          mockUrl: `${resolveAppUrl()}/pay/mock?report=${encodeURIComponent(reportId)}&locale=${checkoutLocale}&reason=missing-stripe-key`,
        },
        { status: 200 },
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
          mockUrl: `${resolveAppUrl()}/pay/mock?report=${encodeURIComponent(
            reportId,
          )}&locale=${checkoutLocale}&reason=missing-price`,
        },
        { status: 200 },
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
        if (existingOrder?.id) {
          await supabase.from("orders").update(orderPayload).eq("id", existingOrder.id);
        } else {
          await supabase.from("orders").insert(orderPayload);
        }
      } catch (error) {
        console.warn("[POST /api/pay/checkout] order upsert failed", error);
      }
    }

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/pay/checkout]", error);
    const safeMessage =
      error instanceof Error ? error.message : "创建支付会话失败，请稍后重试";
    return NextResponse.json(
      {
        mockUrl: `${resolveAppUrl()}/pay/mock?report=${encodeURIComponent(
          new URL(request.url).searchParams.get("reportId") ?? "",
        )}&reason=error&message=${encodeURIComponent(safeMessage)}`,
        error: safeMessage,
      },
      { status: 200 },
    );
  }
}

