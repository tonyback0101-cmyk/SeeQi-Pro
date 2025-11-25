import type { ConstitutionType } from "./types";

/**
 * 体质 V2 配置（冻结版）
 * 说明：
 * - 所有权重、区间做集中管理，避免散落在多个函数里。
 * - 后续只允许改这个文件做调参，不直接改 inferConstitutionV2 逻辑。
 */

// 打分权重：掌纹 / 舌苔 / 梦境
export const CONSTITUTION_WEIGHTS = {
  palm: 0.3,
  tongue: 0.35,
  dream: 0.35,
} as const;

// 体质区间配置：score ∈ [min, max)，按从高到低顺序匹配
export const CONSTITUTION_THRESHOLDS: Array<{
  type: ConstitutionType;
  min: number;
  max: number;
}> = [
  { type: "high_vitality", min: 85, max: 101 },
  { type: "ascending_flow", min: 78, max: 85 },
  { type: "grounded_steady", min: 72, max: 78 },
  { type: "steady_build", min: 68, max: 72 },
  { type: "easy_flow", min: 63, max: 68 },
  { type: "mental_overclock", min: 58, max: 63 },
  { type: "underlight_pressure", min: 52, max: 58 },
  { type: "emotional_surge", min: 46, max: 52 },
  { type: "social_drain", min: 40, max: 46 },
  { type: "thought_heavy", min: 35, max: 40 },
  { type: "mild_fatigue", min: 28, max: 35 },
  { type: "low_heart_qi", min: 0, max: 28 },
];

export const CONSTITUTION_SCORE_PRECISION = 2;


