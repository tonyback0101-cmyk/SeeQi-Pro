"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";

type Locale = "zh" | "en";

interface DreamDetailedAnalysisProps {
  report: AnalysisV2Result;
  locale: Locale;
  delay?: number;
}

/**
 * 过滤掉心理学用语的函数
 * 确保文案符合国学风格，避免现代心理/精神病学用语
 */
function filterPsychologicalTerms(text: string, locale: Locale): string {
  if (!text) return text;
  
  if (locale === "zh") {
    // 替换或移除心理学用语
    let filtered = text
      .replace(/心理压力/g, "心绪")
      .replace(/潜意识/g, "内象")
      .replace(/抑郁/g, "忧思")
      .replace(/焦虑/g, "不安")
      .replace(/精神疾病/g, "心神不宁")
      .replace(/心理/g, "心象")
      .replace(/精神/g, "神思")
      .replace(/情绪/g, "心绪")
      .replace(/压力/g, "负担");
    
    return filtered;
  } else {
    // 英文版本也进行类似处理
    let filtered = text
      .replace(/psychological pressure/gi, "mental state")
      .replace(/subconscious/gi, "inner symbol")
      .replace(/depression/gi, "melancholy")
      .replace(/anxiety/gi, "unease")
      .replace(/mental illness/gi, "spiritual unrest")
      .replace(/psychological/gi, "symbolic")
      .replace(/mental/gi, "spiritual")
      .replace(/emotion/gi, "mood")
      .replace(/pressure/gi, "burden");
    
    return filtered;
  }
}

