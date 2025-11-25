import {
  PalmFeatureSummary,
  PalmLineSummary,
  PalmColor,
  PalmTexture,
} from "@/lib/analysis/palmFeatures";

export interface PalmLineSummaryExtended extends PalmLineSummary {
  fate?: "strong" | "weak" | "broken" | "none";
  money?: "clear" | "weak" | "broken" | "none";
}

/**
 * 掌纹线条洞察（用于生命纹、感情纹、智慧纹）
 */
export interface PalmLineInsight {
  description: string; // 线条特征描述
  interpretation: string; // 国学式解读
  advice?: string[]; // 建议（可选）
}

/**
 * 掌纹财富线洞察
 */
export interface PalmWealthInsight {
  level: "low" | "medium" | "high"; // 财富线强弱
  pattern: string; // 纹理特征：浅/深/断续/分叉
  risk: string[]; // 破财风险点描述
  potential: string[]; // 聚财途径
  summary: string; // 国学式总结一句话
}

/**
 * V2 掌纹分析结果结构
 */
export interface PalmResultV2 {
  life: PalmLineInsight; // 生命纹
  emotion: PalmLineInsight; // 感情纹
  wisdom: PalmLineInsight; // 智慧纹
  wealth: PalmWealthInsight; // 财富线
  meta: { qualityScore: number }; // 元数据
}

export interface PalmArchetype {
  vitality: "充沛" | "偏弱" | "阶段调整" | "中等";
  emotion_pattern: "细腻敏感" | "直接理性" | "情绪波动" | "分心矛盾" | "平和稳定";
  thinking_pattern:
    | "专注务实"
    | "点子多易分散"
    | "反复权衡"
    | "冲动决策"
    | "中庸思考";
  wealth_trend: "稳扎稳打" | "起伏较大" | "机会型" | "保守型" | "未显著表现";
  color_tag: string[];
  texture_tag: string[];
  career_trend?: string;
  relationship_trend?: string;
  palm_color_signal?: string;
  palm_texture_signal?: string;
  systemTags: string[];
}

type PalmInput = PalmFeatureSummary & {
  lines: PalmLineSummaryExtended;
};

function inferVitality(lines: PalmLineSummaryExtended): {
  vitality: PalmArchetype["vitality"];
  systemTags: string[];
} {
  const life = lines.life;

  if (life === "deep") {
    return { vitality: "充沛", systemTags: ["vitality_strong"] };
  }
  if (life === "shallow") {
    return { vitality: "偏弱", systemTags: ["vitality_low"] };
  }
  if (life === "broken") {
    return { vitality: "阶段调整", systemTags: ["vitality_transition"] };
  }

  return { vitality: "中等", systemTags: ["vitality_medium"] };
}

function inferEmotionPattern(lines: PalmLineSummaryExtended): {
  emotion_pattern: PalmArchetype["emotion_pattern"];
  systemTags: string[];
} {
  const heart = lines.heart;

  if (heart === "long" || heart === "curved") {
    return {
      emotion_pattern: "细腻敏感",
      systemTags: ["emotion_sensitivity"],
    };
  }
  if (heart === "short") {
    return {
      emotion_pattern: "直接理性",
      systemTags: ["emotion_direct"],
    };
  }
  if (heart === "curved" && lines.life === "broken") {
    return {
      emotion_pattern: "情绪波动",
      systemTags: ["emotion_fluctuation"],
    };
  }

  if ((lines as any).heart === "forked") {
    return {
      emotion_pattern: "分心矛盾",
      systemTags: ["emotion_split"],
    };
  }

  return {
    emotion_pattern: "平和稳定",
    systemTags: ["emotion_balanced"],
  };
}

