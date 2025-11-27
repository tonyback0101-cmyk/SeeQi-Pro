"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { buildHomePage, buildV2ResultPage } from "@/lib/v2/routes";
import FiveAspectOverview, { FiveAspectData } from "./components/FiveAspectOverview";
import PalmistryBlock from "./components/PalmistryBlock";
import TongueBlock from "./components/TongueBlock";
import DreamBlock from "./components/DreamBlock";
import CalendarAndStatusBlock from "./components/CalendarAndStatusBlock";
import type { V2AccessResult } from "@/lib/access/v2Access";
import type { AnalysisV2Result } from "@/lib/analysis/v2/reportStore";
import UnlockModal from "@/components/v2/UnlockModal";

type Locale = "zh" | "en";

/**
 * Aspect 值类型（用于五象数据）
 */
type AspectValue = {
  tag?: string | null;
  preview?: string | null;
  detail?: string | null;
};

/**
 * 访问级别类型
 */
export type AccessLevel = "preview" | "full";

/**
 * 统一判断访问级别
 * 判断规则：
 * 1. 是否有针对该 reportId 的单次购买记录
 * 2. 或者是否是有效订阅用户
 * 3. 否则为 preview
 */
function getAccessLevel(
  report: AnalysisV2Result,
  access: V2AccessResult,
): AccessLevel {
  // 如果 access.hasFullAccess 为 true，说明有单次购买或有效订阅
  if (access.hasFullAccess) {
    return "full";
  }
  // 否则为预览模式
  return "preview";
}

type V2AnalysisResultClientProps = {
  locale: Locale;
  report: AnalysisV2Result;
  access: V2AccessResult;
  userId: string | null;
  isLoggedIn: boolean;
  user?: { is_pro?: boolean } | null;
};

type TongueResult = {
  color: string;
  coating: string;
  texture: string;
  qualityScore: number;
};

type V2ReportResponse = {
  id: string;
  created_at: string;
  normalized?: {
    palm_insight?: {
      life_rhythm: string;
      emotion_pattern: string;
      thought_style: string;
      palm_overview_summary: string;
      palm_advice: string[];
    } | null;
    palm_result?: {
      color: string;
      texture: string;
      lines: {
        life?: string;
        heart?: string;
        wisdom?: string;
        wealth?: string;
      };
      qualityScore: number;
    } | null;
    body_tongue?: {
      qi_pattern: string;
      energy_state: string;
      body_trend: string;
      health_care_advice: string[];
    } | null;
    constitution?: {
      type: string;
      name: string;
      name_en: string;
      description_paragraphs: string[];
      constitution_advice: string[];
    } | null;
    dream_insight?: {
      archetype?: {
        type?: string;
        symbol_meaning?: string;
        mood_pattern?: string;
        trend_hint?: string;
        suggestion_tags?: string[];
      } | null;
      llm?: {
        ImageSymbol?: string | null;
        MindState?: string | null;
        Trend?: string | null;
        Advice?: string[];
        symbolic?: string | null;
        psychological?: string | null;
        trend?: string | null;
        actions?: string[];
      } | null;
    } | null;
    qi_rhythm?: {
      index: number;
      tag: string;
      trend: "up" | "down" | "flat";
      summary?: string;
      trendText?: string;
      advice?: string[];
      description?: string;
      suggestions?: string[];
    } | null;
    advice?: {
      actions: string[];
    } | null;
  };
  palm_insight?: {
    life_rhythm?: string;
    emotion_pattern?: string;
    thought_style?: string;
    palm_overview_summary?: string;
    palm_advice?: string[];
  } | null;
  palm_result?: {
    color: string;
    texture: string;
    lines: {
      life?: string;
      heart?: string;
      wisdom?: string;
      wealth?: string;
    };
    qualityScore: number;
  } | null;
  body_tongue?: {
    qi_pattern?: string;
    energy_state?: string;
    body_trend?: string;
    health_care_advice?: string[];
    summary?: string;
    suggestions?: string[];
  } | null;
  constitution?: {
    type?: string;
    name?: string;
    name_en?: string;
    description_paragraphs?: string[];
    constitution_advice?: string[];
    feature?: string;
    advice?: string;
    adviceSummary?: string;
  } | null;
  dream_insight?: {
    archetype?: {
      type?: string;
      symbol_meaning?: string;
      mood_pattern?: string;
      trend_hint?: string;
      suggestion_tags?: string[];
    } | null;
    llm?: {
      ImageSymbol?: string | null;
      MindState?: string | null;
      Trend?: string | null;
      Advice?: string[];
      symbolic?: string | null;
      psychological?: string | null;
      trend?: string | null;
      actions?: string[];
    } | null;
  } | null;
  qi_rhythm?: {
    index: number;
    tag: string;
    trend: "up" | "down" | "flat";
    summary?: string;
    trendText?: string;
    advice?: string[];
  } | null;
  advice?: {
    actions: string[];
  } | null;
};

type ReportAccessStatus = "paid" | "pending" | "preview" | string;

function getPreviewSentence(value: string | null | undefined, locale: Locale): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const segments = trimmed.split(locale === "zh" ? /[。！？\n]/ : /[.!?\n]/).map((seg) => seg.trim()).filter(Boolean);
  if (segments.length === 0) {
    return trimmed;
  }
  return segments[0];
}

function normalizeText(value: unknown, locale: Locale): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join(locale === "zh" ? "；" : " · ");
    return joined.length ? joined : null;
  }
  return null;
}