export default function DreamDetailedAnalysis({ report, locale, delay = 0.45 }: DreamDetailedAnalysisProps) {
  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  
  // 安全地提取数据
  const dreamInsight = reportData?.dream_insight ?? null;
  const dreamRecord = (report as any)?.dream ?? null;
  
  // 提取 dream LLM 数据（带空值处理）
  const dreamLLM = dreamInsight?.llm ?? dreamInsight?.archetype ?? null;

  const t =
    locale === "zh"
      ? {
          title: "梦境深度解读",
          symbolMeaning: "象义说明",
          fortuneOmen: "吉凶预兆",
          trendReminder: "趋势提醒",
          resolutionAdvice: "化解建议",
          // 吉凶忧思喜角度
          auspicious: "吉",
          inauspicious: "凶",
          worry: "忧",
          thought: "思",
          joy: "喜",
          // 国学词汇
          symbol: "象",
          omen: "兆",
          meaning: "意",
          sign: "征",
          disclaimer: "梦境解梦为传统象意学，仅作气运参考，不构成医学或心理学判断。",
        }
      : {
          title: "Deep Dream Interpretation",
          symbolMeaning: "Symbolic Meaning",
          fortuneOmen: "Fortune Omen",
          trendReminder: "Trend Reminder",
          resolutionAdvice: "Resolution Suggestions",
          // 吉凶忧思喜角度
          auspicious: "Auspicious",
          inauspicious: "Inauspicious",
          worry: "Worry",
          thought: "Thought",
          joy: "Joy",
          // 国学词汇
          symbol: "Symbol",
          omen: "Omen",
          meaning: "Meaning",
          sign: "Sign",
          disclaimer: "Dream interpretation is based on traditional symbolic studies, for qi rhythm reference only, not constituting medical or psychological judgment.",
        };

  // 提取象义说明（符号）
  const symbolText = filterPsychologicalTerms(
    dreamLLM?.ImageSymbol ?? 
    dreamLLM?.symbolic ?? 
    dreamInsight?.symbol ?? 
    dreamLLM?.symbol_meaning ?? 
    "",
    locale
  );

  // 提取吉凶预兆（从 meaning 或 mood 中提取，使用国学风格）
  const meaningText = filterPsychologicalTerms(
    dreamLLM?.meaning ?? 
    dreamInsight?.meaning ?? 
    dreamLLM?.MindState ?? 
    dreamInsight?.mood ?? 
    "",
    locale
  );

  // 提取趋势提醒
  const trendText = filterPsychologicalTerms(
    dreamLLM?.Trend ?? 
    dreamLLM?.trend ?? 
    dreamInsight?.trend ?? 
    dreamLLM?.trend_hint ?? 
    "",
    locale
  );

  // 提取化解建议（过滤心理学用语）
  const adviceList = (dreamLLM?.Advice ?? 
                     dreamLLM?.advice ?? 
                     dreamLLM?.actions ?? 
                     dreamInsight?.suggestions ?? 
                     dreamInsight?.advice ?? 
                     []).map((item: string) => filterPsychologicalTerms(item, locale));

  // 从吉凶忧思喜角度分析（如果 meaningText 中包含相关词汇）
  const fortuneAnalysis = [];
  if (meaningText) {
    const lowerText = meaningText.toLowerCase();
    if (locale === "zh") {
      if (lowerText.includes("吉") || lowerText.includes("好") || lowerText.includes("顺") || lowerText.includes("喜")) {
        fortuneAnalysis.push({ type: t.auspicious, text: meaningText });
      } else if (lowerText.includes("凶") || lowerText.includes("险") || lowerText.includes("难")) {
        fortuneAnalysis.push({ type: t.inauspicious, text: meaningText });
      } else if (lowerText.includes("忧") || lowerText.includes("愁") || lowerText.includes("虑")) {
        fortuneAnalysis.push({ type: t.worry, text: meaningText });
      } else if (lowerText.includes("思") || lowerText.includes("想") || lowerText.includes("虑")) {
        fortuneAnalysis.push({ type: t.thought, text: meaningText });
      } else if (lowerText.includes("喜") || lowerText.includes("乐") || lowerText.includes("欢")) {
        fortuneAnalysis.push({ type: t.joy, text: meaningText });
      }
    } else {
      if (lowerText.includes("auspicious") || lowerText.includes("good") || lowerText.includes("fortunate") || lowerText.includes("joy")) {
        fortuneAnalysis.push({ type: t.auspicious, text: meaningText });
      } else if (lowerText.includes("inauspicious") || lowerText.includes("bad") || lowerText.includes("danger")) {
        fortuneAnalysis.push({ type: t.inauspicious, text: meaningText });
      } else if (lowerText.includes("worry") || lowerText.includes("concern") || lowerText.includes("anxiety")) {
        fortuneAnalysis.push({ type: t.worry, text: meaningText });
      } else if (lowerText.includes("thought") || lowerText.includes("think") || lowerText.includes("consider")) {
        fortuneAnalysis.push({ type: t.thought, text: meaningText });
      } else if (lowerText.includes("joy") || lowerText.includes("happy") || lowerText.includes("pleasure")) {
        fortuneAnalysis.push({ type: t.joy, text: meaningText });
      }
    }
  }

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
        {/* 象义说明（符号） */}
        {symbolText && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.symbolMeaning}</p>
            <p className="text-sm leading-relaxed text-light-primary">
              {symbolText}
            </p>
          </div>
        )}

        {/* 吉凶预兆（从吉凶忧思喜角度拆解） */}
        {meaningText && (
          <div className="space-y-2">
            {fortuneAnalysis.length > 0 ? (
              fortuneAnalysis.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl border-2 px-4 py-3 ${
                    item.type === t.auspicious || item.type === t.joy
                      ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10"
                      : item.type === t.inauspicious || item.type === t.worry
                      ? "border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/10"
                      : "border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-light-secondary mb-1">
                    {item.type}
                  </p>
                  <p className="text-sm leading-relaxed text-light-primary">
                    {item.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-1">{t.fortuneOmen}</p>
                <p className="text-sm leading-relaxed text-light-primary">
                  {meaningText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 趋势提醒 */}
        {trendText && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.trendReminder}</p>
            <p className="text-sm leading-relaxed text-light-primary">
              {trendText}
            </p>
          </div>
        )}

        {/* 化解建议 */}
        {adviceList.length > 0 && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">{t.resolutionAdvice}</p>
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

      {/* 必需文案 */}
      <div className="text-xs text-light-secondary bg-mystic-secondary/80 p-2 rounded border border-card-border-light report-note text-left mt-4">
        {t.disclaimer}
      </div>
    </motion.section>
  );
}