function inferThinkingPattern(lines: PalmLineSummaryExtended): {
  thinking_pattern: PalmArchetype["thinking_pattern"];
  systemTags: string[];
} {
  const wisdom = lines.wisdom;

  if (wisdom === "clear") {
    return { thinking_pattern: "专注务实", systemTags: ["thinking_clear"] };
  }
  if (wisdom === "wavy") {
    return {
      thinking_pattern: "点子多易分散",
      systemTags: ["thinking_scattered"],
    };
  }
  if (wisdom === "broken") {
    return {
      thinking_pattern: "反复权衡",
      systemTags: ["thinking_hesitant"],
    };
  }

  return {
    thinking_pattern: "中庸思考",
    systemTags: ["thinking_neutral"],
  };
}

function inferWealthTrend(lines: PalmLineSummaryExtended): {
  wealth_trend: PalmArchetype["wealth_trend"];
  systemTags: string[];
} {
  const fate = lines.fate;
  const money = lines.money;

  if (fate === "broken" || money === "broken") {
    return {
      wealth_trend: "起伏较大",
      systemTags: ["wealth_fluctuating"],
    };
  }

  if (fate === "strong" && money === "weak") {
    return {
      wealth_trend: "机会型",
      systemTags: ["wealth_opportunity"],
    };
  }

  if (fate === "strong" || money === "clear") {
    return {
      wealth_trend: "稳扎稳打",
      systemTags: ["wealth_steady"],
    };
  }

  if (money === "weak" || money === "none") {
    return {
      wealth_trend: "保守型",
      systemTags: ["wealth_conservative"],
    };
  }

  return {
    wealth_trend: "未显著表现",
    systemTags: ["wealth_neutral"],
  };
}

function mapColorTags(color: PalmColor): {
  tags: string[];
  systemTags: string[];
} {
  switch (color) {
    case "pink":
      return {
        tags: ["气血相对平衡", "精力中等偏上"],
        systemTags: ["color_balanced"],
      };
    case "pale":
      return {
        tags: ["容易疲劳", "需要多给自己休息时间"],
        systemTags: ["color_low_energy"],
      };
    case "red":
      return {
        tags: ["火力偏旺", "情绪容易上头"],
        systemTags: ["color_fire_strong"],
      };
    case "dark":
      return {
        tags: ["思虑偏多", "压力感可能比较重"],
        systemTags: ["color_thought_heavy"],
      };
    default:
      return {
        tags: [],
        systemTags: [],
      };
  }
}

function mapTextureTags(texture: PalmTexture): {
  tags: string[];
  systemTags: string[];
} {
  switch (texture) {
    case "smooth":
      return {
        tags: ["想法细腻", "对细节比较敏感"],
        systemTags: ["texture_sensitive"],
      };
    case "dry":
      return {
        tags: ["容易紧绷", "需要刻意安排放松和补水"],
        systemTags: ["texture_tense"],
      };
    case "rough":
      return {
        tags: ["行动力强", "容易硬扛不求助"],
        systemTags: ["texture_push_hard"],
      };
    default:
      return {
        tags: [],
        systemTags: [],
      };
  }
}

function inferCareerTrend(lines: PalmLineSummaryExtended): {
  career_trend?: string;
  systemTags: string[];
} {
  const fate = lines.fate;
  const money = lines.money;

  if (fate === "broken") {
    return { career_trend: "事业处在调整期，适合慢慢过渡", systemTags: ["career_transition"] };
  }
  if (fate === "strong" && money !== "broken") {
    return { career_trend: "事业正走在稳定上升中", systemTags: ["career_upbeat"] };
  }
  if (money === "weak" || money === "none") {
    return { career_trend: "资源偏紧，先稳住主线任务", systemTags: ["career_conservative"] };
  }
  if (money === "clear") {
    return { career_trend: "资源流入平稳，可按计划推进", systemTags: ["career_balanced"] };
  }
  return { systemTags: [] };
}

