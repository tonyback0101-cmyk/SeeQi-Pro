import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getReportById } from "@/lib/analysis/v2/reportStore";
import { computeV2Access } from "@/lib/access/v2Access";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import V2AnalysisResultClient from "./V2AnalysisResultClient";
import { redirect } from "next/navigation";

type Locale = "zh" | "en";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ reportId?: string; success?: string; canceled?: string; intent?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === "zh";
  return {
    title: isZh ? "综合测评报告" : "Comprehensive Report",
    description: isZh
      ? "基于掌纹、舌象、体质、梦境与气运的综合分析报告"
      : "Comprehensive analysis report based on palmistry, tongue diagnosis, constitution, dreams, and qi rhythm",
  };
}

export default async function V2AnalysisResultPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = localeParam === "en" ? "en" : "zh";
  const { reportId, success, intent } = await searchParams;

  if (!reportId) {
    // 如果没有 reportId，重定向到首页或显示错误
    redirect(`/${locale}/v2/analyze`);
  }

  // Server 端获取 report 和 session
  const session = await getServerSession(authOptions).catch(() => null);
  let userId = session?.user?.id ?? null;

  if (userId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn("[V2AnalysisResultPage] Invalid user id, treating as anonymous", { userId });
      userId = null;
    }
  }

  // 获取 report（来自 report_v2）
  let report = null;
  try {
    report = await getReportById(reportId);
    if (!report) {
      redirect(`/${locale}/v2/analyze`);
    }
  } catch (error) {
    console.error("[V2AnalysisResultPage] Failed to get report:", error);
    redirect(`/${locale}/v2/analyze`);
  }

  // 如果支付成功（success=1），立即检查 Stripe session 状态并更新订单
  if (success === "1") {
    const sessionId = (await searchParams).session_id;
    if (sessionId && userId) {
      try {
        const { getStripeClient } = await import("@/lib/stripe");
        const stripe = getStripeClient();
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (checkoutSession.payment_status === "paid" || checkoutSession.status === "complete") {
          // 支付成功，立即更新订单状态（不等待 webhook）
          const supabase = getSupabaseAdminClient();
          const { data: order } = await supabase
            .from("orders")
            .select("id, status")
            .eq("stripe_checkout_session_id", sessionId)
            .maybeSingle();
          
          if (order && order.status !== "paid") {
            // 更新订单状态
            await supabase
              .from("orders")
              .update({ status: "paid", updated_at: new Date().toISOString() })
              .eq("id", order.id);
            
            // 创建 report_access 记录（如果不存在）
            await supabase
              .from("report_access")
              .upsert(
                {
                  user_id: userId,
                  report_id: reportId,
                  tier: "full",
                  created_at: new Date().toISOString(),
                },
                { onConflict: "report_id,user_id" }
              );
            
          }
        }
      } catch (error) {
        console.error("[V2AnalysisResultPage] Failed to verify payment", error);
        // 不阻止流程继续，webhook 会处理
      }
    }
  }

  // 计算 access
  const access = await computeV2Access({ userId, reportId });

  // 获取 user 信息（从 user_profiles 表读取 is_pro）
  let user: { is_pro?: boolean } | null = null;
  if (userId) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("is_pro")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data) {
        user = { is_pro: Boolean(data.is_pro) };
      }
    } catch (error) {
      console.error("[V2AnalysisResultPage] Failed to get user profile:", error);
    }
  }

  return (
    <V2AnalysisResultClient
      locale={locale}
      report={report}
      access={access}
      userId={userId}
      isLoggedIn={!!session}
      user={user}
    />
  );
}
