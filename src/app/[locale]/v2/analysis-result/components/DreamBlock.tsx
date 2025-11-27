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
  onUnlock?: () => void;
}

export default function DreamBlock({
  dreamSummary,
  accessLevel,
  fullContent,
  delay = 0.25,
  locale = "zh",
  reportId,
  notice = null,
  onUnlock = () => {},
}: DreamBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          previewLabel: "梦象 · 心意提示",
          title: "梦境深度解梦",
          previewCTA: "解锁梦境详情",
        }
      : {
          previewLabel: "Dream · Symbol Hint",
          title: "Deep Dream Interpretation",
          previewCTA: "Unlock dream details",
        };

  const previewSummary =
    notice ||
    dreamSummary ||
    (locale === "zh"
      ? "梦境数据暂未生成，可记录更完整的梦境内容后再试。"
      : "Dream insight is not ready yet. Record more details and try again.");

  const renderPreviewCard = () => (
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
          <p className="text-sm text-light-primary leading-relaxed">{previewSummary}</p>
        </div>
      </div>
    </motion.section>
  );

  if (!isFull) {
    return renderPreviewCard();
  }

  const symbolText = fullContent?.imageSymbol ?? fullContent?.symbol ?? null;
  const trendText = fullContent?.trend ?? null;
  const meaningText = fullContent?.meaning ?? null;
  const adviceList = fullContent?.advice ?? fullContent?.suggestions ?? [];

  return (
    <>
      {renderPreviewCard()}
      {fullContent && (
        <motion.section
          variants={fadeUp(delay + 0.05)}
          initial="hidden"
          animate="visible"
          className="report-section"
        >
          <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
            <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
            {t.title}
          </h2>
          <div className="report-content space-y-4">
            {symbolText && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "象义说明" : "Symbolic Meaning"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{symbolText}</p>
              </div>
            )}

            {meaningText && (
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
                  {locale === "zh" ? "吉凶预兆" : "Fortune Omen"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{meaningText}</p>
              </div>
            )}

            {trendText && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "趋势提醒" : "Trend Reminder"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{trendText}</p>
              </div>
            )}

            {adviceList.length > 0 && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "化解建议" : "Resolution Suggestions"}
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
                  {adviceList.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </>
  );
}

