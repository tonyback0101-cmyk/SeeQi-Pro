"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface TongueBlockProps {
  tongueColor?: string | null;
  tongueCoating?: string | null;
  cracks?: string | null;
  swelling?: string | null;
  redPoints?: string | null;
  moisture?: string | null;
  temperatureTrend?: string | null;
  accessLevel: "preview" | "full";
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
  onUnlock?: () => void;
}

export default function TongueBlock({
  tongueColor,
  tongueCoating,
  cracks,
  swelling,
  redPoints,
  moisture,
  temperatureTrend,
  accessLevel,
  fullContent,
  delay = 0.2,
  locale = "zh",
  reportId,
  notice = null,
  onUnlock = () => {},
}: TongueBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          previewLabel: "舌象 · 体质提示",
          title: "舌诊详细分析",
          previewCTA: "解锁舌象全貌",
          disclaimer: "舌象属于朴素中医象意观察，不能等同现代医学诊断",
        }
      : {
          previewLabel: "Tongue · Constitution Hint",
          title: "Detailed Tongue Diagnosis",
          previewCTA: "Unlock full tongue insight",
          disclaimer: "Tongue inspection is symbolic and not a medical diagnosis.",
        };

  const clean = (value?: string | null) => {
    if (!value) return null;
    return value
      .replace(/^舌色：|Tongue color:\s*/i, "")
      .replace(/^舌苔：|Tongue coating:\s*/i, "")
      .trim();
  };

  const previewSummary =
    notice ||
    clean(tongueColor ?? "") ||
    clean(tongueCoating ?? "") ||
    cracks ||
    swelling ||
    redPoints ||
    moisture ||
    temperatureTrend ||
    (locale === "zh"
      ? "舌象数据暂未生成，可稍后再试。"
      : "Tongue insight is not ready yet, please try later.");

  const renderPreviewCard = (showUnlock: boolean) => (
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
          <p className="text-[11px] text-text-light-secondary/70 mt-3">{t.disclaimer}</p>
          {showUnlock && (
            <button
              type="button"
              onClick={onUnlock}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent-gold/50 px-4 py-2 text-xs font-semibold text-accent-gold hover:bg-accent-gold/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              {t.previewCTA}
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );

  if (!isFull) {
    return renderPreviewCard(true);
  }

  return (
    <>
      {renderPreviewCard(false)}
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
            {tongueColor && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "舌质" : "Tongue Substance"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{tongueColor}</p>
                {fullContent.summary && (
                  <p className="mt-2 text-xs text-light-secondary italic">{fullContent.summary}</p>
                )}
              </div>
            )}

            {tongueCoating && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "舌苔" : "Tongue Coating"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{tongueCoating}</p>
              </div>
            )}

            {fullContent.qiPattern && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "经络趋势" : "Meridian Trend"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.qiPattern}</p>
              </div>
            )}

            {fullContent.energyState && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "气血状态" : "Qi & Blood State"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.energyState}</p>
              </div>
            )}

            {fullContent.bodyTrend && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "身体趋势" : "Body Trend"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.bodyTrend}</p>
              </div>
            )}

            {(fullContent.healthCareAdvice && fullContent.healthCareAdvice.length > 0) ||
            (fullContent.suggestions && fullContent.suggestions.length > 0) ? (
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
                  {locale === "zh" ? "今日调理要点" : "Today's Adjustments"}
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
                  {(fullContent.healthCareAdvice && fullContent.healthCareAdvice.length > 0
                    ? fullContent.healthCareAdvice
                    : fullContent.suggestions ?? []
                  ).map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </motion.section>
      )}
    </>
  );
}

