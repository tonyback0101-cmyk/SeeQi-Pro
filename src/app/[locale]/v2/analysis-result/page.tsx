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
    console.log("[V2AnalysisResultPage] Fetching report", { reportId, userId });
    report = await getReportById(reportId);
    console.log("[V2AnalysisResultPage] Report fetched", { 
      hasReport: !!report, 
      reportId: report?.id,
      hasNormalized: !!report?.normalized,
    });
    if (!report) {
      // 报告不存在，重定向或显示错误
      console.error("[V2AnalysisResultPage] Report not found", { reportId });
      redirect(`/${locale}/v2/analyze`);
    }
  } catch (error) {
    console.error("[V2AnalysisResultPage] Failed to get report:", error);
    redirect(`/${locale}/v2/analyze`);
  }

  // 计算 access
  // 登录后返回结果页的行为：
  // - 如果用户刚登录回来（intent=unlock 且已有 session），正常走 computeV2Access
  // - 如果此时用户已经是 Pro / 有订阅，access.level 会是 full，前端自然显示完整版
  // - 否则前端仍然是预览 + 底部按钮，用户可以继续点「解锁完整报告」进入支付
  // 不要在这里写"强制 isPro = true"，一切按 access 结果来
  console.log("[V2AnalysisResultPage] Computing access", { userId, reportId });
  const access = await computeV2Access({ userId, reportId });
  console.log("[V2AnalysisResultPage] Access computed", {
    level: access.level,
    isFree: access.isFree,
    hasFullAccess: access.hasFullAccess,
  });

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
