"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import { buildV2PalmReportPage, buildV2ProPage } from "@/lib/v2/routes";

interface PalmInsightCardV2Props {
  lifeRhythm?: string | null;
  emotionPattern?: string | null;
  thoughtStyle?: string | null;
  overview?: string | null;
  advice?: string[];
  reportId?: string;
  delay?: number;
  locale?: "zh" | "en";
  notice?: string | null;
  isPro?: boolean;
  showUnlockHint?: boolean;
}

export default function PalmInsightCardV2({
  lifeRhythm,
  emotionPattern,
  thoughtStyle,
  overview,
  advice = [],
  reportId,
  delay = 0.1,
  locale = "zh",
  notice = null,
  isPro = false,
  showUnlockHint = false,
}: PalmInsightCardV2Props) {
  const t =
    locale === "zh"
      ? {
          title: "掌纹 · 此刻的你",
          viewFull: "查看完整掌纹报告",
        }
      : {
          title: "Palm · The You Right Now",
          viewFull: "View Full Palm Report",
        };

  const summarySections: Array<{ label: string; value: string }> = [];
  if (lifeRhythm?.trim()) {
    summarySections.push({
      label: locale === "zh" ? "生命线 · 精力与节奏" : "Life Line · Energy & Rhythm",
      value: lifeRhythm,
    });
  }
  if (emotionPattern?.trim()) {
    summarySections.push({
      label: locale === "zh" ? "感情线 · 情绪与关系" : "Heart Line · Emotions & Bonds",
      value: emotionPattern,
    });
  }
  if (thoughtStyle?.trim()) {
    summarySections.push({
      label: locale === "zh" ? "智慧线 · 思维与决策" : "Head Line · Mind & Decisions",
      value: thoughtStyle,
    });
  }

  return (
    <motion.div variants={fadeUp(delay)} className="v2-card space-y-4">
      <div className="space-y-2">
        <V2PageTitle level="card" as="h3">
          {t.title}
        </V2PageTitle>
        {notice ? (
        <V2Text
          variant="note"
          className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-2 text-[var(--v2-color-text-secondary)]"
        >
          {notice}
        </V2Text>
        ) : null}
      </div>

      {summarySections.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {summarySections.map((section) => (
            <div
              key={section.label}
              className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {section.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{section.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {overview ? (
        <V2Text className="rounded-xl bg-[var(--v2-color-bg-paper)] px-4 py-3 text-[var(--v2-color-text-primary)]">{overview}</V2Text>
      ) : null}

      {advice.length > 0 && (
        <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
          {advice.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

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
          href={buildV2PalmReportPage(locale, reportId)}
          className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] transition-colors hover:text-[var(--v2-color-green-dark)]"
        >
          {t.viewFull} →
        </Link>
      )}
    </motion.div>
  );
}

