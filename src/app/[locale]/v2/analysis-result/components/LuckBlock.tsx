"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import LockedSection from "@/components/v2/LockedSection";

interface LuckBlockProps {
  overallTrend?: string | null;
  accessLevel: "preview" | "full";
  fullContent?: {
    index: number;
    tag: string;
    summary?: string;
    trend?: string;
    trendText?: string; // 趋势文本（如"上午平稳，下午渐强..."）
    advice?: string[];
    suggestions?: string[]; // 兼容字段
    trendDirection?: "up" | "down" | "flat";
    calendar?: {
      solarTerm?: string;
      dayGanzhi?: string;
      yi?: string[];
      ji?: string[];
    } | null;
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
}

export default function LuckBlock({
  overallTrend,
  accessLevel,
  fullContent,
  delay = 0.3,
  locale = "zh",
  reportId,
}: LuckBlockProps) {
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

  if (accessLevel === "full" && fullContent) {
    // 付费用户：显示预览 + 完整内容（综合象气趋势 + 今日修身节奏）
    const adviceList = fullContent.advice ?? fullContent.suggestions ?? [];
    // 如果预览数据存在，先显示预览部分；否则直接显示详细部分
    const hasPreviewData = !!overallTrend;
    
    return (
      <>
        {hasPreviewData && previewContent}
        <motion.div variants={fadeUp(delay + 0.05)} initial="hidden" animate="visible" className="v2-card space-y-4">
          <V2PageTitle level="card">{locale === "zh" ? "综合象气趋势 + 今日修身节奏" : "Comprehensive Qi Trend & Daily Cultivation Rhythm"}</V2PageTitle>
          
          {/* 气运指数 */}
          <div className="rounded-xl border-2 border-[var(--v2-color-gold)]/30 bg-gradient-to-br from-[var(--v2-color-gold)]/5 to-[var(--v2-color-gold)]/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-gold)]">
              {locale === "zh" ? "今日气运指数" : "Today's Qi Index"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--v2-color-text-primary)]">
              {fullContent.index ?? 0}
              <span className="ml-2 text-base font-medium text-[var(--v2-color-gold)]">
                {fullContent.tag ?? (locale === "zh" ? "未知" : "Unknown")}
              </span>
            </p>
          </div>

          {/* 综合象气趋势 */}
          {fullContent.summary && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "综合象气趋势" : "Comprehensive Qi Trend"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">
                {fullContent.summary}
              </p>
            </div>
          )}

          {/* 趋势节奏（如"上午平稳，下午渐强..."） */}
          {fullContent.trendText && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "趋势节奏" : "Trend Rhythm"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">
                {fullContent.trendText}
              </p>
            </div>
          )}

          {/* 今日修身节奏：今日宜 */}
          {fullContent.calendar?.yi && fullContent.calendar.yi.length > 0 && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "今日宜" : "Today's Do's"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--v2-color-text-primary)]">
                {fullContent.calendar.yi.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 今日修身节奏：今日忌 */}
          {fullContent.calendar?.ji && fullContent.calendar.ji.length > 0 && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-red">
                {locale === "zh" ? "今日忌" : "Today's Don'ts"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-accent-red">
                {fullContent.calendar.ji.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 今日修身节奏：修身建议 */}
          {adviceList.length > 0 && (
            <div className="rounded-xl border-2 border-[var(--v2-color-gold)]/30 bg-gradient-to-br from-[var(--v2-color-gold)]/5 to-[var(--v2-color-gold)]/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-gold)]">
                {locale === "zh" ? "今日修身节奏" : "Today's Cultivation Rhythm"}
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">
                {adviceList.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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