function extractReportAccessStatus(report: AnalysisV2Result | Record<string, unknown>): ReportAccessStatus | null {
  const rawAccess = (report as any)?.report_access ?? (report as any)?.access;
  if (!rawAccess) {
    return null;
  }
  if (Array.isArray(rawAccess)) {
    const paidEntry = rawAccess.find((entry) => entry?.status);
    return paidEntry?.status ?? null;
  }
  if (typeof rawAccess === "object") {
    return (rawAccess as any).status ?? null;
  }
  return null;
}

function extractFiveAspectData(report: AnalysisV2Result, locale: Locale): FiveAspectData {
  const normalized = report?.normalized ?? {};
  const palmResult = normalized?.palm_result ?? (report as any)?.palm_result ?? null;
  const palmInsight = normalized?.palm_insight ?? (report as any)?.palm_insight ?? null;
  const bodyTongue = normalized?.body_tongue ?? (report as any)?.body_tongue ?? null;
  const constitution = normalized?.constitution ?? (report as any)?.constitution ?? null;
  const dreamInsight = normalized?.dream_insight ?? (report as any)?.dream_insight ?? null;
  const qiRhythm = normalized?.qi_rhythm ?? (report as any)?.qi_rhythm ?? null;

  // 优先使用 page.tsx 注入的数据结构（包含 preview 和 detail）
  const summaryBlock = (report as any)?.summary ?? {};
  const palmBlock = (report as any)?.palm ?? {};
  const tongueBlock = (report as any)?.tongue ?? {};
  const dreamBlock = (report as any)?.dream ?? {};
  const qiBlock = (report as any)?.qi_rhythm ?? {};

  // 构建 Aspect 数据，优先使用 page.tsx 注入的 preview/detail 结构
  const buildAspectFromBlock = (
    tag: string | null | undefined,
    preview: string | null | undefined,
    detail: string | null | undefined,
  ): AspectValue | null => {
    const normalizedTag = tag ? String(tag).trim() : null;
    const normalizedPreview = preview ? normalizeText(preview, locale) : null;
    const normalizedDetail = detail ? normalizeText(detail, locale) : null;
    
    if (!normalizedTag && !normalizedPreview && !normalizedDetail) {
      return null;
    }
    
    return {
      tag: normalizedTag,
      preview: normalizedPreview,
      detail: normalizedDetail ?? normalizedPreview, // 如果没有 detail，使用 preview 作为 detail
    };
  };

  // 构建 Aspect 数据（fallback 到原始数据）
  const buildAspect = (tag?: string | null, text?: string | null) => {
    if (!tag && !text) return null;
    return {
      tag: tag ?? null,
      preview: getPreviewSentence(text, locale),
      detail: text ?? null,
    };
  };

  // 掌纹数据：优先使用 page.tsx 注入的 preview/detail
  const palmWealth = buildAspectFromBlock(
    palmBlock?.wealth?.label ?? palmResult?.wealth?.pattern ?? (palmInsight as any)?.wealth?.pattern ?? null,
    palmBlock?.wealth?.summary ?? palmResult?.wealth?.summary ?? (palmInsight as any)?.wealth?.summary ?? null,
    palmBlock?.wealth?.detail ?? null,
  ) ?? buildAspect(
    palmResult?.wealth?.pattern ?? (palmInsight as any)?.wealth?.pattern ?? null,
    normalizeText(
      palmResult?.wealth?.summary ?? (palmInsight as any)?.wealth?.summary ?? null,
      locale,
    ),
  );

  const palmLife = buildAspectFromBlock(
    palmBlock?.life_line?.label ?? palmResult?.life?.description ?? palmInsight?.life_rhythm ?? null,
    palmBlock?.life_line?.summary ?? palmResult?.life?.interpretation ?? palmInsight?.life_rhythm ?? null,
    palmBlock?.life_line?.detail ?? null,
  ) ?? buildAspect(
    palmResult?.life?.description ?? palmInsight?.life_rhythm ?? null,
    normalizeText(
      palmResult?.life?.interpretation ?? palmInsight?.life_rhythm ?? null,
      locale,
    ),
  );

  const palmEmotion = buildAspectFromBlock(
    palmBlock?.emotion?.label ?? palmResult?.emotion?.description ?? palmInsight?.emotion_pattern ?? null,
    palmBlock?.emotion?.summary ?? palmResult?.emotion?.interpretation ?? palmInsight?.emotion_pattern ?? null,
    palmBlock?.emotion?.detail ?? null,
  ) ?? buildAspect(
    palmResult?.emotion?.description ?? palmInsight?.emotion_pattern ?? null,
    normalizeText(
      palmResult?.emotion?.interpretation ?? palmInsight?.emotion_pattern ?? null,
      locale,
    ),
  );

  // 舌象数据：优先使用 page.tsx 注入的 preview/detail
  const tongueDetail = [
    tongueBlock?.constitution?.detail,
    bodyTongue?.energy_state,
    (bodyTongue?.health_care_advice || []).join(locale === "zh" ? "；" : " · "),
  ]
    .filter(Boolean)
    .join(locale === "zh" ? " " : " ");

  const tongueAspect = buildAspectFromBlock(
    tongueBlock?.constitution?.label ?? constitution?.name ?? null,
    tongueBlock?.constitution?.summary ?? bodyTongue?.summary ?? constitution?.description_paragraphs?.[0] ?? null,
    tongueBlock?.constitution?.detail || tongueDetail || null,
  ) ?? buildAspect(
    constitution?.name ?? null,
    normalizeText(bodyTongue?.summary ?? constitution?.description_paragraphs?.[0], locale),
  );

  // 梦境数据：优先使用 page.tsx 注入的 preview/detail
  const dreamAspect = buildAspectFromBlock(
    dreamBlock?.main_symbol?.label ?? dreamInsight?.llm?.ImageSymbol ?? dreamInsight?.archetype?.type ?? null,
    dreamBlock?.main_symbol?.summary ??
      dreamInsight?.llm?.MindState ??
      dreamInsight?.llm?.symbolic ??
      dreamInsight?.archetype?.symbol_meaning ??
      null,
    dreamBlock?.main_symbol?.detail ?? null,
  ) ?? buildAspect(
    dreamInsight?.llm?.ImageSymbol ?? dreamInsight?.archetype?.type ?? null,
    normalizeText(
      dreamInsight?.llm?.MindState ??
        dreamInsight?.llm?.symbolic ??
        dreamInsight?.archetype?.symbol_meaning,
      locale,
    ),
  );
  
  // 如果 dreamAspect 存在但没有 detail，尝试从 dreamInsight 构建 detail
  if (dreamAspect && !dreamAspect.detail) {
    const dreamDetail = [
      dreamInsight?.llm?.Trend ?? dreamInsight?.trend,
      (dreamInsight?.llm?.Advice ?? dreamInsight?.suggestions ?? []).join(locale === "zh" ? "；" : " · "),
    ]
      .filter(Boolean)
      .join(locale === "zh" ? " " : " ");
    if (dreamDetail) {
      dreamAspect.detail = normalizeText(dreamDetail, locale);
    }
  }

  // 气运数据：优先使用 page.tsx 注入的 preview/detail
  const qiAspect = buildAspectFromBlock(
    qiBlock?.today_phase?.label ?? qiRhythm?.tag ?? null,
    qiBlock?.today_phase?.summary ?? qiRhythm?.summary ?? qiRhythm?.trendText ?? null,
    qiBlock?.today_phase?.detail ?? null,
  ) ?? buildAspect(
    qiRhythm?.tag ?? null,
    normalizeText(qiRhythm?.summary ?? qiRhythm?.trendText, locale),
  );
  
  // 如果 qiAspect 存在但没有 detail，尝试从 qiRhythm 构建 detail
  if (qiAspect && !qiAspect.detail) {
    const qiDetail = [
      (qiRhythm?.advice || []).join(locale === "zh" ? "；" : " · "),
      (qiBlock?.lucky_hours ?? []).join(locale === "zh" ? "、" : ", "),
    ]
      .filter(Boolean)
      .join(locale === "zh" ? " " : " ");
    if (qiDetail) {
      qiAspect.detail = normalizeText(qiDetail, locale);
    }
  }

  // 总结数据：优先使用 page.tsx 注入的 preview/detail
  // 确保预览版和完整版不重复：完整版时 preview 为 null，只显示 detail（完整内容）
  const summaryOverall =
    normalizeText(summaryBlock?.overall, locale) ??
    normalizeText(qiBlock?.overall, locale) ??
    normalizeText(qiRhythm?.summary, locale) ??
    normalizeText(palmInsight?.palm_overview_summary, locale);

  // 如果 summaryBlock.preview 存在，使用它；如果为 null（完整版），也使用 null（不提取预览）
  const summaryPreview = summaryBlock?.preview !== undefined 
    ? normalizeText(summaryBlock.preview, locale) 
    : null;

  return {
    summary: buildAspectFromBlock(
      summaryBlock?.overall_label ?? (locale === "zh" ? "今日象局" : "Essence"),
      summaryPreview, // 完整版时为 null，预览版时为高级摘要
      summaryOverall, // 完整版时为完整内容，预览版时为预览内容
    ) ?? buildAspect(
      summaryBlock?.overall_label ?? (locale === "zh" ? "今日象局" : "Essence"),
      summaryOverall,
    ),
    palm: {
      life: palmLife,
      wealth: palmWealth,
      emotion: palmEmotion,
    },
    tongue: tongueAspect,
    dream: dreamAspect,
    qi: qiAspect,
  };
}

