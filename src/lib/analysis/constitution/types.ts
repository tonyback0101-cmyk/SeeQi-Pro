export type ConstitutionType =
  | "emotional_surge"
  | "mental_overclock"
  | "grounded_steady"
  | "social_drain"
  | "thought_heavy"
  | "mild_fatigue"
  | "low_heart_qi"
  | "underlight_pressure"
  | "ascending_flow"
  | "steady_build"
  | "easy_flow"
  | "high_vitality";

export interface ConstitutionMeta {
  id: ConstitutionType;
  name: string;
  en: string;
  brief: string;
  feature: string[];
  advice: string[];
  adviceSummary: string;
  qiEffect: number;
}

export interface ConstitutionRuleInput {
  palmInsight: string;
  tongueInsight: string;
  dreamInsight: string;
}

export interface ConstitutionSummary {
  type: ConstitutionType;
  name: string;
  name_en: string;
  brief: string;
  feature: string[];
  adviceSummary: string;
  qiEffect: number;
}

