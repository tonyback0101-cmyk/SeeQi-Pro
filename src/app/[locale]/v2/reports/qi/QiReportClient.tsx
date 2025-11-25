"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { V2PageTitle, V2Text, V2PageContainer } from "@/components/v2/layout";
import { fadeUp, stagger } from "@/lib/motion";
import { buildV2ResultPage } from "@/lib/v2/routes";
import "@/styles/v2-theme.css";

type Locale = "zh" | "en";

type QiReportClientProps = {
  locale: Locale;
};

// TODO: 从原始 qi page.tsx 恢复完整内容
// 这里只提供基本框架以确保代码可以编译

export default function QiReportClient({ locale }: QiReportClientProps) {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") ?? "local";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 实现完整的报告加载逻辑
    setLoading(false);
  }, [reportId]);

  if (loading) {
    return (
      <V2PageContainer maxWidth="2xl" className="flex min-h-screen items-center justify-center">
        <V2Text>{locale === "zh" ? "正在加载气运报告…" : "Loading qi report…"}</V2Text>
      </V2PageContainer>
    );
  }

  return (
    <V2PageContainer maxWidth="2xl" className="space-y-4 md:space-y-5">
      <motion.section variants={fadeUp(0)} initial="hidden" animate="visible" className="space-y-2 text-center">
        <V2PageTitle>{locale === "zh" ? "气运完整解读" : "Full Qi Rhythm Reading"}</V2PageTitle>
        <V2Text variant="body" className="text-[var(--v2-color-text-secondary)]">
          {locale === "zh" ? "通过气运节奏，展开今日能量的深层结构。" : "Unfold the deep structure of today's energy through qi rhythm."}
        </V2Text>
      </motion.section>
      {/* TODO: 添加完整的气运报告内容 */}
      <motion.section variants={fadeUp(0.5)} initial="hidden" animate="visible" className="text-center">
        <Link href={buildV2ResultPage(locale, reportId)} className="v2-button-secondary">
          {locale === "zh" ? "返回综合报告" : "Back to Report"}
        </Link>
      </motion.section>
    </V2PageContainer>
  );
}


