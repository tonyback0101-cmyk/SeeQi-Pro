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
}: TongueBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          previewLabel: "舌象 · 体质提示",
          title: "舌诊详细分析",
          disclaimer: "舌象属于朴素中医象意观察，不能等同现代医学诊断",
        }
      : {
          previewLabel: "Tongue · Constitution Hint",
          title: "Detailed Tongue Diagnosis",
          disclaimer: "Tongue inspection is symbolic and not a medical diagnosis.",
        };

  // 预览版：仅一句模糊描述，不推断体质，不输出五行结果，不允许重复渲染
  if (!isFull) {
    const previewText = notice || tongueColor || (locale === "zh"
      ? "舌象纹理模糊，暂无法判断体质类别。完整版将提供气血、火气和今日调理建议。"
      : "Tongue texture and color have blurred areas, unable to generate constitution judgment. Full version will provide qi-blood, fire-qi, and daily qi-nourishing suggestions.");
    
    if (!previewText) return null;
    
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
            <p className="text-sm text-light-primary leading-relaxed line-clamp-1">{previewText}</p>
            <p className="text-[11px] text-text-light-secondary/70 mt-3">{t.disclaimer}</p>
          </div>
        </div>
      </motion.section>
    );
  }

  // 完整版：展示体质趋势、五行趋势、补益建议，去掉按钮、去掉预览提示
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
        {/* 体质趋势 */}
        {fullContent?.bodyTrend && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
              {locale === "zh" ? "体质趋势" : "Constitution Trend"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.bodyTrend}</p>
          </div>
        )}

        {/* 五行趋势 */}
        {fullContent?.qiPattern && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
              {locale === "zh" ? "五行趋势" : "Five Elements Trend"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.qiPattern}</p>
          </div>
        )}

        {/* 气血状态（补充信息） */}
        {fullContent?.energyState && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
              {locale === "zh" ? "气血状态" : "Qi & Blood State"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-light-primary">{fullContent.energyState}</p>
          </div>
        )}

        {/* 补益建议 */}
        {(fullContent?.healthCareAdvice && fullContent.healthCareAdvice.length > 0) ||
        (fullContent?.suggestions && fullContent.suggestions.length > 0) ? (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
              {locale === "zh" ? "补益建议" : "Nourishing Suggestions"}
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
  );
}

