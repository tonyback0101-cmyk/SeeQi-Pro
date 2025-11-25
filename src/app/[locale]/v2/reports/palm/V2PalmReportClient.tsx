"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { V2PageTitle, V2Text, V2PageContainer } from "@/components/v2/layout";
import { buildV2ResultPage } from "@/lib/v2/routes";
import { buildV2ResultApi } from "@/lib/v2/api-routes";
import "@/styles/v2-theme.css";

type Locale = "zh" | "en";

type PalmResult = {
  color: string;
  texture: string;
  lines: {
    life?: string;
    heart?: string;
    wisdom?: string;
    wealth?: string;
  };
  qualityScore: number;
};

type V2PalmReportResponse = {
  id: string;
  created_at: string;
  palm_result: PalmResult | null;
  palm_insight?: {
    summary?: string[];
    bullets?: string[];
    life_rhythm?: string;
    emotion_pattern?: string;
    thought_style?: string;
    palm_overview_summary?: string;
    palm_advice?: string[];
  } | null;
};

type V2PalmReportClientProps = {
  locale: Locale;
};

const TEXT = {
  zh: {
    title: "掌纹完整解读",
    subtitle: "通过掌色、线条与掌丘象意，展开今日掌纹的深层结构。",
    loading: "正在加载掌纹报告…",
    failed: "抱歉，掌纹数据暂时无法加载，请稍后再试。",
    missing: "暂未检测到掌纹数据",
    back: "返回综合报告",
    overviewTitle: "掌纹特征概览",
    overviewHint: "关键标签取自掌色、掌质与图像质量，帮助你快速感知今日底气。",
  },
  en: {
    title: "Full Palm Reading",
    subtitle: "Unfold the deep structure of today's palm through color, lines, and mount symbolism.",
    loading: "Loading palm report…",
    failed: "Sorry, palm data couldn't be loaded. Please try again later.",
    missing: "No palm data detected",
    back: "Back to Report",
    overviewTitle: "Palm Features Overview",
    overviewHint: "Key tags from palm color, texture, and image quality help you quickly sense today's foundation.",
  },
} as const;

