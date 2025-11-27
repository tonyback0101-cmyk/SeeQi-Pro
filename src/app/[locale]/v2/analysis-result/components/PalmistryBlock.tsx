"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface PalmistryBlockProps {
  lifeLine?: string | null;
  wisdomLine?: string | null;
  heartLine?: string | null;
  wealthLine?: string | null;
  fullData?: {
    life?: {
      description: string;
      interpretation: string;
      advice?: string[];
    } | null;
    emotion?: {
      description: string;
      interpretation: string;
      advice?: string[];
    } | null;
    wisdom?: {
      description: string;
      interpretation: string;
      advice?: string[];
    } | null;
    wealth?: {
      level: "low" | "medium" | "high";
      pattern: string;
      risk: string[];
      potential: string[];
      summary: string;
    } | null;
  } | null;
  accessLevel: "preview" | "full";
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string;
  notice?: string | null;
  onUnlock?: () => void;
}

export default function PalmistryBlock({
  lifeLine,
  wisdomLine,
  heartLine,
  wealthLine,
  fullData,
  accessLevel,
  delay = 0.15,
  locale = "zh",
  reportId,
  notice = null,
  onUnlock = () => {},
}: PalmistryBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          previewLabel: "掌象 · 今日脉络",
          title: "掌纹详细分析",
          lifeLine: "生命线",
          wisdomLine: "智慧线",
          heartLine: "感情线",
          wealthLine: "财富线",
          wealthDetail: "财富线深度分析",
          risk: "破财风险点",
          potential: "聚财途径",
          previewCTA: "解锁完整掌象",
          disclaimer: "掌纹仅为象学观察，不构成医学判断，仅作气运象意判断参考",
        }
      : {
          previewLabel: "Palmistry · Today",
          title: "Detailed Palm Analysis",
          lifeLine: "Life Line",
          wisdomLine: "Wisdom Line",
          heartLine: "Heart Line",
          wealthLine: "Wealth Line",
          wealthDetail: "Wealth Line Deep Analysis",
          risk: "Risk Points",
          potential: "Wealth Accumulation",
          previewCTA: "Unlock full palmistry",
          disclaimer: "Palmistry is a symbolic observation, not medical advice.",
        };

  const previewSummary =
    notice ||
    wealthLine ||
    lifeLine ||
    heartLine ||
    wisdomLine ||
    (locale === "zh"
      ? "掌纹数据正在生成，请稍后再试。"
      : "Palm insights are being prepared, please check back soon.");

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

          {/* 财富线详细分析 */}
          {fullData?.wealth && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
                  {t.wealthDetail}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-light-primary">
                  {fullData.wealth.summary}
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-light-secondary">
                      {locale === "zh" ? "财源模式" : "Wealth Pattern"}: {fullData.wealth.pattern}
                    </p>
                    <p className="text-xs text-light-secondary">
                      {locale === "zh" ? "财富线强弱" : "Wealth Level"}: {fullData.wealth.level}
                    </p>
                  </div>
                  {fullData.wealth.risk.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent-red">
                        {locale === "zh" ? "风险指数" : "Risk Index"}
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-accent-red">
                        {fullData.wealth.risk.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-red" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fullData.wealth.potential.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                        {t.potential}
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-light-primary">
                        {fullData.wealth.potential.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 其它纹理解释 */}
          {fullData?.life?.advice && fullData.life.advice.length > 0 && (
            <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                {t.lifeLine} {locale === "zh" ? "建议" : "Advice"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.life.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fullData?.emotion?.advice && fullData.emotion.advice.length > 0 && (
            <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                {t.heartLine} {locale === "zh" ? "建议" : "Advice"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.emotion.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fullData?.wisdom?.advice && fullData.wisdom.advice.length > 0 && (
            <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                {locale === "zh" ? "智慧纹" : "Wisdom Line"} {locale === "zh" ? "建议" : "Advice"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.wisdom.advice.map((item, index) => (
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
    </>
  );
}

