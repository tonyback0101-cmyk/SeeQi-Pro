"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface DreamBlockProps {
  dreamSummary?: string | null;
  accessLevel: "preview" | "full";
  fullContent?: {
    imageSymbol?: string | null;
    symbol?: string | null;
    trend?: string | null;
    meaning?: string | null;
    advice?: string[];
    suggestions?: string[];
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
}

export default function DreamBlock({
  dreamSummary,
  accessLevel,
  fullContent,
  delay = 0.25,
  locale = "zh",
  reportId,
  notice = null,
}: DreamBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          previewLabel: "梦象 · 心意提示",
          title: "梦境深度解梦",
        }
      : {
          previewLabel: "Dream · Symbol Hint",
          title: "Deep Dream Interpretation",
        };

  // 预览版：提示"梦境解读参见详情板"，禁止展示任何解读，不出现按钮
  if (!isFull) {
    return (
      <motion.section
        variants={fadeUp(delay)}
        initial="hidden"
        animate="visible"
        className="report-section"
      >
        <div className="report-content">
          <div className="rounded-2xl border border-card-border-light bg-card-bg-dark/60 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-light-secondary mb-2">
              {t.previewLabel}
            </p>
            <p className="text-sm text-light-primary leading-relaxed">
              {locale === "zh" ? "梦境解读参见详情板" : "Dream interpretation see details panel"}
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  // 完整版：展示梦境主题、心绪趋势、补益建议
  const symbolText = fullContent?.imageSymbol ?? fullContent?.symbol ?? null;
  const trendText = fullContent?.trend ?? null;
  const adviceList = fullContent?.advice ?? fullContent?.suggestions ?? [];

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
        {/* 梦境主题 */}
        {symbolText && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
              {locale === "zh" ? "梦境主题" : "Dream Theme"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-light-primary">{symbolText}</p>
          </div>
        )}

        {/* 心绪趋势 */}
        {trendText && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
              {locale === "zh" ? "心绪趋势" : "Emotional Trend"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-light-primary">{trendText}</p>
          </div>
        )}

        {/* 补益建议 */}
        {adviceList.length > 0 && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
              {locale === "zh" ? "补益建议" : "Nourishing Suggestions"}
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
              {adviceList.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.section>
  );
}

