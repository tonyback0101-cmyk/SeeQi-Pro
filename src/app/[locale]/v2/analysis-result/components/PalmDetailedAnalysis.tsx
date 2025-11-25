"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";

type Locale = "zh" | "en";

interface PalmDetailedAnalysisProps {
  report: AnalysisV2Result;
  locale: Locale;
  delay?: number;
}

export default function PalmDetailedAnalysis({ report, locale, delay = 0.35 }: PalmDetailedAnalysisProps) {
  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  
  // 提取掌纹结果（V2 结构：包含 wealth 字段）
  const palmResultV2 = (reportData as any)?.palm_result as any; // PalmResultV2 类型
  const palmInsight = reportData?.palm_insight ?? null;
  
  // 提取财富线数据（优先从 palm_result.wealth，其次从 palm_insight.wealth）
  const wealthData = palmResultV2?.wealth ?? (palmInsight as any)?.wealth ?? null;

  const t =
    locale === "zh"
      ? {
          title: "掌纹详细解析",
          lifeLine: "生命线",
          wisdomLine: "智慧线",
          heartLine: "感情线",
          wealthLine: "财富线",
          wealthLevel: "财富线强弱",
          wealthPath: "聚财路径",
          wealthRisk: "潜在破财点",
          wealthSummary: "国学式总结",
          disclaimer: "掌纹仅为象学观察，不构成医学判断，仅作气运象意判断参考",
        }
      : {
          title: "Detailed Palm Analysis",
          lifeLine: "Life Line",
          wisdomLine: "Wisdom Line",
          heartLine: "Heart Line",
          wealthLine: "Wealth Line",
          wealthLevel: "Wealth Level",
          wealthPath: "Wealth Accumulation Path",
          wealthRisk: "Potential Wealth Loss Points",
          wealthSummary: "Traditional Summary",
          disclaimer: "Palmistry is for symbolic observation only, not medical diagnosis, only for qi rhythm symbolic reference",
        };

  // 财富线强弱文本映射
  const getWealthLevelText = (level: "low" | "medium" | "high" | undefined): string => {
    if (locale === "zh") {
      switch (level) {
        case "low":
          return "偏弱";
        case "medium":
          return "中等";
        case "high":
          return "较旺";
        default:
          return "中等";
      }
    } else {
      switch (level) {
        case "low":
          return "Weak";
        case "medium":
          return "Medium";
        case "high":
          return "Strong";
        default:
          return "Medium";
      }
    }
  };

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
        {/* 生命线：走势、粗细、断续 */}
        {palmResultV2?.life && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.lifeLine}</h3>
            <p className="text-sm leading-relaxed text-light-primary">
              {palmResultV2.life.description && (
                <span className="text-light-secondary">{palmResultV2.life.description}</span>
              )}
              {palmResultV2.life.description && palmResultV2.life.interpretation && " "}
              {palmResultV2.life.interpretation}
            </p>
          </div>
        )}

        {/* 智慧线：思维方式、专注度 */}
        {palmResultV2?.wisdom && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.wisdomLine}</h3>
            <p className="text-sm leading-relaxed text-light-primary">
              {palmResultV2.wisdom.description && (
                <span className="text-light-secondary">{palmResultV2.wisdom.description}</span>
              )}
              {palmResultV2.wisdom.description && palmResultV2.wisdom.interpretation && " "}
              {palmResultV2.wisdom.interpretation}
            </p>
          </div>
        )}

        {/* 感情线：情感表达方式 */}
        {palmResultV2?.emotion && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.heartLine}</h3>
            <p className="text-sm leading-relaxed text-light-primary">
              {palmResultV2.emotion.description && (
                <span className="text-light-secondary">{palmResultV2.emotion.description}</span>
              )}
              {palmResultV2.emotion.description && palmResultV2.emotion.interpretation && " "}
              {palmResultV2.emotion.interpretation}
            </p>
          </div>
        )}

        {/* 财富线（重点） */}
        {wealthData && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.wealthLine}
            </p>
            <p className="text-sm leading-relaxed text-light-primary mb-3">
              {wealthData.summary}
            </p>

            {/* 财富线强弱 */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-light-secondary mb-1">
                {t.wealthLevel}: {getWealthLevelText(wealthData.level)}
              </p>
            </div>

            {/* 聚财路径 */}
            {wealthData.potential && wealthData.potential.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">
                  {t.wealthPath}
                </p>
                <ul className="space-y-1 text-sm text-light-primary">
                  {wealthData.potential.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 潜在破财点 */}
            {wealthData.risk && wealthData.risk.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-red mb-2">
                  {t.wealthRisk}
                </p>
                <ul className="space-y-1 text-sm text-accent-red">
                  {wealthData.risk.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-red" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 必需文案 */}
      <div className="text-xs text-light-secondary bg-mystic-secondary/80 p-2 rounded border border-card-border-light report-note text-left mt-4">
        {t.disclaimer}
      </div>
    </motion.section>
  );
}

