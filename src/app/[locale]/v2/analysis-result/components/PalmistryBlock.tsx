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
          wealthLine: "事业财运线",
          disclaimer: "掌纹仅为象学观察，不构成医学判断，仅作气运象意判断参考",
        }
      : {
          previewLabel: "Palmistry · Today",
          title: "Detailed Palm Analysis",
          lifeLine: "Life Line",
          wisdomLine: "Wisdom Line",
          heartLine: "Heart Line",
          wealthLine: "Career & Wealth Line",
          disclaimer: "Palmistry is a symbolic observation, not medical advice.",
        };

  // 预览版：显示四条线，每条线只展示标题和一句模糊预览
  if (!isFull) {
    const lines = [
      { title: t.lifeLine, preview: lifeLine },
      { title: t.wisdomLine, preview: wisdomLine },
      { title: t.heartLine, preview: heartLine },
      { title: t.wealthLine, preview: wealthLine },
    ].filter((line) => line.preview); // 过滤掉空值，避免显示无意义内容

    if (lines.length === 0) return null; // 如果所有线都没有预览内容，不渲染

    return (
      <motion.section
        variants={fadeUp(delay)}
        initial="hidden"
        animate="visible"
        className="report-section"
      >
        <div className="report-content">
          <div className="rounded-2xl border border-card-border-light bg-card-bg-dark/60 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-light-secondary mb-3">
              {t.previewLabel}
            </p>
            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="border-b border-card-border-light/30 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-1">
                    {line.title}
                  </p>
                  <p className="text-sm text-light-primary leading-relaxed line-clamp-1">
                    {line.preview}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-light-secondary/70 mt-4">{t.disclaimer}</p>
          </div>
        </div>
      </motion.section>
    );
  }

  // 完整版：展示四条线的完整版内容，顺序固定：生命→智慧→感情→事业财运
  // 不允许 preview + full 混合，完整版必须覆盖预览内容
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
        {/* ① 生命线 */}
        {fullData?.life && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.lifeLine}
            </p>
            <p className="text-sm leading-relaxed text-light-primary mb-2">
              {fullData.life.interpretation || fullData.life.description}
            </p>
            {fullData.life.advice && fullData.life.advice.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.life.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ② 智慧线 */}
        {fullData?.wisdom && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.wisdomLine}
            </p>
            <p className="text-sm leading-relaxed text-light-primary mb-2">
              {fullData.wisdom.interpretation || fullData.wisdom.description}
            </p>
            {fullData.wisdom.advice && fullData.wisdom.advice.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.wisdom.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ③ 感情线 */}
        {fullData?.emotion && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.heartLine}
            </p>
            <p className="text-sm leading-relaxed text-light-primary mb-2">
              {fullData.emotion.interpretation || fullData.emotion.description}
            </p>
            {fullData.emotion.advice && fullData.emotion.advice.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-light-primary">
                {fullData.emotion.advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ④ 事业财运线 */}
        {fullData?.wealth && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.wealthLine}
            </p>
            <p className="text-sm leading-relaxed text-light-primary mb-2">
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
                    {locale === "zh" ? "破财风险点" : "Risk Points"}
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
                    {locale === "zh" ? "聚财途径" : "Wealth Accumulation"}
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
        )}
      </div>
    </motion.section>
  );
}

