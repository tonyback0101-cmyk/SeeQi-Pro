"use client";

import PalmDetailedAnalysis from "./PalmDetailedAnalysis";
import TongueDetailedAnalysis from "./TongueDetailedAnalysis";
import DreamDetailedAnalysis from "./DreamDetailedAnalysis";
import QiRhythmDetailedAnalysis from "./QiRhythmDetailedAnalysis";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";

type Locale = "zh" | "en";

interface ProFullReportSectionProps {
  report: AnalysisV2Result;
  locale: Locale;
}

export default function ProFullReportSection({ report, locale }: ProFullReportSectionProps) {
  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  
  // 安全地提取数据，所有字段都使用空值处理
  const palmInsight = reportData?.palm_insight ?? null;
  const bodyTongue = reportData?.body_tongue ?? null;
  const dreamInsight = reportData?.dream_insight ?? null;
  const qiRhythm = reportData?.qi_rhythm ?? null;
  
  // 提取掌纹结果（V2 结构：包含 wealth 字段）
  const palmResultV2 = (reportData as any)?.palm_result as any; // PalmResultV2 类型
  
  // 提取 dream LLM 数据（带空值处理）
  const dreamLLM = dreamInsight?.llm ?? dreamInsight?.archetype ?? null;

  return (
    <div className="space-y-6">
      {/* 掌纹详细分析（含财富线） */}
      <PalmDetailedAnalysis report={report} locale={locale} delay={0.35} />

      {/* 舌象详细分析 */}
      <TongueDetailedAnalysis report={report} locale={locale} delay={0.4} />

      {/* 梦境深度解读（周公解梦风格） */}
      <DreamDetailedAnalysis report={report} locale={locale} delay={0.45} />

      {/* 今日综合气运 + 修身节奏（完整版） */}
      <QiRhythmDetailedAnalysis report={report} locale={locale} delay={0.5} />
    </div>
  );
}

