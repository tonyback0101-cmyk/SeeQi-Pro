import { redirect } from "next/navigation";
import { buildV2AnalyzePage } from "@/lib/v2/routes";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function V2Page({ params }: PageProps) {
  const { locale } = await params;
  const localeTyped = locale === "en" ? "en" : "zh";
  // 重定向到 v2/analyze 页面
  redirect(buildV2AnalyzePage(localeTyped));
}

