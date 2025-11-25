"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";

type Locale = "zh" | "en";

interface QiRhythmDetailedAnalysisProps {
  report: AnalysisV2Result;
  locale: Locale;
  delay?: number;
}

/**
 * 将趋势方向转换为中文描述
 */
function getTrendText(trend: "up" | "down" | "flat" | string | undefined, locale: Locale): string {
  if (locale === "zh") {
    switch (trend) {
      case "up":
        return "升势";
      case "down":
        return "守势";
      case "flat":
        return "转势";
      default:
        return "转势";
    }
  } else {
    switch (trend) {
      case "up":
        return "Rising";
      case "down":
        return "Defensive";
      case "flat":
        return "Transitional";
      default:
        return "Transitional";
    }
  }
}

export default function QiRhythmDetailedAnalysis({ report, locale, delay = 0.5 }: QiRhythmDetailedAnalysisProps) {
  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  
  // 安全地提取数据
  const qiRhythm = reportData?.qi_rhythm ?? null;
  const advice = reportData?.advice ?? null;
  const constitution = reportData?.constitution ?? null;

  const t =
    locale === "zh"
      ? {
          title: "今日气运与修身节奏",
          overallTrend: "今日大势",
          todayYi: "今日宜",
          todayJi: "今日忌",
          protectionAdvice: "小护运建议",
          bodyAdvice: "身体调养建议",
        }
      : {
          title: "Today's Qi Rhythm & Self-Cultivation",
          overallTrend: "Overall Trend",
          todayYi: "Today's Do's",
          todayJi: "Today's Don'ts",
          protectionAdvice: "Protection Suggestion",
          bodyAdvice: "Body Care Advice",
        };

  // 提取今日大势（守势 / 升势 / 转势）
  const overallTrend = getTrendText(qiRhythm?.trend, locale);

  // 提取今日宜（最多3条）
  const calendarData = (report as any)?.normalized?.qi_rhythm?.calendar ?? 
                       qiRhythm?.calendar ?? 
                       (report as any)?.qi_rhythm?.calendar ?? 
                       null;
  const todayYi = (calendarData?.yi ?? []).slice(0, 3);
  const todayJi = (calendarData?.ji ?? []).slice(0, 3);

  // 提取小护运建议（1条可操作建议）
  const protectionAdviceList = qiRhythm?.advice ?? qiRhythm?.suggestions ?? [];
  const protectionAdvice = protectionAdviceList.length > 0 ? protectionAdviceList[0] : null;

  // 提取身体调养建议（从 advice.items / constitution 中提取 1 条落地建议）
  let bodyAdvice: string | null = null;
  
  // 优先从 advice.items 中提取与身体相关的内容
  const adviceItems = advice?.items ?? advice?.actions ?? [];
  const bodyRelatedAdvice = adviceItems.filter((item: string) => {
    const lowerItem = item.toLowerCase();
    return (
      lowerItem.includes("身体") ||
      lowerItem.includes("body") ||
      lowerItem.includes("饮食") ||
      lowerItem.includes("diet") ||
      lowerItem.includes("运动") ||
      lowerItem.includes("exercise") ||
      lowerItem.includes("休息") ||
      lowerItem.includes("rest") ||
      lowerItem.includes("睡眠") ||
      lowerItem.includes("sleep") ||
      lowerItem.includes("调养") ||
      lowerItem.includes("care")
    );
  });
  
  if (bodyRelatedAdvice.length > 0) {
    bodyAdvice = bodyRelatedAdvice[0];
  } else if (constitution?.constitution_advice && constitution.constitution_advice.length > 0) {
    // 如果没有从 advice 中找到，从 constitution.constitution_advice 中提取第一条
    bodyAdvice = constitution.constitution_advice[0];
  }

  return (
    <motion.section
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="report-section"
    >
      <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
        <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
        {t.title}
      </h2>
      <div className="report-content space-y-4">
        {/* 今日大势：守势 / 升势 / 转势 */}
        {overallTrend && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-1">{t.overallTrend}</p>
            <p className="text-lg font-semibold text-light-primary mb-2">
              {overallTrend}
            </p>
            {qiRhythm?.summary && (
              <p className="text-sm leading-relaxed text-light-secondary">
                {qiRhythm.summary}
              </p>
            )}
          </div>
        )}

        {/* 今日宜：3 条 */}
        {todayYi.length > 0 && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">{t.todayYi}</p>
            <ul className="space-y-2 text-sm leading-relaxed text-light-primary">
              {todayYi.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 今日忌：3 条 */}
        {todayJi.length > 0 && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">{t.todayJi}</p>
            <ul className="space-y-2 text-sm leading-relaxed text-accent-red">
              {todayJi.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-red" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 小护运建议：1 条可操作建议 */}
        {protectionAdvice && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-1">{t.protectionAdvice}</p>
            <p className="text-sm leading-relaxed text-light-primary">
              {protectionAdvice}
            </p>
          </div>
        )}

        {/* 身体调养建议：1 条落地建议 */}
        {bodyAdvice && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.bodyAdvice}</p>
            <p className="text-sm leading-relaxed text-light-primary">
              {bodyAdvice}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

