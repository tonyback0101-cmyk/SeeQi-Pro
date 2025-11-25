"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import LockedSection from "@/components/v2/LockedSection";

interface PalmPreviewCardProps {
  lifeLine?: string | null;
  heartLine?: string | null;
  wealthLine?: string | null;
  hasFullAccess: boolean;
  fullContent?: {
    lifeRhythm?: string | null;
    emotionPattern?: string | null;
    thoughtStyle?: string | null;
    overview?: string | null;
    advice?: string[];
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string;
  notice?: string | null;
}

export default function PalmPreviewCard({
  lifeLine,
  heartLine,
  wealthLine,
  hasFullAccess,
  fullContent,
  delay = 0.25,
  locale = "zh",
  reportId,
  notice = null,
}: PalmPreviewCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "掌纹简批（预览）",
          lifeLine: "生命纹",
          heartLine: "感情纹",
          wealthLine: "财富线",
        }
      : {
          title: "Palm Brief (Preview)",
          lifeLine: "Life Line",
          heartLine: "Heart Line",
          wealthLine: "Wealth Line",
        };

  // 预览部分：显示生命纹、感情纹、财富线各一句话
  const previewContent = (
    <motion.div variants={fadeUp(delay)} initial="hidden" animate="visible" className="v2-card space-y-4">
      <V2PageTitle level="card">{t.title}</V2PageTitle>
      {notice && (
        <V2Text
          variant="note"
          className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-2 text-[var(--v2-color-text-secondary)]"
        >
          {notice}
        </V2Text>
      )}
      <div className="space-y-3">
        {lifeLine && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.lifeLine}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{lifeLine}</p>
          </div>
        )}
        {heartLine && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.heartLine}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{heartLine}</p>
          </div>
        )}
        {wealthLine && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.wealthLine}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{wealthLine}</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (hasFullAccess && fullContent) {
    // 付费用户：显示预览 + 完整内容
    return (
      <>
        {previewContent}
        <motion.div variants={fadeUp(delay + 0.05)} initial="hidden" animate="visible" className="v2-card space-y-4">
          <V2PageTitle level="card">{locale === "zh" ? "掌纹详细分析" : "Detailed Palm Analysis"}</V2PageTitle>
          {fullContent.overview && (
            <V2Text className="rounded-xl bg-[var(--v2-color-bg-paper)] px-4 py-3 text-[var(--v2-color-text-primary)]">
              {fullContent.overview}
            </V2Text>
          )}
          {fullContent.advice && fullContent.advice.length > 0 && (
            <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
              {fullContent.advice.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
        title={locale === "zh" ? "财富线深度分析、事业纹、综合掌纹局势" : "Wealth Line Deep Analysis, Career Lines, Comprehensive Palm Analysis"}
        delay={delay + 0.05}
      />
    </>
  );
}

