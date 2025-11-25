import type { QiTag, QiTrend } from "./types";

/**
 * 气运 V2 配置（冻结版）
 * - 所有权重、区间、标签映射集中管理
 * - 调参只允许修改此文件，避免在引擎里散落魔法数字
 */

export const QI_WEIGHTS = {
  palm: 0.1,
  tongue: 0.25,
  dream: 0.4,
  almanac: 0.2,
} as const;

export const QI_INDEX_RANGE = {
  min: 0,
  max: 100,
} as const;

export const QI_TAG_THRESHOLDS: Array<{ tag: QiTag; min: number; max: number }> = [
  { tag: "升", min: 75, max: 101 },
  { tag: "稳", min: 55, max: 75 },
  { tag: "中", min: 36, max: 55 },
  { tag: "低", min: 0, max: 36 },
] as const;

export const QI_TREND_BY_TAG: Record<QiTag, QiTrend> = {
  升: "up",
  稳: "flat",
  中: "flat",
  低: "down",
};
