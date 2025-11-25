/**
 * LockedSection 组件
 * 用于显示加锁内容的遮罩
 */

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

type Locale = "zh" | "en";

type LockedSectionProps = {
  locale: Locale;
  title: string;
  delay?: number;
};

const TEXT = {
  zh: {
    locked: "此内容已锁定",
    unlockHint: "解锁完整报告以查看详细内容",
  },
  en: {
    locked: "This content is locked",
    unlockHint: "Unlock full report to view details",
  },
} as const;

export default function LockedSection({ locale, title, delay = 0 }: LockedSectionProps) {
  const t = TEXT[locale];

  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="relative rounded-lg border-2 border-dashed border-[var(--v2-color-border)] bg-[var(--v2-color-surface-secondary)] p-8 text-center"
    >
      <div className="mb-4 text-4xl">🔒</div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--v2-color-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--v2-color-text-secondary)]">{t.locked}</p>
      <p className="mt-2 text-xs text-[var(--v2-color-text-tertiary)]">{t.unlockHint}</p>
    </motion.div>
  );
}

