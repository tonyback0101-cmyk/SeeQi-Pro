"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import { buildV2DreamReportPage, buildV2ProPage } from "@/lib/v2/routes";

interface DreamCardV2Props {
  imageSymbol?: string | null;
  mindState?: string | null;
  trend?: string | null;
  advice?: string[];
  symbolic?: string | null;
  psychological?: string | null;
  actions?: string[];
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
  isPro?: boolean;
  showUnlockHint?: boolean;
}

export default function DreamCardV2({
  imageSymbol,
  mindState,
  trend,
  advice = [],
  symbolic,
  psychological,
  actions = [],
  delay = 0.25,
  locale = "zh",
  reportId,
  notice = null,
  isPro = false,
  showUnlockHint = false,
}: DreamCardV2Props) {
  const displayImageSymbol = imageSymbol ?? symbolic;
  const displayMindState = mindState ?? psychological;
  const displayAdvice = advice.length > 0 ? advice : actions;

  const t =
    locale === "zh"
      ? {
          title: "梦境 · 内心在说什么",
          symbol: "象义提示",
          mood: "心绪风向",
          trend: "势头提醒",
          advice: "行动建议",
          viewFull: "查看完整梦境报告",
        }
      : {
          title: "Dream · What Your Inner Self Says",
          symbol: "Symbolic Message",
          mood: "Emotional Tone",
          trend: "Trend Hint",
          advice: "Action Suggestions",
          viewFull: "View Full Dream Report",
        };

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

      <div className="space-y-3">
        {displayImageSymbol ? (
          <DreamBlock label={t.symbol} text={displayImageSymbol} />
        ) : null}
        {displayMindState ? <DreamBlock label={t.mood} text={displayMindState} /> : null}
        {trend ? <DreamBlock label={t.trend} text={trend} /> : null}
      </div>

      {displayAdvice.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
            {t.advice}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
            {displayAdvice.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
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
          href={buildV2DreamReportPage(locale, reportId)}
          className="inline-flex items-center text-sm font-medium text-[var(--v2-color-green-primary)] transition-colors hover:text-[var(--v2-color-green-dark)]"
        >
          {t.viewFull} →
        </Link>
      )}
    </motion.div>
  );
}

function DreamBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{text}</p>
    </div>
  );
}