const TEXT = {
  zh: {
    title: "综合测评报告（预览版）",
    subtitle: "基于掌纹、舌象、体质、梦境与气运的综合分析",
    loading: "正在加载报告…",
    failed: "抱歉，报告暂时无法加载，请稍后再试。",
    disclaimer:
      "本报告基于东方象学与现代算法，仅供自我理解与生活启发，不构成医疗或确定性预测，如有健康或心理困扰请遵循专业意见。",
    unlockHint: "想看完整掌纹 / 舌苔 / 梦境 / 气运详情？",
    unlockDesc: "可一次解锁本账户（US$1.99），或开通月/年订阅。",
    unlockButton: "解锁完整报告 · 查看财富线与今日详细建议",
  },
  en: {
    title: "Comprehensive Report (Preview)",
    subtitle: "Integrated analysis based on palmistry, tongue, constitution, dreams, and qi rhythm",
    loading: "Loading report…",
    failed: "Sorry, we couldn't load this report. Please try again later.",
    disclaimer:
      "This report draws on Eastern symbolism plus modern modeling for self-understanding only; it is not medical advice or a deterministic prediction.",
    unlockHint: "Want to see full palm / tongue / dream / qi details?",
    unlockDesc: "Unlock this account once (US$1.99) or subscribe monthly/yearly.",
    unlockButton: "Unlock Full Report · View Wealth Line & Detailed Suggestions",
  },
} as const;

