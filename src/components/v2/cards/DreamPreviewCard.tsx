"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";
import LockedSection from "@/components/v2/LockedSection";

interface DreamPreviewCardProps {
  dreamType?: string | null;
  dreamConclusion?: string | null;
  hasFullAccess: boolean;
  fullContent?: {
    imageSymbol?: string | null;
    mindState?: string | null;
    trend?: string | null;
    advice?: string[];
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
}

export default function DreamPreviewCard({
  dreamType,
  dreamConclusion,
  hasFullAccess,
  fullContent,
  delay = 0.35,
  locale = "zh",
  reportId,
  notice = null,
}: DreamPreviewCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "梦境简批（预览）",
          type: "梦境类型",
          conclusion: "结论",
        }
      : {
          title: "Dream Brief (Preview)",
          type: "Dream Type",
          conclusion: "Conclusion",
        };

  // 预览部分：显示梦境类型标签和一句话结论
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
        {dreamType && (
          <div className="flex flex-wrap gap-2">
            {dreamType.split(/[、，,]/).map((tag, index) => (
              <span
                key={index}
                className="rounded-full border border-[var(--v2-color-border)] bg-[var(--v2-color-surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--v2-color-text-primary)]"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        {dreamConclusion && (
          <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
              {t.conclusion}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{dreamConclusion}</p>
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
          <V2PageTitle level="card">{locale === "zh" ? "梦境详细解读" : "Detailed Dream Interpretation"}</V2PageTitle>
          {fullContent.imageSymbol && (
            <div className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "象义提示" : "Symbolic Message"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--v2-color-text-primary)]">{fullContent.imageSymbol}</p>
            </div>
          )}
          {fullContent.advice && fullContent.advice.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
                {locale === "zh" ? "行动建议" : "Action Suggestions"}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
                {fullContent.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
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
        title={locale === "zh" ? "周公原典类比、吉凶拆解、身心状态联系、化解建议" : "Classical Analogy, Fortune Analysis, Mind-Body Connection, Resolution Suggestions"}
        delay={delay + 0.05}
      />
    </>
  );
}

