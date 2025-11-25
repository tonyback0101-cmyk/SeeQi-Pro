"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface TongueBlockProps {
  // 预览模式数据
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
          title: "舌象简批",
          color: "舌色",
          coating: "舌苔",
          cracks: "裂纹",
          swelling: "肿胀度",
          redPoints: "红点/瘀点",
          moisture: "湿度",
          temperatureTrend: "辛温/寒凉趋势",
          disclaimer: "舌象属于朴素中医象意观察，不能等同现代医学诊断",
        }
      : {
          title: "Tongue Brief",
          color: "Tongue Color",
          coating: "Tongue Coating",
          cracks: "Cracks",
          swelling: "Swelling",
          redPoints: "Red/Blood Spots",
          moisture: "Moisture",
          temperatureTrend: "Warm/Cold Trend",
          disclaimer: "Tongue observation is based on traditional TCM symbolic interpretation, not equivalent to modern medical diagnosis",
        };

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
        <div className="locked-preview-body px-6 md:px-10 py-6">
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
            {tongueColor && (
              <div>
                <span className="text-light-secondary block text-xs mb-1">{t.color}</span>
                <span className="font-medium text-light-highlight">{tongueColor.replace(/^舌色：|Tongue color: /, "")}</span>
              </div>
            )}
            {tongueCoating && (
              <div>
                <span className="text-light-secondary block text-xs mb-1">{t.coating}</span>
                <span className="font-medium text-light-highlight">{tongueCoating.replace(/^舌苔：|Tongue coating: /, "")}</span>
              </div>
            )}
            {cracks && (
              <div className="col-span-2">
                <span className="text-light-secondary block text-xs mb-1">{t.cracks}</span>
                <p className="text-light-highlight">{cracks}</p>
              </div>
            )}
            {redPoints && (
              <div className="col-span-2">
                <span className="text-light-secondary block text-xs mb-1">{t.redPoints}</span>
                <p className="text-light-highlight">{redPoints}</p>
              </div>
            )}
            {moisture && (
              <div className="col-span-2">
                <span className="text-light-secondary block text-xs mb-1">{t.moisture}</span>
                <p className="text-light-highlight">{moisture}</p>
              </div>
            )}
            {temperatureTrend && (
              <div className="col-span-2">
                <span className="text-light-secondary block text-xs mb-1">{t.temperatureTrend}</span>
                <p className="text-light-highlight">{temperatureTrend}</p>
              </div>
            )}
            <div className="col-span-2 text-xs text-light-secondary pt-2 report-note text-left">
              {t.disclaimer}
            </div>
          </div>
        </div>

        {withLock && (
          <div className="locked-preview-card">
            <div className="locked-overlay-header">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC857">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              <span className="locked-overlay-title">
                {locale === "zh" ? "舌象体质调理方案" : "Tongue & Constitution Plan"}
              </span>
            </div>
            <div className="locked-overlay-body">
              {locale === "zh"
                ? "解锁饮食 / 作息 / 情绪建议，掌握对应脏腑的调理重点。"
                : "Unlock diet, rest, and mood guidance tailored to your tongue reading."}
            </div>
            <button type="button" className="locked-overlay-cta" onClick={onUnlock}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              {locale === "zh" ? "解锁舌象完整报告" : "Unlock tongue insights"}
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );

  const hasPreviewData =
    tongueColor || tongueCoating || cracks || swelling || redPoints || moisture || temperatureTrend;

  if (isFull && fullContent) {
    // 付费用户：显示预览 + 完整内容
    return (
      <>
        {hasPreviewData && renderSummarySection(false)}
        <motion.section
          variants={fadeUp(delay + 0.05)}
          initial="hidden"
          animate="visible"
          className="report-section"
        >
          <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
            <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
            {locale === "zh" ? "舌诊详细分析" : "Detailed Tongue Diagnosis"}
          </h2>
          <div className="report-content space-y-4">
            {/* 舌质详细分析 */}
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

            {/* 舌苔详细分析 */}
            {tongueCoating && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "舌苔" : "Tongue Coating"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{tongueCoating}</p>
              </div>
            )}

            {/* 经络趋势 */}
            {fullContent.qiPattern && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "经络趋势" : "Meridian Trend"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.qiPattern}</p>
              </div>
            )}

            {/* 气血状态 */}
            {fullContent.energyState && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "气血状态" : "Qi & Blood State"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.energyState}</p>
              </div>
            )}

            {/* 身体趋势（补充信息） */}
            {fullContent.bodyTrend && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "身体趋势" : "Body Trend"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.bodyTrend}</p>
              </div>
            )}

            {/* 今日小调整建议（饮食、运动、休息） */}
            {(fullContent.healthCareAdvice && fullContent.healthCareAdvice.length > 0) ||
            (fullContent.suggestions && fullContent.suggestions.length > 0) ? (
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
                  {locale === "zh" ? "今日小调整建议" : "Today's Small Adjustments"}
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
                  {fullContent.healthCareAdvice && fullContent.healthCareAdvice.length > 0
                    ? fullContent.healthCareAdvice.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
                          <span>{suggestion}</span>
                        </li>
                      ))
                    : fullContent.suggestions?.map((suggestion, index) => (
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
      </>
    );
  }

  if (isFull) {
    return hasPreviewData ? renderSummarySection(false) : null;
  }

  // 未付费用户：显示预览（已包含锁定覆盖层）
  return renderSummarySection(true);
}

