"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface PalmistryBlockProps {
  // 预览模式数据
  lifeLine?: string | null;
  wisdomLine?: string | null;
  heartLine?: string | null;
  wealthLine?: string | null;
  // 完整模式数据
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
          title: "掌纹简批",
          fullTitle: "掌纹详细分析",
          lifeLine: "生命线",
          wisdomLine: "智慧线",
          heartLine: "感情线",
          wealthLine: "财富线",
          wealthDetail: "财富线深度分析",
          risk: "破财风险点",
          potential: "聚财途径",
          disclaimer: "掌纹仅为象学观察，不构成医学判断，仅作气运象意判断参考",
        }
      : {
          title: "Palm Brief",
          fullTitle: "Detailed Palm Analysis",
          lifeLine: "Life Line",
          wisdomLine: "Wisdom Line",
          heartLine: "Heart Line",
          wealthLine: "Wealth Line",
          wealthDetail: "Wealth Line Deep Analysis",
          risk: "Risk Points",
          potential: "Wealth Accumulation",
          disclaimer: "Palmistry is for symbolic observation only, not medical diagnosis, only for qi rhythm symbolic reference",
        };

  const hasPreviewData = lifeLine || wisdomLine || heartLine || wealthLine;

  const renderSummarySection = (withLock: boolean) => (
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
      <div className="report-content space-y-5">
        <div className="locked-preview-body px-6 md:px-10 py-6 space-y-4">
          {notice && (
            <p className="text-sm text-light-secondary">{notice}</p>
          )}
          {lifeLine && (
            <div>
              <h3 className="font-bold text-sm mb-1 text-light-highlight">{t.lifeLine}</h3>
              <p className="text-sm text-light-secondary text-justify">{lifeLine}</p>
            </div>
          )}
          {wisdomLine && (
            <div>
              <h3 className="font-bold text-sm mb-1 text-light-highlight">{t.wisdomLine}</h3>
              <p className="text-sm text-light-secondary text-justify">{wisdomLine}</p>
            </div>
          )}
          {heartLine && (
            <div>
              <h3 className="font-bold text-sm mb-1 text-light-highlight">{t.heartLine}</h3>
              <p className="text-sm text-light-secondary text-justify">{heartLine}</p>
            </div>
          )}
          {wealthLine && (
            <div>
              <h3 className="font-bold text-sm mb-1 text-light-highlight">{t.wealthLine}</h3>
              <p className="text-sm text-light-secondary text-justify">{wealthLine}</p>
            </div>
          )}
          <div className="text-xs text-light-secondary bg-mystic-secondary/80 p-2 rounded border border-card-border-light report-note text-left">
            {t.disclaimer}
          </div>
        </div>

        {withLock && (
          <div className="locked-preview-card">
            <div className="locked-overlay-header">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC857">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              <span className="locked-overlay-title">
                {locale === "zh" ? "掌纹深度解读 · 财富线局势" : "Palmistry Deep Insight"}
              </span>
            </div>
            <div className="locked-overlay-body">
              {locale === "zh"
                ? "查看完整财富线、事业纹与综合掌纹局势，解锁专属建议。"
                : "See full wealth & career lines with tailored palmistry guidance."}
            </div>
            <button type="button" className="locked-overlay-cta" onClick={onUnlock}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              {locale === "zh" ? "解锁完整掌纹报告" : "Unlock full palm report"}
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );

  // 预览模式：显示四条线（生命线、智慧线、感情线、财富线）
  if (!isFull) {
    return renderSummarySection(true);
  }

  // 完整模式：展开全部：财富线详细说明 + 其它纹理解释
  // 如果预览数据存在，先显示预览部分；否则直接显示详细部分
  return (
    <>
      {/* 预览部分（仅在预览数据存在时显示） */}
      {hasPreviewData && (
        renderSummarySection(false)
      )}

      {/* 详细分析部分 */}
      <motion.section
        variants={fadeUp(delay + 0.05)}
        initial="hidden"
        animate="visible"
        className="report-section"
      >
        <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
          <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
          {t.fullTitle}
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
          {fullData?.life && fullData.life.advice && fullData.life.advice.length > 0 && (
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

          {fullData?.emotion && fullData.emotion.advice && fullData.emotion.advice.length > 0 && (
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

          {fullData?.wisdom && fullData.wisdom.advice && fullData.wisdom.advice.length > 0 && (
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

