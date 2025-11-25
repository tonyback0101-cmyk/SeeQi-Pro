"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import { buildV2TongueReportPage, buildV2ProPage } from "@/lib/v2/routes";

interface BodyTongueCardV2Props {
  qiPattern?: string | null;
  energyState?: string | null;
  bodyTrend?: string | null;
  healthCareAdvice?: string[];
  summary?: string | null;
  suggestions?: string[];
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
  isPro?: boolean;
  showUnlockHint?: boolean;
}

export default function BodyTongueCardV2({
  qiPattern,
  energyState,
  bodyTrend,
  healthCareAdvice = [],
  summary,
  suggestions = [],
  delay = 0.15,
  locale = "zh",
  reportId,
  notice = null,
  isPro = false,
  showUnlockHint = false,
}: BodyTongueCardV2Props) {
  const t =
    locale === "zh"
      ? {
          title: "身体状态 · 今日气机",
          disclaimer: "以上为中医保健视角提示，不构成医疗建议，如有不适请咨询专业医生。",
          viewFull: "查看完整舌苔报告",
        }
      : {
          title: "Body State · Today's Qi",
          disclaimer:
            "These are TCM wellness reminders, not medical advice. Please consult professionals if discomfort persists.",
          viewFull: "View Full Tongue Report",
        };

  // 安全地处理空值，使用 fallback
  const displayQiPattern = (qiPattern ?? summary ?? "-").trim();
  const displayAdvice = healthCareAdvice.length > 0 ? healthCareAdvice : suggestions;
  const displayEnergyState = (energyState ?? "-").trim();
  const displayBodyTrend = (bodyTrend ?? "-").trim();

  const detailItems: Array<{ label: string; value: string }> = [];
  if (displayQiPattern && displayQiPattern !== "-") {
    detailItems.push({
      label: locale === "zh" ? "气机概览" : "Qi Overview",
      value: displayQiPattern,
    });
  }
  if (displayEnergyState && displayEnergyState !== "-") {
    detailItems.push({
      label: locale === "zh" ? "能量状态" : "Energy State",
      value: displayEnergyState,
    });
  }
  if (displayBodyTrend && displayBodyTrend !== "-") {
    detailItems.push({
      label: locale === "zh" ? "体感趋势" : "Body Trend",
      value: displayBodyTrend,
    });
  }

  return (
    <motion.div variants={fadeUp(delay)} className="v2-card space-y-4">
      <div className="space-y-2">
        <V2PageTitle level="card">{t.title}</V2PageTitle>
        {notice ? (
        <V2Text
          variant="note"
          className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-2 text-[var(--v2-color-text-secondary)]"
        >
          {notice}
        </V2Text>
        ) : null}
      </div>

      {detailItems.length > 0 ? (
        <div className="space-y-3">
          {detailItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {displayAdvice.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
            {locale === "zh" ? "日常建议" : "Daily Suggestions"}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
            {displayAdvice.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <V2Text variant="note" className="rounded-xl bg-slate-50 px-4 py-2">
        {t.disclaimer}
      </V2Text>

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
          href={buildV2TongueReportPage(locale, reportId)}
          className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] transition-colors hover:text-[var(--v2-color-green-dark)]"
        >
          {t.viewFull} →
        </Link>
      )}
    </motion.div>
  );
}

