import type { PalmFeatureSummary } from "./palmFeatures";
import type { TongueFeatureSummary } from "./tongueFeatures";

type Locale = "zh" | "en";
type ShapeReason = "NOT_PALM" | "NOT_TONGUE" | "LOW_QUALITY" | "PARTIAL";
type ShapeLevel = "none" | "weak" | "good";

export interface ShapeCheckResult<T> {
  ok: boolean;
  level: ShapeLevel;
  reason?: ShapeReason;
  confidence?: number;
  result: T;
  warnings: string[];
  fallbackApplied: boolean;
}

interface ValidationOptions {
  locale?: Locale;
  message?: string;
  reasonCode?: string;
}

const PALM_MIN_QUALITY = 12;
const TONGUE_MIN_QUALITY = 12;

const PALM_FALLBACK_TEMPLATE: PalmFeatureSummary = {
  color: "pink",
  texture: "smooth",
  lines: {
    life: "shallow",
    heart: "curved",
    wisdom: "wavy",
  },
  qualityScore: 0,
};

const TONGUE_FALLBACK_TEMPLATE: TongueFeatureSummary = {
  color: "pale",
  coating: "thin",
  texture: "smooth",
  qualityScore: 0,
};

function clonePalmFallback(): PalmFeatureSummary {
  return {
    color: PALM_FALLBACK_TEMPLATE.color,
    texture: PALM_FALLBACK_TEMPLATE.texture,
    lines: { ...PALM_FALLBACK_TEMPLATE.lines },
    qualityScore: PALM_FALLBACK_TEMPLATE.qualityScore,
  };
}

function cloneTongueFallback(): TongueFeatureSummary {
  return {
    ...TONGUE_FALLBACK_TEMPLATE,
  };
}

function palmFallbackMessage(locale: Locale, reasonCode?: string): string {
  if (locale === "en") {
    switch (reasonCode) {
      case "NOT_PALM":
        return "Palm image could not be confirmed; using base estimation to continue.";
      case "BLURRY_PALM":
        return "Palm photo is too blurry; switched to a basic interpretation.";
      case "LOW_RESOLUTION":
        return "Palm photo resolution is too low; using baseline guidance.";
      default:
        return "Palm reading fell back to basic estimation due to image quality.";
    }
  }

  switch (reasonCode) {
    case "NOT_PALM":
      return "检测不到明确掌纹，已切换为基础判断，不影响整体流程。";
    case "BLURRY_PALM":
      return "掌纹照片过于模糊，已使用基础判断继续生成报告。";
    case "LOW_RESOLUTION":
      return "掌纹分辨率偏低，改用基础判断以便完成报告。";
    default:
      return "掌纹图像质量不足，已降级为基础判断以避免流程中断。";
  }
}

function tongueFallbackMessage(locale: Locale, reasonCode?: string): string {
  if (locale === "en") {
    switch (reasonCode) {
      case "NOT_TONGUE":
        return "Tongue image could not be verified; using base estimation to continue.";
      case "BLURRY_TONGUE":
        return "Tongue photo is blurry; switched to a basic interpretation.";
      case "LOW_RESOLUTION":
        return "Tongue photo resolution is too low; using baseline guidance.";
      default:
        return "Tongue reading fell back to basic estimation due to image quality.";
    }
  }

  switch (reasonCode) {
    case "NOT_TONGUE":
      return "检测不到舌象区域，已采用基础判断继续生成结果。";
    case "BLURRY_TONGUE":
      return "舌象照片清晰度不足，改用基础判断，不影响整体流程。";
    case "LOW_RESOLUTION":
      return "舌象分辨率偏低，自动切换为基础判断。";
    default:
      return "舌象图像质量不足，已降级为基础判断以保持流程稳定。";
  }
}

function scoreLevel(score: number | undefined, hasStructure: boolean): ShapeLevel {
  const normalized = score ?? 0;
  if (normalized >= 40) {
    return "good";
  }
  if (normalized >= 15 || hasStructure) {
    return "weak";
  }
  return "none";
}

