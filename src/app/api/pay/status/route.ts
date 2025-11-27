import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { grantFullReportAccess, ensureLegacyReportRow } from "@/lib/reportAccess";

export const runtime = "nodejs";

type StripeSessionMetadata = {
  reportId?: string;
  sessionId?: string;
  userId?: string;
  locale?: string;
  [key: string]: string | undefined;
};

const stripeClient = getStripeClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const reportIdParam = url.searchParams.get("report_id") ?? undefined;

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 session_id 参数" }, { status: 400 });
  }

  try {
    const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId);
    const metadata = (checkoutSession.metadata ?? {}) as StripeSessionMetadata;
    const reportId = metadata.reportId ?? reportIdParam;

    if (!reportId) {
      return NextResponse.json({ error: "无法确定报告 ID" }, { status: 400 });
    }

    const paymentStatus = checkoutSession.payment_status;
    const isPaid = paymentStatus === "paid" || checkoutSession.status === "complete";

    const supabase = getSupabaseAdminClient();

    if (isPaid) {
      let amountCents = checkoutSession.amount_total ?? checkoutSession.amount_subtotal ?? null;
      let currency = checkoutSession.currency?.toUpperCase() ?? null;
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id ?? null;

      if ((amountCents === null || currency === null) && metadata.priceId) {
        try {
          const price = await stripeClient.prices.retrieve(metadata.priceId);
          if (amountCents === null && price.unit_amount) {
            amountCents = price.unit_amount;
          }
          if (currency === null && price.currency) {
            currency = price.currency.toUpperCase();
          }
        } catch (priceError) {
          console.warn("[GET /api/pay/status] 价格信息回退失败", priceError);
        }
      }

      if (amountCents === null) {
        amountCents = 0;
      }
      if (currency === null) {
        currency = "USD";
      }

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("provider_intent_id", sessionId)
        .maybeSingle();

      const orderPayload: Record<string, unknown> = {
        user_id: metadata.userId ?? null,
        session_id: metadata.sessionId ?? null,
        report_id: reportId,
        status: "paid",
        currency,
        payment_provider: "stripe",
        provider_intent_id: sessionId,
        metadata: {
          ...(checkoutSession.metadata ?? {}),
          paymentIntentId,
        },
      };

      if (amountCents !== null) {
        orderPayload.amount_cents = amountCents;
      }

      if (existingOrder?.id) {
        await supabase.from("orders").update(orderPayload).eq("id", existingOrder.id);
      } else {
        await supabase.from("orders").insert(orderPayload);
      }

      // 更新报告解锁状态
      const legacyLocale = metadata.locale === "en" ? "en" : "zh";
      await ensureLegacyReportRow({ supabase, reportId, report: null, locale: legacyLocale }).catch((error) => {
        console.warn("[GET /api/pay/status] Failed to ensure legacy reports row", error);
      });

      if (metadata.userId) {
        const grantResult = await grantFullReportAccess({
          supabase,
          reportId,
          userId: metadata.userId,
          locale: legacyLocale,
          report: null,
        });
        if (!grantResult.ok) {
          console.warn("[GET /api/pay/status] Failed to grant user report_access", grantResult.error);
        }
      }

      // 直接标记 reports.unlocked 以保持兼容
      const { error: unlockError } = await supabase.from("reports").update({ unlocked: true }).eq("id", reportId);
      if (unlockError) {
        console.error("[GET /api/pay/status] Failed to unlock report:", unlockError);
      }

      return NextResponse.json({ unlocked: true, reportId }, { status: 200 });
    }

    return NextResponse.json(
      {
        unlocked: false,
        status: paymentStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/pay/status]", error);
    return NextResponse.json({ error: "查询支付状态失败，请稍后重试" }, { status: 500 });
  }
}

