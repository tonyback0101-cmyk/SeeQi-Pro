"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import LockedSection from "@/components/v2/LockedSection";

interface TonguePreviewCardProps {
  tongueColor?: string | null;
  tongueCoating?: string | null;
  hasFullAccess: boolean;
  fullContent?: {
    qiPattern?: string | null;
    energyState?: string | null;
    bodyTrend?: string | null;
    healthCareAdvice?: string[];
    summary?: string | null;
    suggestions?: string[];
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
}

export default function TonguePreviewCard({
  tongueColor,
  tongueCoating,
  hasFullAccess,
  fullContent,
  delay = 0.3,
  locale = "zh",
  reportId,
  notice = null,
}: TonguePreviewCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "舌象简批（预览）",
          color: "舌色",
          coating: "舌苔",
        }
      : {
          title: "Tongue Brief (Preview)",
          color: "Tongue Color",
          coating: "Tongue Coating",
        };

  // 预览部分：显示舌色、舌苔各一句话
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
        {tongueColor && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.color}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{tongueColor}</p>
          </div>
        )}
        {tongueCoating && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.coating}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{tongueCoating}</p>
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
          <V2PageTitle level="card">{locale === "zh" ? "舌诊详细分析" : "Detailed Tongue Diagnosis"}</V2PageTitle>
          {fullContent.qiPattern && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "气机概览" : "Qi Overview"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{fullContent.qiPattern}</p>
            </div>
          )}
          {fullContent.healthCareAdvice && fullContent.healthCareAdvice.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "日常建议" : "Daily Suggestions"}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
                {fullContent.healthCareAdvice.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                    <span>{suggestion}</span>
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
        title={locale === "zh" ? "对应脏腑分析、饮食起居建议、今日可做的小调整" : "Organ Analysis, Diet & Lifestyle Suggestions, Today's Small Adjustments"}
        delay={delay + 0.05}
      />
    </>
  );
}