export default function V2PalmReportClient({ locale }: V2PalmReportClientProps) {
  const copy = TEXT[locale];
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") || "local";

  const [report, setReport] = useState<V2PalmReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        // 使用统一的 API 路径生成函数
        const res = await fetch(buildV2ResultApi(reportId));
        const responseData = await res.json().catch(() => null);
        
        // 统一格式处理：{ ok: true, data: { ... } } 或 { ok: false, code, message }
        if (!res.ok || !responseData || responseData.ok === false) {
          const errorMessage = responseData?.message || "Failed to fetch report";
          throw new Error(errorMessage);
        }
        
        // 成功格式：{ ok: true, data: { ... } }
        const data = responseData.ok === true && responseData.data ? responseData.data : responseData;
        setReport(data);
      } catch (err) {
        console.error("[V2PalmReport] fetch error", err);
        setError(err instanceof Error ? err.message : copy.failed);
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [reportId, copy.failed]);

  // 将 hooks 移到早期返回之前，确保每次渲染都调用
  const palmResult = report?.palm_result ?? null;
  const palmInsight = report?.palm_insight ?? null;

  // 使用新格式（summary + bullets）或旧格式（life_rhythm 等）
  const summary = palmInsight?.summary ?? (palmInsight?.palm_overview_summary ? [palmInsight.palm_overview_summary] : []);
  const bullets = palmInsight?.bullets ?? palmInsight?.palm_advice ?? [];

  const features = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (palmResult?.color) {
      items.push({
        label: locale === "zh" ? "掌色" : "Palm Color",
        value: palmResult.color,
      });
    }
    if (palmResult?.texture) {
      items.push({
        label: locale === "zh" ? "掌质" : "Texture",
        value: palmResult.texture,
      });
    }
    if (palmResult?.qualityScore) {
      items.push({
        label: locale === "zh" ? "图像质量" : "Image Quality",
        value: `${palmResult.qualityScore}%`,
      });
    }
    return items;
  }, [palmResult, locale]);

  const lines = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (palmResult?.lines?.life) {
      items.push({
        label: locale === "zh" ? "生命线" : "Life Line",
        value: palmResult.lines.life,
      });
    }
    if (palmResult?.lines?.heart) {
      items.push({
        label: locale === "zh" ? "感情线" : "Heart Line",
        value: palmResult.lines.heart,
      });
    }
    if (palmResult?.lines?.wisdom) {
      items.push({
        label: locale === "zh" ? "智慧线" : "Head Line",
        value: palmResult.lines.wisdom,
      });
    }
    if (palmResult?.lines?.wealth) {
      items.push({
        label: locale === "zh" ? "财富线" : "Wealth Line",
        value: palmResult.lines.wealth,
      });
    }
    return items;
  }, [palmResult, locale]);

  if (loading) {
    return (
      <V2PageContainer maxWidth="2xl" className="flex min-h-screen items-center justify-center">
        <V2Text>{copy.loading}</V2Text>
      </V2PageContainer>
    );
  }

  if (error || !report) {
    return (
      <V2PageContainer maxWidth="2xl" className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <V2PageTitle level="section">{error ?? copy.failed}</V2PageTitle>
        <Link href={buildV2ResultPage(locale, reportId)} className="v2-button">
          {copy.back}
        </Link>
      </V2PageContainer>
    );
  }

  if (!report.palm_result && !report.palm_insight) {
    return (
      <V2PageContainer maxWidth="2xl" className="space-y-6">
        <div className="v2-card space-y-4 text-center">
          <V2PageTitle level="section">{copy.missing}</V2PageTitle>
          <Link href={buildV2ResultPage(locale, reportId)} className="v2-button">
            {copy.back}
          </Link>
        </div>
      </V2PageContainer>
    );
  }

  return (
    <V2PageContainer maxWidth="2xl" className="space-y-6">
      <motion.section variants={fadeUp(0)} initial="hidden" animate="visible" className="space-y-2 text-center">
        <V2PageTitle>{copy.title}</V2PageTitle>
        <V2Text variant="body" className="text-[var(--v2-color-text-secondary)]">
          {copy.subtitle}
        </V2Text>
      </motion.section>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4 md:space-y-5">
        {features.length > 0 && (
          <motion.div variants={fadeUp(0.1)} className="v2-card space-y-4">
            <div className="space-y-2">
              <V2PageTitle level="card" as="h3">
                {copy.overviewTitle}
              </V2PageTitle>
              <V2Text variant="note" className="text-[var(--v2-color-text-secondary)]">
                {copy.overviewHint}
              </V2Text>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {lines.length > 0 && (
          <motion.div variants={fadeUp(0.2)} className="v2-card space-y-4">
            <V2PageTitle level="card" as="h3">
              {locale === "zh" ? "掌纹线条" : "Palm Lines"}
            </V2PageTitle>
            <div className="space-y-3">
              {lines.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {summary.length > 0 && (
          <motion.div variants={fadeUp(0.3)} className="v2-card space-y-4">
            <V2PageTitle level="card" as="h3">
              {locale === "zh" ? "掌纹解读" : "Palm Interpretation"}
            </V2PageTitle>
            <div className="space-y-3">
              {summary.map((para, idx) => (
                <V2Text key={idx} className="text-[var(--v2-color-text-primary)]">
                  {para}
                </V2Text>
              ))}
            </div>
          </motion.div>
        )}

        {bullets.length > 0 && (
          <motion.div variants={fadeUp(0.4)} className="v2-card space-y-4">
            <V2PageTitle level="card" as="h3">
              {locale === "zh" ? "建议与提醒" : "Suggestions & Reminders"}
            </V2PageTitle>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
              {bullets.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>

      <motion.section variants={fadeUp(0.5)} initial="hidden" animate="visible" className="text-center">
        <Link
          href={buildV2ResultPage(locale, reportId)}
          className="v2-button-secondary"
        >
          {copy.back}
        </Link>
      </motion.section>
    </V2PageContainer>
  );
}

