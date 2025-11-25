"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import LockedSection from "@/components/v2/LockedSection";

interface QiPreviewCardProps {
  overallTrend?: string | null;
  hasFullAccess: boolean;
  fullContent?: {
    index: number;
    tag: string;
    summary?: string;
    trend?: string;
    advice?: string[];
    trendDirection?: "up" | "down" | "flat";
    calendar?: {
      yi?: string[];
      ji?: string[];
    } | null;
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
}

export default function QiPreviewCard({
  overallTrend,
  hasFullAccess,
  fullContent,
  delay = 0.4,
  locale = "zh",
  reportId,
}: QiPreviewCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "今日气运节奏",
          previewTitle: "今日大势",
        }
      : {
          title: "Today's Qi Rhythm",
          previewTitle: "Overall Trend",
        };

  // 预览部分：显示今日大势一句话
  const previewContent = (
    <motion.div variants={fadeUp(delay)} initial="hidden" animate="visible" className="v2-card space-y-4">
      <V2PageTitle level="card">{t.title}</V2PageTitle>
      {overallTrend && (
        <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
            {t.previewTitle}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{overallTrend}</p>
        </div>
      )}
    </motion.div>
  );

  if (hasFullAccess && fullContent) {
    // 付费用户：显示预览 + 完整内容
    return (
      <>
        {previewContent}
        <motion.div variants={fadeUp(delay + 0.05)} initial="hidden" animate="visible" className="v2-card space-y-4">
          <V2PageTitle level="card">{locale === "zh" ? "今日气运详细分析" : "Detailed Qi Analysis"}</V2PageTitle>
          <div className="rounded-xl border border-slate-100 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {locale === "zh" ? "今日指数" : "Today's Index"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {fullContent.index ?? 0}
              <span className="ml-2 text-base font-medium text-[var(--v2-color-green-primary)]">
                {fullContent.tag ?? (locale === "zh" ? "未知" : "Unknown")}
              </span>
            </p>
          </div>
          {fullContent.calendar?.yi && fullContent.calendar.yi.length > 0 && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "今日宜" : "Today's Do's"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--v2-color-text-primary)]">
                {fullContent.calendar.yi.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fullContent.calendar?.ji && fullContent.calendar.ji.length > 0 && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "今日忌" : "Today's Don'ts"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--v2-color-text-primary)]">
                {fullContent.calendar.ji.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fullContent.advice && fullContent.advice.length > 0 && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "小护运建议" : "Protection Suggestion"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">
                {fullContent.advice[0]}
              </p>
            </div>
          )}
        </motion.div>
      </>
    );
  }

  // 未付费用户：显示预览 + 锁定部分
  return (
    <>
      {previewContent}
      <LockedSection
        locale={locale}
        title={locale === "zh" ? "今日宜、今日忌、小护运建议" : "Today's Do's, Don'ts, Protection Suggestions"}
        delay={delay + 0.05}
      />
    </>
  );
}