function normalizeConfidence(score?: number): number | undefined {
  if (score === undefined || Number.isNaN(score)) {
    return undefined;
  }
  return Math.max(0, Math.min(1, score / 100));
}

export function isPalmShape(summary?: PalmFeatureSummary | null): boolean {
  if (!summary) {
    return false;
  }
  const scoreOk = (summary.qualityScore ?? 0) >= PALM_MIN_QUALITY;
  const hasKeyLines =
    Boolean(summary.lines?.life) || Boolean(summary.lines?.heart) || Boolean(summary.lines?.wisdom);
  return scoreOk || hasKeyLines;
}

export function isTongueShape(summary?: TongueFeatureSummary | null): boolean {
  if (!summary) {
    return false;
  }
  const scoreOk = (summary.qualityScore ?? 0) >= TONGUE_MIN_QUALITY;
  const hasSignals = Boolean(summary.color) && Boolean(summary.coating) && Boolean(summary.texture);
  return scoreOk || hasSignals;
}

function resolveReason(code?: string, kind?: "palm" | "tongue"): ShapeReason {
  if (kind === "palm" && code === "NOT_PALM") {
    return "NOT_PALM";
  }
  if (kind === "tongue" && code === "NOT_TONGUE") {
    return "NOT_TONGUE";
  }
  if (code) {
    return "LOW_QUALITY";
  }
  return "PARTIAL";
}

export function validatePalmShape(
  summary?: PalmFeatureSummary | null,
  options: ValidationOptions = {},
): ShapeCheckResult<PalmFeatureSummary> {
  const locale = options.locale ?? "zh";
  if (isPalmShape(summary)) {
    const score = summary?.qualityScore ?? 0;
    const hasStructure =
      Boolean(summary?.lines?.life) ||
      Boolean(summary?.lines?.heart) ||
      Boolean(summary?.lines?.wisdom);
    return {
      ok: true,
      result: summary!,
      warnings: [],
      fallbackApplied: false,
      level: scoreLevel(score, hasStructure),
      confidence: normalizeConfidence(score),
    };
  }

  const warning = options.message ?? palmFallbackMessage(locale, options.reasonCode);
  const reason = resolveReason(options.reasonCode, "palm");
  return {
    ok: false,
    result: clonePalmFallback(),
    warnings: warning ? [warning] : [],
    fallbackApplied: true,
    level: reason === "NOT_PALM" ? "none" : "weak",
    reason,
    confidence: 0.15,
  };
}

export function validateTongueShape(
  summary?: TongueFeatureSummary | null,
  options: ValidationOptions = {},
): ShapeCheckResult<TongueFeatureSummary> {
  const locale = options.locale ?? "zh";
  if (isTongueShape(summary)) {
    const score = summary?.qualityScore ?? 0;
    const level = scoreLevel(score, true);
    return {
      ok: true,
      result: summary!,
      warnings: [],
      fallbackApplied: false,
      level,
      confidence: normalizeConfidence(score),
    };
  }

  const warning = options.message ?? tongueFallbackMessage(locale, options.reasonCode);
  const reason = resolveReason(options.reasonCode, "tongue");
  return {
    ok: false,
    result: cloneTongueFallback(),
    warnings: warning ? [warning] : [],
    fallbackApplied: true,
    level: reason === "NOT_TONGUE" ? "none" : "weak",
    reason,
    confidence: 0.15,
  };
}

export function palmShape(
  summary?: PalmFeatureSummary | null,
  options?: ValidationOptions,
): ShapeCheckResult<PalmFeatureSummary> {
  return validatePalmShape(summary, options);
}

export function tongueShape(
  summary?: TongueFeatureSummary | null,
  options?: ValidationOptions,
): ShapeCheckResult<TongueFeatureSummary> {
  return validateTongueShape(summary, options);
}

