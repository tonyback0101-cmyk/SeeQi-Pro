import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getCurrentUserPlan } from "@/lib/server/subscription";
import { buildV2ProPage } from "@/lib/v2/routes";
import DreamReportClient from "./DreamReportClient";

type Locale = "zh" | "en";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ reportId?: string }>;
};

export default async function DreamReportPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = localeParam === "en" ? "en" : "zh";
  const { reportId } = await searchParams;

  // SSR 时检查 Pro 状态
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const proStatus = await getCurrentUserPlan(userId);

  // 如果不是 Pro，重定向到 /pro 页面
  if (!proStatus.isPro) {
    redirect(buildV2ProPage(locale, "report", { p: "dream", reportId: reportId ?? undefined }));
  }

  // 如果是 Pro，正常显示详情报告
  return <DreamReportClient locale={locale} />;
}
