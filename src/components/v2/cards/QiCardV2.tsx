"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import { buildV2QiReportPage, buildV2ProPage } from "@/lib/v2/routes";

interface QiCardV2Props {
  qi: {
    index: number;
    tag: string;
    summary?: string;
    trend?: string;
    advice?: string[];
    description?: string;
    trendDirection?: "up" | "down" | "flat";
    trendText?: string | null;
    suggestions?: string[];
    components?: {
      palm?: number;
      tongue?: number;
      dream?: number;
      almanac?: number;
      constitution?: number;
    } | null;
    calendar?: {
      solarTerm?: string;
      yi?: string[];
      ji?: string[];
      lunarDate?: string;
      dayGanzhi?: string;
    } | null;
    solarTermName?: string | null;
    almanac?: {
      yi?: string[];
      ji?: string[];
      lunarTerm?: string;
    } | null;
  } | null;
  delay?: number;
  reportId?: string | null;
  locale?: "zh" | "en";
  isPro?: boolean;
  showUnlockHint?: boolean;
}

const TREND_FALLBACK: Record<
  "zh" | "en",
  Record<"up" | "down" | "flat", string>
> = {
  zh: {
    up: "节奏往上走，午后更有劲，晚上记得慢慢收心。",
    flat: "整体偏稳，按自己的节奏推进，夜间适合温柔收尾。",
    down: "今天宜慢，少冲刺，多整理，当作调息的一天。",
  },
  en: {
    up: "Energy trends upward—afternoons brighten; wind down gently tonight.",
    flat: "Rhythm stays steady. Move at your pace and wrap softly in the evening.",
    down: "Keep the pace light; organize quietly and treat today as a reset.",
  },
};

export default function QiCardV2({
  qi,
  delay = 0.4,
  reportId,
  locale = "zh",
  isPro = false,
  showUnlockHint = false,
}: QiCardV2Props) {
  // 如果 qi 为 null，使用默认值而不是返回 null
  const safeQi = qi ?? {
    index: 0,
    tag: locale === "zh" ? "未知" : "Unknown",
    trendDirection: "flat" as const,
  };

  const summary = safeQi.summary ?? safeQi.description ?? "";
  const advice = safeQi.advice ?? safeQi.suggestions ?? [];
  const trendText = safeQi.trend ?? safeQi.trendText;
  const trendCopy =
    trendText?.trim()
      ? trendText
      : safeQi.trendDirection
        ? TREND_FALLBACK[locale][safeQi.trendDirection]
        : null;

  const calendar = safeQi.calendar ?? null;
  const solarTerm = calendar?.solarTerm ?? safeQi.solarTermName ?? safeQi.almanac?.lunarTerm ?? "";
  const yiList = calendar?.yi ?? safeQi.almanac?.yi ?? [];
  const jiList = calendar?.ji ?? safeQi.almanac?.ji ?? [];

  const contributions = safeQi.components
    ? [
        { label: locale === "zh" ? "掌纹" : "Palm", value: safeQi.components.palm ?? 0 },
        { label: locale === "zh" ? "舌苔" : "Tongue", value: safeQi.components.tongue ?? 0 },
        { label: locale === "zh" ? "梦境" : "Dream", value: safeQi.components.dream ?? 0 },
        { label: locale === "zh" ? "黄历" : "Almanac", value: safeQi.components.almanac ?? 0 },
        { label: locale === "zh" ? "体质微调" : "Constitution", value: safeQi.components.constitution ?? 0 },
      ]
    : [];

  const linkLabel = locale === "zh" ? "查看完整气运解读" : "View full Qi report";

  return (
    <motion.div variants={fadeUp(delay)} className="v2-card space-y-4">
      <V2PageTitle level="card">
        {locale === "zh" ? "今日气运节奏" : "Today's Qi Rhythm"}
      </V2PageTitle>

      {(solarTerm || yiList.length > 0 || jiList.length > 0) && (
        <div className="rounded-2xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3 text-sm text-[var(--v2-color-text-primary)] space-y-1">
          {solarTerm ? (
            <p>
              {locale === "zh" ? "节气：" : "Solar Term: "}
              <span className="font-semibold">{solarTerm}</span>
            </p>
          ) : null}
          {calendar?.dayGanzhi ? (
            <p>
              {locale === "zh" ? "日柱：" : "Day Stem/Branch: "}
              {calendar.dayGanzhi}
            </p>
          ) : null}
          {yiList.length > 0 ? (
            <p>
              {locale === "zh" ? "宜：" : "Do: "}
              {yiList.slice(0, 3).join("、")}
            </p>
          ) : null}
          {jiList.length > 0 ? (
            <p>
              {locale === "zh" ? "忌：" : "Avoid: "}
              {jiList.slice(0, 3).join("、")}
            </p>
          ) : null}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-white/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {locale === "zh" ? "今日指数" : "Today's Index"}
        </p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {safeQi.index ?? 0}
          <span className="ml-2 text-base font-medium text-[var(--v2-color-green-primary)]">{safeQi.tag ?? (locale === "zh" ? "未知" : "Unknown")}</span>
        </p>
      </div>

      {summary ? <V2Text>{summary}</V2Text> : null}
      {trendCopy ? (
        <V2Text className="rounded-xl bg-[var(--v2-color-bg-paper)] px-4 py-3 text-[var(--v2-color-text-primary)]">
          {locale === "zh" ? "趋势提醒：" : "Trend Hint: "} {trendCopy}
        </V2Text>
      ) : null}

      {advice.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
            {locale === "zh" ? "今日建议" : "Daily Advice"}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
            {advice.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contributions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {locale === "zh" ? "构成占比" : "Contributions"}
          </p>
          <div className="space-y-2">
            {contributions.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--v2-color-green-primary)] transition-all"
                    style={{ width: `${Math.min(Math.abs(item.value ?? 0) * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showUnlockHint && !isPro && (
        <div className="rounded-xl border border-[var(--v2-color-border)] bg-slate-50 px-4 py-3 space-y-2">
          <p className="text-sm text-[var(--v2-color-text-secondary)]">
            {locale === "zh"
              ? "想看完整掌纹 / 舌苔 / 梦境 / 气运详情？"
              : "Want to see full palm / tongue / dream / qi details?"}
          </p>
          <p className="text-xs text-[var(--v2-color-text-secondary)]">
            {locale === "zh"
              ? "可一次解锁本账户（US$1.99），或开通月/年订阅。"
              : "Unlock this account once (US$1.99) or subscribe monthly/yearly."}
          </p>
          <Link
            href={buildV2ProPage(locale, "v2-result")}
            className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] hover:text-[var(--v2-color-green-dark)] transition-colors"
          >
            {locale === "zh" ? "解锁完整解析" : "Unlock Full Analysis"} →
          </Link>
        </div>
      )}

      {isPro && (
        <Link
          href={buildV2QiReportPage(locale, reportId)}
          className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] transition-colors hover:text-[var(--v2-color-green-dark)]"
        >
          {linkLabel} →
        </Link>
      )}
    </motion.div>
  );
}

