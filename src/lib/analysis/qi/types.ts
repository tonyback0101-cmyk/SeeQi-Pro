import type { ConstitutionType } from "@/lib/analysis/constitution";

export interface PalmInsight {
  summary?: string[]; // 分句后的 2–3 句
  bullets?: string[]; // 建议列表
  // 兼容旧数据
  life_rhythm?: string;
  emotion_pattern?: string;
  thought_style?: string;
  palm_overview_summary?: string;
  palm_advice?: string[];
}

export interface BodyTongue {
  qi_pattern?: string;
  energy_state?: string;
  body_trend?: string;
  health_care_advice?: string[];
  // 兼容旧数据
  summary?: string;
  suggestions?: string[];
  advice?: string[];
}

export interface DreamInsight {
  symbol?: string; // 象义说明
  mood?: string; // 心绪说明
  trend?: string; // 趋势 / 提醒
  suggestions?: string[]; // 2–3 条行动建议
  // 兼容旧数据
  ImageSymbol?: string;
  MindState?: string;
  Trend?: string;
  Advice?: string[];
  symbolic?: string;
  meaning?: string;
  psychological?: string;
  advice?: string[];
  actions?: string[];
}

export interface QiComponentsBreakdown {
  palm: number;
  tongue: number;
  dream: number;
  almanac: number;
  constitution: number;
}

export type QiTag = "升" | "稳" | "中" | "低";
export type QiTrend = "up" | "down" | "flat";

export interface QiRhythmV2 {
  index: number;
  trend: QiTrend; // 趋势方向（"up" | "down" | "flat"）
  tag: QiTag;
  // LLM 生成的简化字段（最终格式：summary + trend + advice）
  summary?: string;
  trendText?: string; // 趋势文本（LLM 生成，如"上午平稳，下午渐强..."）
  advice?: string[];
  // 兼容旧字段
  description?: string;
  suggestions?: string[];
  almanacHint?: string | null;
  components?: QiComponentsBreakdown;
  constitutionType?: ConstitutionType;
}
