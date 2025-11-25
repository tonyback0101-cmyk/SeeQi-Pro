"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";

type Locale = "zh" | "en";

interface TongueDetailedAnalysisProps {
  report: AnalysisV2Result;
  locale: Locale;
  delay?: number;
}

export default function TongueDetailedAnalysis({ report, locale, delay = 0.4 }: TongueDetailedAnalysisProps) {
  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  
  // 安全地提取数据
  const bodyTongue = reportData?.body_tongue ?? null;
  const advice = reportData?.advice ?? null;
  
  // 提取原始结果数据（用于获取 color, coating 等字段）
  const rawTongueData = (report as any)?.raw_data?.tongue ?? (report as any)?.raw_features?.tongue ?? null;
  const rawTongueResult = rawTongueData ?? (report as any)?.tongue_result ?? null;

  const t =
    locale === "zh"
      ? {
          title: "舌象与中医保养建议",
          tongueSubstance: "舌质",
          tongueCoating: "舌苔",
          symbolicCorrespondence: "象意对应",
          todayAdvice: "今日小调理建议",
          disclaimer: "以下内容为中医象意保养思路，仅作日常调理参考，不构成临床诊断依据。",
          // 字段标签
          color: "色泽",
          size: "胖瘦",
          cracks: "裂纹",
          thickness: "厚薄",
          colorLabel: "颜色",
          moisture: "湿度",
          coldHeat: "偏寒/偏热",
          qiBlood: "气血",
          dampness: "湿浊",
        }
      : {
          title: "Tongue Diagnosis & TCM Health Care Advice",
          tongueSubstance: "Tongue Substance",
          tongueCoating: "Tongue Coating",
          symbolicCorrespondence: "Symbolic Correspondence",
          todayAdvice: "Today's Small Adjustments",
          disclaimer: "The following content is based on TCM symbolic health care thinking, for daily health reference only, and does not constitute clinical diagnostic basis.",
          // 字段标签
          color: "Color",
          size: "Size",
          cracks: "Cracks",
          thickness: "Thickness",
          colorLabel: "Color",
          moisture: "Moisture",
          coldHeat: "Cold/Heat",
          qiBlood: "Qi & Blood",
          dampness: "Dampness",
        };

  // 提取舌质信息（色泽、胖瘦、有无裂纹）
  const tongueSubstanceInfo: string[] = [];
  if (rawTongueResult?.color) {
    tongueSubstanceInfo.push(`${t.color}: ${rawTongueResult.color}`);
  }
  if (rawTongueResult?.texture) {
    tongueSubstanceInfo.push(`${t.size}: ${rawTongueResult.texture}`);
  }
  // 检查是否有裂纹信息（从不同数据源）
  let cracksInfo: string | null = null;
  if (rawTongueResult?.cracks) {
    cracksInfo = rawTongueResult.cracks;
  } else if ((rawTongueResult as any)?.shape?.includes("cracked")) {
    cracksInfo = locale === "zh" ? "有裂纹" : "Cracked";
  } else if (bodyTongue?.tongue_cracks_signal) {
    cracksInfo = bodyTongue.tongue_cracks_signal;
  }
  if (cracksInfo) {
    tongueSubstanceInfo.push(`${t.cracks}: ${cracksInfo}`);
  }
  // 如果没有提取到任何信息，使用 bodyTongue 的 summary 或 tongue_color_signal
  if (tongueSubstanceInfo.length === 0 && bodyTongue?.tongue_color_signal) {
    tongueSubstanceInfo.push(bodyTongue.tongue_color_signal);
  }

  // 提取舌苔信息（厚薄、颜色、湿度）
  const tongueCoatingInfo: string[] = [];
  if (rawTongueResult?.coating) {
    // 如果 coating 是简单字符串，直接使用
    tongueCoatingInfo.push(rawTongueResult.coating);
  }
  // 如果没有从 rawTongueResult 提取到，尝试从 bodyTongue 提取
  if (tongueCoatingInfo.length === 0 && bodyTongue?.tongue_coating_signal) {
    tongueCoatingInfo.push(bodyTongue.tongue_coating_signal);
  }

  // 提取象意对应（偏寒/偏热、气血、湿浊等）
  const symbolicInfo = [];
  if (bodyTongue?.qi_pattern) {
    symbolicInfo.push({
      label: locale === "zh" ? "经络趋势" : "Meridian Trend",
      value: bodyTongue.qi_pattern,
    });
  }
  if (bodyTongue?.energy_state) {
    symbolicInfo.push({
      label: t.qiBlood,
      value: bodyTongue.energy_state,
    });
  }
  if (bodyTongue?.body_trend) {
    // 从 body_trend 中提取偏寒/偏热、湿浊等信息
    const trendText = bodyTongue.body_trend;
    if (trendText.includes("寒") || trendText.includes("热") || trendText.includes("cold") || trendText.includes("heat")) {
      symbolicInfo.push({
        label: t.coldHeat,
        value: trendText,
      });
    } else if (trendText.includes("湿") || trendText.includes("燥") || trendText.includes("damp") || trendText.includes("dry")) {
      symbolicInfo.push({
        label: t.dampness,
        value: trendText,
      });
    } else {
      symbolicInfo.push({
        label: locale === "zh" ? "身体趋势" : "Body Trend",
        value: trendText,
      });
    }
  }

  // 提取今日小调理建议
  const healthCareAdvice = bodyTongue?.health_care_advice ?? bodyTongue?.suggestions ?? bodyTongue?.advice ?? [];
  // 如果 body_tongue 中没有，尝试从 advice.items 中提取与舌象相关的内容
  const adviceItems = advice?.items ?? advice?.actions ?? [];
  const tongueRelatedAdvice = adviceItems.filter((item: string) => {
    const lowerItem = item.toLowerCase();
    return (
      lowerItem.includes("舌") ||
      lowerItem.includes("tongue") ||
      lowerItem.includes("饮食") ||
      lowerItem.includes("diet") ||
      lowerItem.includes("调理") ||
      lowerItem.includes("adjustment")
    );
  });
  const allAdvice = healthCareAdvice.length > 0 ? healthCareAdvice : tongueRelatedAdvice;

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
        {/* 舌质：色泽、胖瘦、有无裂纹 */}
        {tongueSubstanceInfo.length > 0 && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.tongueSubstance}</h3>
            <div className="space-y-1">
              {tongueSubstanceInfo.map((info, index) => (
                <p key={index} className="text-sm leading-relaxed text-light-primary">
                  {info}
                </p>
              ))}
            </div>
            {/* 如果有 summary，也显示 */}
            {bodyTongue?.summary && (
              <p className="mt-2 text-xs text-light-secondary italic">
                {bodyTongue.summary}
              </p>
            )}
          </div>
        )}

        {/* 舌苔：厚薄、颜色、湿度 */}
        {tongueCoatingInfo.length > 0 && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">{t.tongueCoating}</h3>
            <div className="space-y-1">
              {tongueCoatingInfo.map((info, index) => (
                <p key={index} className="text-sm leading-relaxed text-light-primary">
                  {info}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 象意对应：偏寒/偏热、气血、湿浊等 */}
        {symbolicInfo.length > 0 && (
          <div className="space-y-3">
            {symbolicInfo.map((item, index) => (
              <div key={index} className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-1">
                  {item.label}
                </p>
                <p className="text-sm leading-relaxed text-light-primary">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 今日小调理建议 */}
        {allAdvice.length > 0 && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.todayAdvice}
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
              {allAdvice.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
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

