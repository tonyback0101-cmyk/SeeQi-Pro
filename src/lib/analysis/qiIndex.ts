type Trend = "up" | "stable" | "down";
type Level = "low" | "medium" | "high";

type PalmInput = {
  qualityScore?: number | null;
  color?: string | null;
  texture?: string | null;
  lines?: Record<string, string | undefined> | null;
};

type TongueInput = {
  qualityScore?: number | null;
  color?: string | null;
  coating?: string | null;
  texture?: string | null;
};

type DreamInput = {
  emotion?: string | null;
  keywords?: string[] | null;
};

type SolarInput = {
  code?: string | null;
  name?: string | null;
  element?: string | null;
};

export type QiIndexInputs = {
  constitution?: string | null;
  palm?: PalmInput | null;
  tongue?: TongueInput | null;
  dream?: DreamInput | null;
  solar?: SolarInput | null;
  matchedRules?: string[] | null;
};

export type QiIndexBreakdown = {
  total: number;
  vitality: number;
  harmony: number;
  mindset: number;
  trend: Trend;
  level: Level;
  advice: string[];
  factors: Array<{
    key: string;
    weight: number;
    impact: number;
    message: string;
  }>;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const constitutionWeights: Record<string, number> = {
  平和: 8,
  平和体质: 8,
  阳虚: -6,
  阳虚体质: -6,
  阴虚: -4,
  阴虚体质: -4,
  湿热: -5,
  湿热体质: -5,
  痰湿: -3,
  痰湿体质: -3,
  气郁: -2,
  气郁体质: -2,
  血瘀: -4,
  血瘀体质: -4,
};

const dreamEmotionMap: Record<string, number> = {
  焦虑: -8,
  紧张: -6,
  忧郁: -5,
  急躁: -4,
  自由: 5,
  希望: 6,
  喜悦: 8,
  平静: 4,
};

const dreamKeywordBonuses: Record<string, number> = {
  彩虹: 5,
  飞翔: 4,
  花: 3,
};

const coatingImpact: Record<string, number> = {
  none: -6,
  薄: 2,
  thin: 2,
  厚: -4,
  thick: -4,
  yellow: -5,
  黏腻: -6,
};

const solarElementBoost: Record<string, number> = {
  木: 3,
  火: 2,
  土: 1,
  金: -1,
  水: -2,
};

const QUALITY_FALLBACK = 62;

function resolveQuality(score?: number | null) {
  if (typeof score === "number" && Number.isFinite(score)) {
    return clamp(score);
  }
  return QUALITY_FALLBACK;
}

function resolveConstitutionBonus(constitution?: string | null) {
  if (!constitution) return 0;
  const normalized = constitution.trim();
  return constitutionWeights[normalized] ?? constitutionWeights[normalized.replace(/体质$/, "")] ?? 0;
}

function computeVitality(inputs: QiIndexInputs, advice: string[], factors: QiIndexBreakdown["factors"]) {
  const quality = resolveQuality(inputs.palm?.qualityScore);
  const constitutionBonus = resolveConstitutionBonus(inputs.constitution);
  let score = quality * 0.6 + 40;
  score += constitutionBonus;

  if (inputs.palm?.color) {
    if (["pink", "ruddy", "红润", "粉红"].includes(inputs.palm.color)) {
      score += 4;
      advice.push("保持良好血运，可适当增加耐力训练");
    } else if (["pale", "苍白", "暗"].includes(inputs.palm.color)) {
      score -= 5;
      advice.push("手掌偏淡建议注意保暖与补气");
    }
  }

  if (inputs.palm?.texture) {
    if (["smooth", "细腻", "温润"].includes(inputs.palm.texture)) {
      score += 3;
    } else if (["dry", "粗糙", "皲裂"].includes(inputs.palm.texture)) {
      score -= 4;
      advice.push("手部偏干，可注意补水与睡前热敷");
    }
  }

  if (inputs.palm?.lines?.heart === "broken") {
    score -= 2;
    advice.push("情绪波动略高，建议安排放松时段");
  }

  const finalScore = clamp(Math.round(score));
  factors.push({
    key: "vitality",
    weight: 0.4,
    impact: finalScore,
    message: `手掌质地与体质贡献 ${finalScore} 分`,
  });

  return finalScore;
}

function computeHarmony(inputs: QiIndexInputs, advice: string[], factors: QiIndexBreakdown["factors"]) {
  const quality = resolveQuality(inputs.tongue?.qualityScore);
  let score = quality * 0.55 + 35;

  if (inputs.tongue?.color) {
    if (["pale", "淡红", "淡白"].includes(inputs.tongue.color)) {
      score -= 3;
      advice.push("舌色偏淡，注意脾胃调理与早睡");
    } else if (["red", "红", "鲜红"].includes(inputs.tongue.color)) {
      score -= 2;
      advice.push("舌色偏红，适当清淡饮食、少辣少酒");
    }
  }

  if (inputs.tongue?.coating) {
    const coating = inputs.tongue.coating.toLowerCase();
    score += coatingImpact[coating] ?? 0;
    if (coatingImpact[coating] && coatingImpact[coating] < 0) {
      advice.push("舌苔提示湿热或津液不足，可增加温水摄入与蔬果");
    }
  }

  const solarBonus = inputs.solar?.element ? solarElementBoost[inputs.solar.element] ?? 0 : 0;
  score += solarBonus;

  const finalScore = clamp(Math.round(score));
  factors.push({
    key: "harmony",
    weight: 0.35,
    impact: finalScore,
    message: `舌象与节气平衡贡献 ${finalScore} 分`,
  });

  return finalScore;
}

function computeMindset(inputs: QiIndexInputs, advice: string[], factors: QiIndexBreakdown["factors"]) {
  let score = 68;

  const emotion = inputs.dream?.emotion;
  if (emotion) {
    score += dreamEmotionMap[emotion] ?? 0;
    if (dreamEmotionMap[emotion] && dreamEmotionMap[emotion] < 0) {
      advice.push("梦境情绪偏紧绷，建议安排轻度冥想或呼吸练习");
    }
  }

  const keywords = inputs.dream?.keywords ?? [];
  keywords.forEach((keyword) => {
    const bonus = dreamKeywordBonuses[keyword];
    if (bonus) {
      score += bonus;
      advice.push("积极梦境提示心态良好，保持乐观可进一步提升气场");
    }
  });

  if ((inputs.matchedRules ?? []).some((ruleId) => ruleId.includes("stress") || ruleId.includes("pressure"))) {
    score -= 4;
    advice.push("规则判断压力偏高，可安排舒缓身心的日常仪式感");
  }

  const finalScore = clamp(Math.round(score));
  factors.push({
    key: "mindset",
    weight: 0.25,
    impact: finalScore,
    message: `梦境与情绪状态贡献 ${finalScore} 分`,
  });

  return finalScore;
}

function resolveTrend(total: number, harmony: number) {
  if (total >= 75 && harmony >= 70) return "up";
  if (total <= 55 && harmony < 60) return "down";
  return "stable";
}

function resolveLevel(total: number): Level {
  if (total >= 75) return "high";
  if (total >= 60) return "medium";
  return "low";
}

export function computeQiIndex(inputs: QiIndexInputs): QiIndexBreakdown {
  const advice: string[] = [];
  const factors: QiIndexBreakdown["factors"] = [];

  const vitality = computeVitality(inputs, advice, factors);
  const harmony = computeHarmony(inputs, advice, factors);
  const mindset = computeMindset(inputs, advice, factors);

  const total = clamp(Math.round(vitality * 0.4 + harmony * 0.4 + mindset * 0.2));
  const trend = resolveTrend(total, harmony);
  const level = resolveLevel(total);

  if (level === "low") {
    advice.unshift("整体气指数偏低，建议保证充足睡眠并保持固定作息");
  } else if (level === "medium") {
    advice.unshift("气指数处于中等水平，可通过规律运动逐步提升");
  } else {
    advice.unshift("气指数良好，继续保持当前的生活节奏与饮食模式");
  }

  const uniqueAdvice = Array.from(new Set(advice)).slice(0, 6);

  return {
    total,
    vitality,
    harmony,
    mindset,
    trend,
    level,
    advice: uniqueAdvice,
    factors,
  };
}