function inferRelationshipTrend(
  lines: PalmLineSummaryExtended,
  emotionPattern: PalmArchetype["emotion_pattern"],
): {
  relationship_trend?: string;
  systemTags: string[];
} {
  if (emotionPattern === "细腻敏感") {
    return { relationship_trend: "关系感知敏锐，适合多表达", systemTags: ["relationship_sensitive"] };
  }
  if (emotionPattern === "直接理性") {
    return { relationship_trend: "沟通直接，注意留些缓冲", systemTags: ["relationship_direct"] };
  }
  if (emotionPattern === "情绪波动") {
    return { relationship_trend: "关系起伏感较明显，宜放慢", systemTags: ["relationship_wave"] };
  }
  if (lines.heart === "curved") {
    return { relationship_trend: "共情力强，适合照顾重要的人", systemTags: ["relationship_empathy"] };
  }
  return { systemTags: [] };
}

function mapColorSignal(color: PalmColor): string | undefined {
  switch (color) {
    case "pink":
      return "气色温润，适合循序推进";
    case "pale":
      return "气色偏淡，多给自己保养时间";
    case "red":
      return "气色偏热，记得慢下来降火";
    case "dark":
      return "气色偏暗，表明压力较大";
    default:
      return undefined;
  }
}

function mapTextureSignal(texture: PalmTexture): string | undefined {
  switch (texture) {
    case "smooth":
      return "掌质细腻，感受敏感、想法多";
    case "dry":
      return "掌质偏干，提醒你补水与休息";
    case "rough":
      return "掌质偏粗，说明行动力强但易硬扛";
    default:
      return undefined;
  }
}

/**
 * 根据线条特征生成生命纹洞察
 */
function buildLifeLineInsight(
  life: "deep" | "shallow" | "broken" | undefined,
  locale: "zh" | "en" = "zh",
): PalmLineInsight {
  if (life === "deep") {
    return {
      description: locale === "zh" ? "生命纹深长清晰" : "Life line is deep and clear",
      interpretation:
        locale === "zh"
          ? "纹路尚清，早岁略虚，后半程有回升之势。"
          : "Lines are clear; early years slightly weak, with recovery in later stages.",
      advice:
        locale === "zh"
          ? ["保持规律作息，后半程可适当增加运动强度"]
          : ["Maintain regular routine, can increase exercise intensity in later stages"],
    };
  }
  if (life === "shallow") {
    return {
      description: locale === "zh" ? "生命纹浅淡" : "Life line is shallow",
      interpretation:
        locale === "zh"
          ? "纹路尚清，早岁略虚，后半程有回升之势。"
          : "Lines are clear; early years slightly weak, with recovery in later stages.",
      advice:
        locale === "zh"
          ? ["注意休息，避免过度消耗，后半程可适当增加运动强度"]
          : ["Pay attention to rest, avoid overexertion, can increase exercise intensity in later stages"],
    };
  }
  if (life === "broken") {
    return {
      description: locale === "zh" ? "生命纹断续" : "Life line is broken",
      interpretation:
        locale === "zh"
          ? "纹路有断续，主阶段调整，需注意身体变化。"
          : "Lines are broken, indicating stage adjustments, need to pay attention to physical changes.",
      advice:
        locale === "zh"
          ? ["关注身体信号，适时调整生活节奏"]
          : ["Pay attention to body signals, adjust life rhythm in time"],
    };
  }
  return {
    description: locale === "zh" ? "生命纹未显著" : "Life line not prominent",
    interpretation:
      locale === "zh"
        ? "纹路尚清，早岁略虚，后半程有回升之势。"
        : "Lines are clear; early years slightly weak, with recovery in later stages.",
  };
}

/**
 * 根据线条特征生成感情纹洞察
 */