export default function V2AnalysisResultClient({
  locale,
  report,
  access,
  userId,
  isLoggedIn,
  user,
}: V2AnalysisResultClientProps) {
  const t = TEXT[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 提取 page.tsx 注入的数据结构（包含 preview 和 detail）
  const palmBlock = (report as any)?.palm ?? {};
  const tongueBlock = (report as any)?.tongue ?? {};
  const dreamBlock = (report as any)?.dream ?? {};
  const qiBlock = (report as any)?.qi_rhythm ?? {};
  const { data: session, status } = useSession();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 获取当前 reportId 与 locale
  const reportId = searchParams?.get("reportId") ?? report?.id ?? "";
  const effectiveLocale = locale ?? "zh";

  // 构建当前页面的 URL（用于 UnlockModal 的登录回调）
  const currentUrl = buildV2ResultPage(effectiveLocale, reportId);

  // 处理支付成功/取消后的回跳
  // 支付成功后的回跳地址：/${locale}/v2/analysis-result?reportId=<id>&success=1
  // 支付取消后的回跳地址：/${locale}/v2/analysis-result?reportId=<id>&canceled=1
  const [urlCleaned, setUrlCleaned] = useState(false);
  useEffect(() => {
    if (urlCleaned) return; // 避免重复执行
    
    const success = searchParams?.get("success");
    const canceled = searchParams?.get("canceled");
    const sessionId = searchParams?.get("session_id");
    
    if (success === "1" || canceled === "1") {
      // 支付成功或取消，清理 URL 参数
      // 服务器端已经通过 computeV2Access 获取了最新的 access 状态
      const cleanUrl = buildV2ResultPage(effectiveLocale, reportId);
      setUrlCleaned(true);
      // 延迟执行，避免在渲染过程中触发导航
      setTimeout(() => {
        router.replace(cleanUrl);
      }, 100);
    }
  }, [searchParams, effectiveLocale, reportId, router, urlCleaned]);

  const fiveAspectData = useMemo(() => extractFiveAspectData(report, locale), [report, locale]);
  const reportAccessStatus = useMemo(() => extractReportAccessStatus(report), [report]);
  const accessLevel = getAccessLevel(report, access);
  const isFullAccess = accessLevel === "full";
  const resolvedAccessLevel = accessLevel;
  const showPaywall = !isFullAccess;


  if (!report) {
    console.error("[V2AnalysisResultClient] Report is null, showing error message", { reportId, hasAccess: !!access });
    return (
      <div className="min-h-screen bg-mystic-primary text-light-secondary flex items-center justify-center" style={{ backgroundColor: '#0D1B2A', color: '#AABBC9' }}>
        <div className="text-center">
          <p style={{ color: '#AABBC9' }}>{t.failed}</p>
          {reportId && (
            <p style={{ color: '#AABBC9', marginTop: '16px', fontSize: '14px' }}>
              {locale === "zh" ? `报告ID: ${reportId}` : `Report ID: ${reportId}`}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 获取报告数据（优先使用 normalized，兼容旧格式）
  const reportData = report?.normalized ?? report;
  const runtimeWarnings = (reportData as any)?.runtime_warnings as
    | {
        palm?: string[];
        tongue?: string[];
      }
    | undefined;
  
  // 安全地提取数据，所有字段都使用空值处理
  const palmInsight = reportData?.palm_insight ?? null;
  const bodyTongue = reportData?.body_tongue ?? null;
  const constitution = reportData?.constitution ?? null;
  const dreamInsight = reportData?.dream_insight ?? null;
  const qiRhythm = reportData?.qi_rhythm ?? null;
  const advice = reportData?.advice ?? null;
  
  // 提取原始结果数据（用于获取 color 等字段）
  const rawTongueData = (report as any)?.raw_data?.tongue ?? (report as any)?.raw_features?.tongue ?? null;
  const rawTongueResult = rawTongueData ?? (report as any)?.tongue_result ?? null;
  const tongueResult = bodyTongue ?? rawTongueResult;
  
  // 提取掌纹结果（V2 结构：包含 wealth 字段）
  const palmResultV2 = (reportData as any)?.palm_result as any; // PalmResultV2 类型
  const palmResult = (report as any)?.palm_result ?? null; // 旧格式兼容

  // 提取 dream LLM 数据（带空值处理）
  const dreamLLM = dreamInsight?.llm ?? dreamInsight?.archetype ?? null;

  const palmPreviewLines = {
    lifeLine: palmBlock?.life_line?.summary ?? null,
    wisdomLine: palmBlock?.wisdom?.summary ?? null,
    heartLine: palmBlock?.emotion?.summary ?? null,
    wealthLine: palmBlock?.wealth?.summary ?? null,
  };

  const palmFullLines = {
    lifeLine: palmBlock?.life_line?.detail ?? palmBlock?.life_line?.summary ?? null,
    wisdomLine: palmBlock?.wisdom?.detail ?? palmBlock?.wisdom?.summary ?? null,
    heartLine: palmBlock?.emotion?.detail ?? palmBlock?.emotion?.summary ?? null,
    wealthLine: palmBlock?.wealth?.detail ?? palmBlock?.wealth?.summary ?? null,
  };

  const palmFullDataPayload = {
    life: palmResultV2?.life ?? null,
    emotion: palmResultV2?.emotion ?? null,
    wisdom: palmResultV2?.wisdom ?? null,
    wealth: (palmInsight as any)?.wealth
      ? {
          level: (palmInsight as any).wealth.level ?? palmResultV2?.wealth?.level ?? "medium",
          pattern: (palmInsight as any).wealth.pattern ?? palmResultV2?.wealth?.pattern ?? "",
          risk: (palmInsight as any).wealth.risk ?? palmResultV2?.wealth?.risk ?? [],
          potential: (palmInsight as any).wealth.potential ?? palmResultV2?.wealth?.potential ?? [],
          summary: (palmInsight as any).wealth.summary ?? palmResultV2?.wealth?.summary ?? "",
        }
      : palmResultV2?.wealth ?? null,
  };

  const tonguePreviewSummary = tongueBlock?.constitution?.summary ?? bodyTongue?.summary ?? null;

  const tongueFullContentPayload = {
    qiPattern: bodyTongue?.qi_pattern ?? null,
    energyState: bodyTongue?.energy_state ?? null,
    bodyTrend: bodyTongue?.body_trend ?? null,
    healthCareAdvice: bodyTongue?.health_care_advice ?? [],
    summary: tongueBlock?.constitution?.detail ?? bodyTongue?.summary ?? null,
    suggestions: bodyTongue?.suggestions ?? [],
  };

  const dreamPreviewSummary = dreamBlock?.main_symbol?.summary ?? null;

  const dreamFullContentPayload = {
    imageSymbol: dreamLLM?.ImageSymbol ?? dreamLLM?.symbolic ?? dreamInsight?.symbol ?? null,
    symbol: dreamInsight?.symbol ?? dreamLLM?.ImageSymbol ?? dreamLLM?.symbolic ?? null,
    trend: dreamLLM?.Trend ?? dreamLLM?.trend ?? dreamInsight?.trend ?? null,
    meaning: dreamLLM?.meaning ?? null,
    advice: dreamLLM?.Advice ?? dreamLLM?.advice ?? dreamInsight?.suggestions ?? dreamInsight?.advice ?? [],
    suggestions: dreamInsight?.suggestions ?? dreamLLM?.Advice ?? dreamLLM?.actions ?? [],
  };

  const qiPreviewSummary = qiBlock?.today_phase?.summary ?? null;
  const qiFullDetail = qiBlock?.today_phase?.detail ?? qiBlock?.today_phase?.summary ?? null;

  // 检查数据缺失情况（用于显示警告）
  const hasDataMissing =
    !constitution?.type ||
    (!bodyTongue?.qi_pattern && !rawTongueResult?.color) ||
    !palmInsight?.life_rhythm ||
    (!dreamInsight?.llm && !dreamInsight?.archetype) ||
    (qiRhythm?.index === undefined || qiRhythm?.index === null);

  // 处理 fallback 逻辑
  const palmRuntimeWarningText =
    runtimeWarnings?.palm && runtimeWarnings.palm.length > 0 ? runtimeWarnings.palm.join(locale === "zh" ? "；" : " · ") : null;
  const tongueRuntimeWarningText =
    runtimeWarnings?.tongue && runtimeWarnings.tongue.length > 0 ? runtimeWarnings.tongue.join(locale === "zh" ? "；" : " · ") : null;

  const palmFallback =
    Boolean(palmRuntimeWarningText) ||
    (!palmInsight?.life_rhythm && !palmInsight?.palm_overview_summary);
  const tongueFallback =
    Boolean(tongueRuntimeWarningText) ||
    (!bodyTongue?.qi_pattern && !bodyTongue?.summary);
  const dreamFallback = !dreamLLM?.symbolic && !dreamLLM?.symbol_meaning;

  const fallbackTexts = {
    zh: {
      palm: "本次掌纹数据暂未生成完整洞察，可在下一次上传更清晰的掌纹照片。",
      tongue: "本次舌象数据暂未生成完整洞察，可在下一次上传更清晰的舌象照片。",
      dream: "本次梦境数据暂未生成完整洞察，可在下一次记录更详细的梦境内容。",
    },
    en: {
      palm: "Palm insight not fully generated this time. Try uploading a clearer palm photo next round.",
      tongue: "Tongue insight not fully generated this time. Try uploading a clearer tongue photo next round.",
      dream: "Dream insight not fully generated this time. Try recording more detailed dream content next time.",
    },
  };

  const palmNotice =
    palmRuntimeWarningText ?? (palmFallback ? fallbackTexts[locale].palm : null);
  const tongueNotice =
    tongueRuntimeWarningText ?? (tongueFallback ? fallbackTexts[locale].tongue : null);
  const dreamNotice = dreamFallback ? fallbackTexts[locale].dream : null;

  const analysisWarnings: Array<{ label: string; message: string }> = [];
  if (palmNotice) {
    analysisWarnings.push({
      label: locale === "zh" ? "掌纹" : "Palm",
      message: palmNotice,
    });
  }
  if (tongueNotice) {
    analysisWarnings.push({
      label: locale === "zh" ? "舌象" : "Tongue",
      message: tongueNotice,
    });
  }
  if (dreamNotice) {
    analysisWarnings.push({
      label: locale === "zh" ? "梦境" : "Dream",
      message: dreamNotice,
    });
  }

  const previewHighlights = locale === "zh"
    ? ["掌纹 / 舌苔 / 梦境三大模块概览", "今日气运节奏 + 公历宜忌提示", "基础建议（3-4 条，供日常参考）"]
    : ["Palm / tongue / dream quick overview", "Today's qi rhythm + calendar tips", "Baseline advice (3-4 items for daily use)"];

  const proHighlights = locale === "zh"
    ? ["掌纹财富线 · 事业线深度解读", "舌象体质调理方案（饮食 / 作息 / 情绪）", "梦境象意 + 心绪趋势 + 行动建议", "体质类型 + 今日节律安排"]
    : ["Deep dive on wealth & career lines", "Tongue-based regimen (diet / rest / emotion)", "Dream symbolism + mood trend + actions", "Constitution type + detailed rhythm planning"];

  const unlockPerks = locale === "zh"
    ? ["一次解锁本报告", "或订阅 PRO（月/年）", "解锁历史报告与新分析"]
    : ["Unlock this report once", "Or subscribe PRO (monthly / yearly)", "Access history + new analyses"];

  // 统一的「解锁完整报告」按钮点击处理函数
  const handleUnlockClick = async () => {
    if (isSubmitting) return; // 防连点
    if (!reportId) {
      console.error("[PAY] No reportId provided");
      setPaymentFeedback({ type: "error", message: effectiveLocale === "zh" ? "报告ID缺失" : "Report ID missing" });
      return;
    }

    if (!isLoggedIn) {
      console.log("[PAY] User not logged in, redirecting to sign-in", { reportId });
      const callbackUrl = `/${effectiveLocale}/v2/analysis-result?reportId=${reportId}&intent=unlock`;
      router.push(`/${effectiveLocale}/auth/sign-in?redirect=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    console.log("[PAY] Starting checkout process", { reportId, userId, locale: effectiveLocale });
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v2/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single", // V2 路由需要 mode 参数
          reportId,
          locale: effectiveLocale,
        }),
      });

      console.log("[PAY] Checkout response", { status: response.status, ok: response.ok });

      const data = await response.json();
      console.log("[PAY] Checkout response data", { hasUrl: !!data.url, alreadyUnlocked: data.alreadyUnlocked, error: data.error });

      if (response.ok && data.url) {
        // 跳转到 Stripe 支付页面
        console.log("[PAY] Redirecting to Stripe checkout", { url: data.url });
        window.location.href = data.url;
      } else if (data.alreadyUnlocked) {
        // 报告已解锁，刷新页面
        console.log("[PAY] Report already unlocked, refreshing page");
        router.refresh();
      } else {
        // 显示错误信息
        const errorMessage = data.error || (effectiveLocale === "zh" ? "创建支付会话失败" : "Failed to create checkout session");
        console.error("[PAY] Checkout failed", { error: errorMessage, responseData: data });
        setPaymentFeedback({ type: "error", message: errorMessage });
      }
    } catch (error) {
      console.error("[PAY] Checkout error", error);
      const errorMessage = effectiveLocale === "zh" ? "网络错误，请稍后重试" : "Network error, please try again";
      setPaymentFeedback({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 提取节气和干支信息（从 qi_rhythm.calendar 中获取）
  const calendarData = (report as any)?.normalized?.qi_rhythm?.calendar ?? 
                       qiRhythm?.calendar ?? 
                       (report as any)?.qi_rhythm?.calendar ?? 
                       null;
  const solarTerm = calendarData?.solarTerm ?? null;
  const dayGanzhi = calendarData?.dayGanzhi ?? null;

  return (
    <>
    <div className="relative z-10" style={{ backgroundColor: '#0D1B2A', color: '#AABBC9', minHeight: '100vh', width: '100%', position: 'relative', zIndex: 10, display: 'block', visibility: 'visible' }}>
      {/* 返回链接 - 固定顶部导航 */}
      {/* bg-mystic-primary/80: 半透明背景，让下面的玄幻背景若隐若现 */}
      {/* backdrop-blur-sm: 增加模糊效果，增强玄幻感 */}
      {/* border-b border-card-border: 底部边框使用卡片边框色，形成统一感 */}
      <header className="sticky top-0 z-50 bg-mystic-primary/80 backdrop-blur-sm px-4 h-12 flex items-center border-b border-card-border-light" style={{ backgroundColor: 'rgba(13, 27, 42, 0.8)', borderBottom: '1px solid rgba(80, 120, 160, 0.4)', color: '#AABBC9' }}>
        <Link
          href={buildHomePage(locale)}
          className="back-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-light-secondary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {locale === "zh" ? "返回首页" : "Back to Home"}
        </Link>
      </header>

      {/* 主要内容区域 */}
      <main className="container pt-6 space-y-6 relative z-10 pb-24" style={{ backgroundColor: 'transparent', color: '#AABBC9', position: 'relative', zIndex: 10, display: 'block', visibility: 'visible' }}>
        {/* 数据缺失警告提示 */}
        {hasDataMissing && (
          <motion.div
            variants={fadeUp(0.05)}
            initial="hidden"
            animate="visible"
            className="mb-6 card bg-card-bg-dark border border-card-border-light rounded-lg px-4 py-3 text-left"
          >
            <p className="text-sm font-medium text-accent-red">
              ⚠ {locale === "zh" ? "数据缺失（测试环境）— 显示降级内容。" : "Data Missing (Test Environment) — Showing Fallback Content."}
            </p>
          </motion.div>
        )}

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6 w-full max-w-3xl mx-auto px-6 sm:px-10"
          style={{ color: '#AABBC9' }}
        >
        {/* ① 头部信息 + 今日气运节奏（预览可见） */}
        <section className="report-section" style={{ color: '#AABBC9' }}>
          <h1 className="report-title">
            {isFullAccess ? (locale === "zh" ? "综合测评报告" : "Comprehensive Report") : t.title}
          </h1>
          <p className="report-subtitle">{t.subtitle}</p>
          
          <div className="report-content mt-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-light-secondary mb-1">
                {locale === "zh" ? "今日气运节奏" : "Today's Qi Rhythm"}
              </div>
              {dayGanzhi && (
                <div className="font-serif font-bold text-light-highlight">
                  {locale === "zh" ? `当天干支为「${dayGanzhi}」` : `Day Ganzhi: ${dayGanzhi}`}
                </div>
              )}
              {!dayGanzhi && solarTerm && (
                <div className="font-serif font-bold text-light-highlight">
                  {locale === "zh" ? `今日节气为「${solarTerm}」` : `Solar Term: ${solarTerm}`}
                </div>
              )}
            </div>
            <div className="text-2xl opacity-30 text-light-highlight">☯</div>
          </div>
        </section>

        {/* 全局告警 */}
        {analysisWarnings.length > 0 && (
          <section className="report-section analysis-warning-card">
            <div className="report-content space-y-3">
              <div className="flex items-center gap-2 text-amber-200 text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.75 5v6.5h-1.5V7h1.5zm0 8.5v1.5h-1.5v-1.5h1.5z" />
                </svg>
                {locale === "zh" ? "图像质量提醒" : "Image Quality Notice"}
              </div>
              <ul className="analysis-warning-list">
                {analysisWarnings.map((warning) => (
                  <li key={warning.label}>
                    <strong className="mr-2">{warning.label}:</strong>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
              <p className="analysis-warning-hint">
                {locale === "zh"
                  ? "建议重新上传更清晰的照片以获得更精确的洞察。"
                  : "Try uploading clearer photos next time for a more precise analysis."}
              </p>
            </div>
          </section>
        )}

        {isFullAccess ? (
          <>
            <FiveAspectOverview
              data={fiveAspectData}
              delay={0.1}
              locale={locale}
              unlocked
            />
            <PalmistryBlock
              lifeLine={palmFullLines.lifeLine}
              wisdomLine={palmFullLines.wisdomLine}
              heartLine={palmFullLines.heartLine}
              wealthLine={palmFullLines.wealthLine}
              fullData={palmFullDataPayload}
              accessLevel="full"
              delay={0.15}
              locale={locale}
              reportId={report.id}
              notice={palmNotice}
            />
            <TongueBlock
              tongueColor={tongueFullContentPayload.summary}
              tongueCoating={
                rawTongueResult?.coating
                  ? (locale === "zh" ? `舌苔：${rawTongueResult.coating}` : `Tongue coating: ${rawTongueResult.coating}`)
                  : bodyTongue?.tongue_coating_signal ?? null
              }
              cracks={
                rawTongueResult?.texture === "cracked" || rawTongueResult?.shape === "cracked"
                  ? (locale === "zh" ? "有裂纹，提示津液亏虚。" : "Cracks present, indicating fluid deficiency.")
                  : null
              }
              swelling={
                rawTongueResult?.shape === "swollen" || rawTongueResult?.shape === "teethmark"
                  ? (locale === "zh"
                      ? rawTongueResult.shape === "swollen"
                        ? "舌体偏肿，提示脾虚水湿。"
                        : "舌边有齿痕，提示脾气不足。"
                      : rawTongueResult.shape === "swollen"
                      ? "Tongue is swollen, indicating spleen deficiency with dampness."
                      : "Teeth marks present, indicating spleen qi deficiency.")
                  : null
              }
              redPoints={
                rawTongueResult?.color === "red" || rawTongueResult?.color === "crimson" || rawTongueResult?.color === "purple"
                  ? (locale === "zh"
                      ? rawTongueResult.color === "purple"
                        ? "舌色偏紫，提示血瘀。"
                        : "舌色偏红，提示内热。"
                      : rawTongueResult.color === "purple"
                      ? "Purple tongue color indicates blood stasis."
                      : "Red tongue color indicates internal heat.")
                  : null
              }
              moisture={bodyTongue?.tongue_moisture_signal ?? bodyTongue?.moisture_pattern ?? null}
              temperatureTrend={bodyTongue?.heat_pattern ?? null}
              accessLevel="full"
              fullContent={tongueFullContentPayload}
              delay={0.2}
              locale={locale}
              reportId={report.id}
              notice={tongueNotice}
            />
            <DreamBlock
              dreamSummary={dreamBlock?.main_symbol?.detail ?? dreamBlock?.main_symbol?.summary ?? null}
              accessLevel="full"
              fullContent={dreamFullContentPayload}
              delay={0.25}
              locale={locale}
              reportId={report.id}
              notice={dreamNotice}
            />
            <CalendarAndStatusBlock
              date={report.created_at}
              solarTerm={solarTerm}
              dayGanzhi={dayGanzhi}
              todayYi={
                calendarData?.yi ??
                (report as any)?.normalized?.qi_rhythm?.calendar?.yi ??
                (report as any)?.qi_rhythm?.calendar?.yi ??
                qiBlock?.yi ??
                []
              }
              todayJi={
                calendarData?.ji ??
                (report as any)?.normalized?.qi_rhythm?.calendar?.ji ??
                (report as any)?.qi_rhythm?.calendar?.ji ??
                qiBlock?.ji ??
                []
              }
              bodyMindStatus={qiFullDetail}
              luckyHours={
                qiBlock?.lucky_hours ??
                (report as any)?.normalized?.qi_rhythm?.calendar?.lucky_hours ??
                (report as any)?.qi_rhythm?.calendar?.lucky_hours ??
                []
              }
              unluckyHours={
                qiBlock?.unlucky_hours ??
                (report as any)?.normalized?.qi_rhythm?.calendar?.unlucky_hours ??
                (report as any)?.qi_rhythm?.calendar?.unlucky_hours ??
                []
              }
              qiTrend={qiRhythm?.trendText ?? qiRhythm?.summary ?? null}
              qiAdvice={qiRhythm?.advice ?? qiRhythm?.suggestions ?? []}
              delay={0.3}
              locale={locale}
              isFullAccess
            />
          </>
        ) : (
          <>
            <FiveAspectOverview
              data={fiveAspectData}
              delay={0.1}
              locale={locale}
              unlocked={false}
            />
            <PalmistryBlock
              lifeLine={palmPreviewLines.lifeLine}
              wisdomLine={palmPreviewLines.wisdomLine}
              heartLine={palmPreviewLines.heartLine}
              wealthLine={palmPreviewLines.wealthLine}
              fullData={null}
              accessLevel="preview"
              delay={0.15}
              locale={locale}
              reportId={report.id}
              notice={palmNotice}
            />
            <TongueBlock
              tongueColor={tonguePreviewSummary}
              tongueCoating={null}
              cracks={null}
              swelling={null}
              redPoints={null}
              moisture={null}
              temperatureTrend={null}
              accessLevel="preview"
              fullContent={null}
              delay={0.2}
              locale={locale}
              reportId={report.id}
              notice={tongueNotice}
            />
            <DreamBlock
              dreamSummary={dreamPreviewSummary}
              accessLevel="preview"
              fullContent={null}
              delay={0.25}
              locale={locale}
              reportId={report.id}
              notice={dreamNotice}
            />
            <CalendarAndStatusBlock
              date={report.created_at}
              solarTerm={solarTerm}
              dayGanzhi={dayGanzhi}
              todayYi={[]}
              todayJi={[]}
              bodyMindStatus={qiPreviewSummary}
              luckyHours={null}
              unluckyHours={null}
              qiTrend={null}
              qiAdvice={null}
              delay={0.3}
              locale={locale}
              isFullAccess={false}
            />
            {showPaywall && (
              <motion.section
                variants={fadeUp(0.4)}
                initial="hidden"
                animate="visible"
                className="report-section paywall-section"
              >
                <div className="paywall-upgrade-card">
                  <div className="paywall-upgrade-header">
                    <span className="paywall-tag emphasize">
                      {locale === "zh" ? "完整报告" : "Full Report"}
                    </span>
                    <h3 className="paywall-panel-title">
                      {locale === "zh" ? "升级即可获得" : "Unlock to receive"}
                    </h3>
                  </div>
                  <ul className="paywall-list">
                    {proHighlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="paywall-price-row">
                    <div>
                      <p className="paywall-price-label">{locale === "zh" ? "解锁方式" : "Options"}</p>
                      <p className="paywall-price-main">{locale === "zh" ? "US$1.99 单次报告" : "US$1.99 per report"}</p>
                    </div>
                    <div className="paywall-chip-list">
                      {unlockPerks.map((perk) => (
                        <span key={perk}>{perk}</span>
                      ))}
                    </div>
                  </div>
                  <div className="paywall-action-row">
                    <button
                      type="button"
                      onClick={handleUnlockClick}
                      className="paywall-button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
                      </svg>
                      {locale === "zh"
                        ? "解锁完整报告 · 查看财富线与今日修身方案"
                        : "Unlock full report · detailed plan today"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUnlockClick}
                      className="paywall-secondary-link"
                    >
                      {locale === "zh" ? "改订 PRO（月/年）" : "Switch to PRO (monthly/yearly)"}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </>
        )}

        </motion.div>

        {/* 免责声明 */}
        <motion.section
          variants={fadeUp(0.45)}
          initial="hidden"
          animate="visible"
          className="disclaimer-area"
        >
          <p>{t.disclaimer}</p>
        </motion.section>
      </main>

      <footer>
        <p>
          {locale === "zh"
            ? "© 2025 SeeQi · 东方玄学洞察系统"
            : "© 2025 SeeQi · Eastern Insight System"}
        </p>
        <p>
          {locale === "zh"
            ? "本报告仅供东方象学学习参考，不构成医疗诊断或确定性预测。"
            : "For Eastern symbolism study only; not medical diagnosis or deterministic prediction."}
        </p>
      </footer>

      {/* 解锁 Modal */}
      {!isFullAccess && (
        <UnlockModal
          locale={locale}
          reportId={reportId}
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          isLoggedIn={isLoggedIn}
          currentUrl={currentUrl}
        />
      )}
      {/* 支付反馈 Toast */}
      {paymentFeedback && (
        <PaymentFeedbackToast feedback={paymentFeedback} onClose={() => setPaymentFeedback(null)} />
      )}
    </div>
    </>
  );
}

/**
 * 支付反馈 Toast 组件
 */
function PaymentFeedbackToast({
  feedback,
  onClose,
}: {
  feedback: { type: "error" | "success"; message: string };
  onClose: () => void;
}) {
  useEffect(() => {
    // 只有成功信息自动关闭，错误信息保持可见直到用户手动关闭
    if (feedback.type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // 错误信息不自动关闭，需要用户手动关闭
  }, [feedback.type, onClose]);

  return (
    <div className={`payment-feedback-toast payment-feedback-toast--${feedback.type}`}>
      <span>{feedback.message}</span>
      <button type="button" onClick={onClose} aria-label="关闭">
        ×
      </button>
      <style jsx>{`
        .payment-feedback-toast {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          padding: 0.85rem 1.2rem;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
          font-weight: 600;
          z-index: 2200;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 400px;
        }
        .payment-feedback-toast--success {
          background: rgba(141, 174, 146, 0.95);
          color: #0f2618;
        }
        .payment-feedback-toast--error {
          background: rgba(198, 105, 105, 0.95);
          color: #fff;
        }
        .payment-feedback-toast button {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
        }
        .payment-feedback-toast button:hover {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .payment-feedback-toast {
            left: 1rem;
            right: 1rem;
            max-width: none;
            bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
          }
        }
      `}</style>
    </div>
  );
}

