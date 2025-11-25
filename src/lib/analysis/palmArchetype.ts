import type { PalmFeatureSummary } from "@/lib/analysis/palmFeatures";

export type PalmArchetypeId =
  | "steady_rooted"
  | "fiery_sprinter"
  | "sensitive_empath"
  | "adaptive_mind";

export interface PalmArchetypeProfile {
  id: PalmArchetypeId;
  name: { zh: string; en: string };
  summary: { zh: string; en: string };
  cues: string[];
}

const ARCHETYPES: Record<PalmArchetypeId, PalmArchetypeProfile> = {
  steady_rooted: {
    id: "steady_rooted",
    name: { zh: "稳根型", en: "Steady Rooted" },
    summary: {
      zh: "底盘扎实，擅长按部就班推进，重视节奏感与长期耐力。",
      en: "Grounded pace with reliable stamina, preferring steady, sequenced progress.",
    },
    cues: ["life line 结实", "掌色粉润/偏白", "纹理细密"],
  },
  fiery_sprinter: {
    id: "fiery_sprinter",
    name: { zh: "火力型", en: "Fiery Sprinter" },
    summary: {
      zh: "行动力旺，有冲劲也容易燃尽，需要留白与降温。",
      en: "High initiative and urgency; thrives on bursts but needs buffers to avoid burnout.",
    },
    cues: ["掌色偏红/暗", "生命线深", "纹理偏干"],
  },
  sensitive_empath: {
    id: "sensitive_empath",
    name: { zh: "感应型", en: "Sensitive Empath" },
    summary: {
      zh: "心绪细腻、共感力强，容易被外界氛围牵引，需要柔性边界。",
      en: "Attentive to emotions and atmospheres; benefits from gentle boundaries and pacing.",
    },
    cues: ["感情线较长或弯", "掌色偏淡", "财富线细腻"],
  },
  adaptive_mind: {
    id: "adaptive_mind",
    name: { zh: "机动型", en: "Adaptive Mind" },
    summary: {
      zh: "思路多变，擅长多线切换，但易分心，需要重建专注节奏。",
      en: "Flexible thinker who juggles multiple threads—requires focus rituals to stay centered.",
    },
    cues: ["智慧线波动/断续", "掌纹粗糙", "多分叉"],
  },
};

const DEFAULT_ARCHETYPE = ARCHETYPES.steady_rooted;

export function derivePalmArchetype(features?: PalmFeatureSummary | null): PalmArchetypeProfile {
  if (!features) return DEFAULT_ARCHETYPE;

  const { color, texture, lines } = features;

  const isFiery =
    color === "red" ||
    color === "dark" ||
    texture === "dry" ||
    lines.life === "deep" ||
    (lines.wealth && /深|直|挺/.test(lines.wealth));

  if (isFiery) {
    return ARCHETYPES.fiery_sprinter;
  }

  const isSensitive =
    color === "pale" ||
    lines.heart === "long" ||
    lines.heart === "curved" ||
    (lines.wealth && /细|曲/.test(lines.wealth ?? ""));

  if (isSensitive) {
    return ARCHETYPES.sensitive_empath;
  }

  const isAdaptive =
    texture === "rough" ||
    lines.wisdom === "wavy" ||
    lines.wisdom === "broken" ||
    lines.life === "broken";

  if (isAdaptive) {
    return ARCHETYPES.adaptive_mind;
  }

  return ARCHETYPES.steady_rooted;
}