function buildEmotionLineInsight(
  heart: "long" | "short" | "curved" | undefined,
  locale: "zh" | "en" = "zh",
): PalmLineInsight {
  if (heart === "long" || heart === "curved") {
    return {
      description: locale === "zh" ? "感情纹较长或弯曲" : "Heart line is long or curved",
      interpretation:
        locale === "zh"
          ? "尾端略有分支，情感上易多思，宜坦诚沟通。"
          : "Slight branching at the end; emotionally prone to overthinking, should communicate openly.",
      advice:
        locale === "zh"
          ? ["多表达真实感受，避免过度思虑"]
          : ["Express true feelings more, avoid overthinking"],
    };
  }
  if (heart === "short") {
    return {
      description: locale === "zh" ? "感情纹较短" : "Heart line is short",
      interpretation:
        locale === "zh"
          ? "感情纹较短，情感表达直接，宜坦诚沟通。"
          : "Heart line is short; emotional expression is direct, should communicate openly.",
      advice:
        locale === "zh"
          ? ["注意留些缓冲，避免过于直接"]
          : ["Leave some buffer, avoid being too direct"],
    };
  }
  return {
    description: locale === "zh" ? "感情纹未显著" : "Heart line not prominent",
    interpretation:
      locale === "zh"
        ? "尾端略有分支，情感上易多思，宜坦诚沟通。"
        : "Slight branching at the end; emotionally prone to overthinking, should communicate openly.",
  };
}

/**
 * 根据线条特征生成智慧纹洞察
 */
function buildWisdomLineInsight(
  wisdom: "clear" | "wavy" | "broken" | undefined,
  locale: "zh" | "en" = "zh",
): PalmLineInsight {
  if (wisdom === "clear") {
    return {
      description: locale === "zh" ? "智慧纹清晰" : "Wisdom line is clear",
      interpretation:
        locale === "zh"
          ? "智慧纹清晰，思维专注务实，决策较为果断。"
          : "Wisdom line is clear; thinking is focused and practical, decisions are relatively decisive.",
      advice:
        locale === "zh"
          ? ["保持专注，避免分散注意力"]
          : ["Stay focused, avoid distractions"],
    };
  }
  if (wisdom === "wavy") {
    return {
      description: locale === "zh" ? "智慧纹波浪状" : "Wisdom line is wavy",
      interpretation:
        locale === "zh"
          ? "智慧纹波浪状，点子多易分散，需注意聚焦。"
          : "Wisdom line is wavy; many ideas but easily distracted, need to focus.",
      advice:
        locale === "zh"
          ? ["整理思路，优先处理重要事项"]
          : ["Organize thoughts, prioritize important matters"],
    };
  }
  if (wisdom === "broken") {
    return {
      description: locale === "zh" ? "智慧纹断续" : "Wisdom line is broken",
      interpretation:
        locale === "zh"
          ? "智慧纹断续，思维反复权衡，需注意决策效率。"
          : "Wisdom line is broken; thinking is hesitant, need to pay attention to decision efficiency.",
      advice:
        locale === "zh"
          ? ["避免过度权衡，适时做出决定"]
          : ["Avoid excessive weighing, make decisions in time"],
    };
  }
  return {
    description: locale === "zh" ? "智慧纹未显著" : "Wisdom line not prominent",
    interpretation:
      locale === "zh"
        ? "智慧纹中庸，思维平衡，决策较为稳妥。"
        : "Wisdom line is moderate; thinking is balanced, decisions are relatively stable.",
  };
}

/**
 * 根据掌纹特征生成财富线洞察
 */
function buildWealthInsight(
  lines: PalmLineSummaryExtended,
  wealthLineText?: string,
  locale: "zh" | "en" = "zh",
): PalmWealthInsight {
  const money = lines.money;
  const fate = lines.fate;
  const wealth = lines.wealth;

  // 根据财富线特征判断强弱
  let level: "low" | "medium" | "high" = "medium";
  let pattern = "";
  const risk: string[] = [];
  const potential: string[] = [];

  // 分析财富线强弱
  if (money === "clear" || fate === "strong") {
    level = "high";
    pattern = locale === "zh" ? "深且清晰" : "deep and clear";
    potential.push(
      locale === "zh"
        ? "通过稳健经营积累财富"
        : "Accumulate wealth through stable management",
    );
    potential.push(
      locale === "zh"
        ? "把握长期投资机会"
        : "Seize long-term investment opportunities",
    );
  } else if (money === "weak" || money === "none") {
    level = "low";
    pattern = locale === "zh" ? "浅或未显著" : "shallow or not prominent";
    risk.push(
      locale === "zh"
        ? "避免高风险投资"
        : "Avoid high-risk investments",
    );
    risk.push(
      locale === "zh"
        ? "注意控制消费冲动"
        : "Pay attention to controlling consumption impulses",
    );
    potential.push(
      locale === "zh"
        ? "通过勤奋工作积累"
        : "Accumulate through hard work",
    );
  } else if (money === "broken" || fate === "broken") {
    level = "low";
    pattern = locale === "zh" ? "断续" : "broken";
    risk.push(
      locale === "zh"
        ? "财富波动较大，需谨慎理财"
        : "Wealth fluctuations are large, need careful financial management",
    );
    risk.push(
      locale === "zh"
        ? "避免冲动性大额支出"
        : "Avoid impulsive large expenses",
    );
    potential.push(
      locale === "zh"
        ? "通过稳健理财逐步积累"
        : "Gradually accumulate through stable financial management",
    );
  } else {
    level = "medium";
    pattern = locale === "zh" ? "中等" : "medium";
    potential.push(
      locale === "zh"
        ? "通过稳健经营积累财富"
        : "Accumulate wealth through stable management",
    );
  }

  // 如果有财富线文本描述，使用它；否则根据特征生成
  let summary = "";
  if (wealthLineText) {
    summary = wealthLineText;
  } else {
    summary =
      locale === "zh"
        ? "财帛纹略浅偏直，属'勤聚缓发'之象，宜重视稳健经营，少赌多积。"
        : "Wealth lines are slightly shallow and straight, indicating 'steady accumulation and gradual growth'; should focus on stable management, less gambling, more accumulation.";
  }

  return {
    level,
    pattern,
    risk,
    potential,
    summary,
  };
}

/**
 * 构建 V2 掌纹分析结果
 */
export function buildPalmResultV2(
  input: PalmInput,
  wealthLineText?: string,
  locale: "zh" | "en" = "zh",
): PalmResultV2 {
  const { lines, qualityScore } = input;

  return {
    life: buildLifeLineInsight(lines.life, locale),
    emotion: buildEmotionLineInsight(lines.heart, locale),
    wisdom: buildWisdomLineInsight(lines.wisdom, locale),
    wealth: buildWealthInsight(lines as PalmLineSummaryExtended, wealthLineText, locale),
    meta: { qualityScore: qualityScore ?? 0 },
  };
}

export function buildPalmArchetype(input: PalmInput): PalmArchetype {
  const { lines, color, texture } = input;

  const vitalityRes = inferVitality(lines);
  const emotionRes = inferEmotionPattern(lines);
  const thinkingRes = inferThinkingPattern(lines);
  const wealthRes = inferWealthTrend(lines);
  const careerRes = inferCareerTrend(lines);
  const relationshipRes = inferRelationshipTrend(lines, emotionRes.emotion_pattern);

  const colorRes = mapColorTags(color);
  const textureRes = mapTextureTags(texture);
  const colorSignal = mapColorSignal(color);
  const textureSignal = mapTextureSignal(texture);

  const systemTags = [
    ...vitalityRes.systemTags,
    ...emotionRes.systemTags,
    ...thinkingRes.systemTags,
    ...wealthRes.systemTags,
    ...colorRes.systemTags,
    ...textureRes.systemTags,
    ...careerRes.systemTags,
    ...relationshipRes.systemTags,
  ];

  return {
    vitality: vitalityRes.vitality,
    emotion_pattern: emotionRes.emotion_pattern,
    thinking_pattern: thinkingRes.thinking_pattern,
    wealth_trend: wealthRes.wealth_trend,
    color_tag: colorRes.tags,
    texture_tag: textureRes.tags,
    career_trend: careerRes.career_trend,
    relationship_trend: relationshipRes.relationship_trend,
    palm_color_signal: colorSignal,
    palm_texture_signal: textureSignal,
    systemTags,
  };
}

