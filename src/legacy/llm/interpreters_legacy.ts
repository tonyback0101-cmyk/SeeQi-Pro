/**
 * LLM 解读服务
 * 用于掌纹、舌苔、梦境的解读
 */

import { createLLMService, parseJSONResponse } from "./service";
import type { PalmArchetype } from "@/lib/analysis/palmRulesV2";
import { buildDreamArchetypeFromText, type DreamArchetype } from "@/lib/analysis/dreamRulesV2";
import type { TongueFeatureSummary } from "@/lib/analysis/tongueFeatures";
import type { TongueStateTags } from "@/lib/analysis/tongueRulesV2";

type Locale = "zh" | "en";

interface PalmInsight {
  life_rhythm: string;
  emotion_pattern: string;
  thought_style: string;
  palm_overview_summary: string;
  palm_advice: string[];
}

interface TongueInsight {
  summary: string;
  energy_state: string;
  body_trend: string;
  moisture_pattern: string;
  heat_pattern: string;
  digestive_trend: string;
  special_signs: string[];
  advice: string[];
}

interface DreamInsight {
  ImageSymbol: string;
  MindState: string;
  Trend: string;
  Advice: string[];
  // 兼容旧数据
  symbolic?: string;
  psychological?: string;
  trend?: string;
  actions?: string[];
}

interface ConstitutionInsight {
  constitution_type: string;
  description_paragraphs: string[];
  constitution_advice: string[];
}

interface QiRhythmInsight {
  summary: string;
  trend: string;
  advice: string[];
}

type TongueArchetypeInput = Parameters<typeof inferTongueArchetype>[0];

function mapTongueFeaturesToArchetypeInput(
  features: TongueFeatureSummary,
): TongueArchetypeInput {
  const bodyColorMap: Record<TongueFeatureSummary["color"], TongueArchetypeInput["bodyColor"]> = {
    pale: "light-red",
    red: "red",
    purple: "purple",
  };

  const bodyColor = bodyColorMap[features.color] ?? "red";

  const coatingColor: TongueArchetypeInput["coatingColor"] =
    features.coating === "yellow"
      ? "yellow"
      : features.coating === "none"
        ? "none"
        : "white";

  let coatingThickness: TongueArchetypeInput["coatingThickness"] = "thin";
  if (features.coating === "thick") {
    coatingThickness = "thick";
  } else if (features.coating === "thin") {
    coatingThickness = "thin";
  }

  const moisture: TongueArchetypeInput["moisture"] =
    features.texture === "cracked" ? "dry" : "moist";

  return {
    bodyColor,
    coatingColor,
    coatingThickness,
    moisture,
    teethMarks: false,
  };
}

/**
 * 掌纹 LLM 解读
 */
export async function interpretPalmWithLLM(
  palmArchetype: PalmArchetype,
  locale: Locale,
): Promise<PalmInsight> {
  const llm = createLLMService();
  if (!llm) {
    return getFallbackPalmInsight(palmArchetype, locale);
  }

  const archetype = palmArchetype;

  const systemPrompt =
    locale === "zh"
      ? `你是一位“东方掌纹象意 × 温柔幽默”风格的解读者。请根据给定标签输出 JSON：
1. summary：融合 vitality + emotion_pattern + thinking_pattern，用 1 段话描述今日能量/情绪/思维节奏，语气温柔、有一点幽默，不谈疾病或心理测验。
2. bullets：2-4 条条列建议，参考 career_trend、wealth_trend、relationship_trend、palm_color_signal、palm_texture_signal、mounts_insight，建议示例：喝温水/放慢脚步/清爽饮食/分段推进。禁止医学诊断、禁止寿命预测。
只能依据输入标签，不得自创信息。`
      : `You are an "Eastern palm symbolism × gentle humor" interpreter. Based on the given tags, output JSON:
1. summary: weave vitality + emotion_pattern + thinking_pattern into one paragraph describing today's energy/emotion/thinking tone. Keep it light, warm, slightly witty, no medical or personality-test wording.
2. bullets: list 2-4 actionable tips inspired by career_trend, wealth_trend, relationship_trend, palm_color_signal, palm_texture_signal, mounts_insight (e.g., sip warm water, pace down, tidy priorities). Never mention diseases or lifespan. Use only supplied tags.`;

  const tagBlockZh = [
    `生命力：${archetype.vitality}`,
    `情绪：${archetype.emotion_pattern}`,
    `思维：${archetype.thinking_pattern}`,
    `事业：${archetype.career_trend}`,
    `财富：${archetype.wealth_trend}`,
    `关系：${archetype.relationship_trend}`,
    `掌色提示：${archetype.palm_color_signal}`,
    `掌纹质地：${archetype.palm_texture_signal}`,
    `掌丘象意：${archetype.mounts_insight.join("；") || "中性"}`,
  ].join("\n");

  const tagBlockEn = [
    `Vitality: ${archetype.vitality}`,
    `Emotion: ${archetype.emotion_pattern}`,
    `Thinking: ${archetype.thinking_pattern}`,
    `Career: ${archetype.career_trend}`,
    `Wealth: ${archetype.wealth_trend}`,
    `Relationship: ${archetype.relationship_trend}`,
    `Color signal: ${archetype.palm_color_signal}`,
    `Texture signal: ${archetype.palm_texture_signal}`,
    `Mounts: ${archetype.mounts_insight.join("; ") || "Neutral"}`,
  ].join("\n");

  const userPrompt = locale === "zh"
    ? `掌纹标签：
${tagBlockZh}

请直接输出 { "summary": "...", "bullets": ["...","..."] } 结构，summary 1 段，bullets 2-4 条。`
    : `Palm tags:
${tagBlockEn}

Return JSON { "summary": "...", "bullets": ["...","..."] }, with 1-paragraph summary and 2-4 bullets.`;

  try {
    const response = await llm.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1000 },
    );

    const parsed = parseJSONResponse<{ summary: string; bullets: string[] }>(
      response.content,
      { summary: archetypeSummary(archetype, locale), bullets: fallbackPalmBullets(locale) },
    );

    if (!parsed.summary || !Array.isArray(parsed.bullets) || parsed.bullets.length === 0) {
      const fallbackSummary = parsed.summary || archetypeSummary(archetype, locale);
      const fallbackBullets =
        Array.isArray(parsed.bullets) && parsed.bullets.length > 0 ? parsed.bullets : fallbackPalmBullets(locale);
      return mapPalmNarrative(archetype, fallbackSummary, fallbackBullets);
    }

    return mapPalmNarrative(archetype, parsed.summary, parsed.bullets);
  } catch (error) {
    console.error("[LLM] Palm interpretation failed:", error);
    return getFallbackPalmInsight(archetype, locale);
  }
}

/**
 * 舌苔 LLM 解读
 */
export async function interpretTongueWithLLM(
  archetype: TongueStateTags,
  locale: Locale,
): Promise<TongueInsight> {
  const llm = createLLMService();
  if (!llm) {
    return getFallbackTongueInsight(archetype, locale);
  }

  const systemPrompt =
    locale === "zh"
      ? `你是一位“东方象学 × 温柔生活指南”风格的舌象解读者。请输出 JSON 字段：
1. summary：结合输入标签写 1 段象学式总结（参考气机 / 湿度 / 寒热 / 胃气，限 1 段，不得涉及疾病或寿命）。
2. energy_state：引用并温柔润色给定的 energy_state。
3. body_trend：结合 digestive_trend 与 moisture_pattern 描述身体取向，语气柔和，不医学诊断。
4. moisture_pattern：直接沿用提供的湿度标签。
5. heat_pattern：沿用提供的寒热标签。
6. digestive_trend：沿用提供的胃气提示。
7. special_signs：沿用提供的特殊标记数组。
8. advice：列出 2–4 条温柔可执行的日常建议（如喝温水、早点睡、放松伸展、清淡饮食、少重口），禁止出现疾病名称。
语气：东方象学 × 温柔生活指南，不玄、不吓、不诊断，不谈寿命。仅使用提供的标签与信息。`
      : `You are an "Eastern symbolism × gentle living" tongue interpreter. Output JSON fields:
1. summary: one-paragraph symbolic overview rooted in the provided energy/moisture/heat/digestive cues (single paragraph, no disease or lifespan talk).
2. energy_state: echo and softly polish the supplied energy_state label.
3. body_trend: describe body tendency based on digestive_trend + moisture_pattern with a gentle, non-medical tone.
4. moisture_pattern: carry over the provided moisture label.
5. heat_pattern: carry over the provided heat label.
6. digestive_trend: carry over the provided digestive label.
7. special_signs: reuse the provided special signs array.
8. advice: list 2–4 actionable, tender tips (warm water, lighter meals, earlier sleep, gentle stretching, less heavy seasoning). Do not mention diseases or lifespan.
Tone: Eastern symbolism meets soft-life guidance. Use only the supplied data.`;

  const archetypeLinesZh = [
    `气机：${archetype.energy_state}`,
    `湿度：${archetype.moisture_pattern}`,
    `寒热：${archetype.heat_pattern}`,
    `胃气/消化：${archetype.digestive_trend}`,
    `特殊标记：${archetype.special_signs.length > 0 ? archetype.special_signs.join("；") : "暂无"}`,
  ].join("\n");
  const archetypeLinesEn = [
    `Energy: ${archetype.energy_state}`,
    `Moisture: ${archetype.moisture_pattern}`,
    `Heat: ${archetype.heat_pattern}`,
    `Digestive trend: ${archetype.digestive_trend}`,
    `Special signs: ${archetype.special_signs.length > 0 ? archetype.special_signs.join("; ") : "None"}`,
  ].join("\n");

  const userPrompt = locale === "zh"
    ? `舌象标签：
${archetypeLinesZh}

请仅依据这些标签生成 JSON，summary 限 1 段，advice 仅含 2–4 条，禁止扩写或自创信息。`
    : `Tongue tags:
${archetypeLinesEn}

Use these tags only. Keep summary to one paragraph and advice to 2–4 bullet-ready lines. No invented details.`;

  try {
    const response = await llm.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1000 },
    );

    const parsed = parseJSONResponse<TongueInsight>(
      response.content,
      getFallbackTongueInsight(archetype, locale),
    );

    if (
      !parsed.summary ||
      !parsed.energy_state ||
      !parsed.body_trend ||
      !Array.isArray(parsed.advice)
    ) {
      return getFallbackTongueInsight(archetype, locale);
    }

    return parsed;
  } catch (error) {
    console.error("[LLM] Tongue interpretation failed:", error);
    return getFallbackTongueInsight(archetype, locale);
  }
}

/**
 * 梦境 LLM 解读（融合周公+心理+象学）
 */
type InterpretDreamParams = {
  dreamText: string;
  locale: Locale;
  emotionHint?: string | null;
  archetype?: DreamArchetype;
};

export async function interpretDreamWithLLM({
  dreamText,
  locale,
  emotionHint,
  archetype: archetypeOverride,
}: InterpretDreamParams): Promise<DreamInsight> {
  const llm = createLLMService();
  const archetype =
    archetypeOverride ??
    buildDreamArchetypeFromText({
      text: dreamText,
      emotionHint: emotionHint ?? undefined,
    });

  if (!llm) {
    return getFallbackDreamInsight(locale, archetype);
  }

  const suggestionLine = archetype.suggestion_tags.join(locale === "zh" ? "，" : ", ");
  const systemPrompt =
    locale === "zh"
      ? `你是一位结合周公解梦象意与现代生活语言的东方梦境解读师。请仅根据提供的标签输出 JSON：
{
  "ImageSymbol": "2-3 句描述梦的象意（基于象意说明），不要吓人、不做诊断",
  "MindState": "1 段描述心绪模式，让人感觉被理解",
  "Trend": "1 段说明趋势提醒或需要面对的方向",
  "Advice": ["建议1","建议2","建议3（可选）"] // 每条前面可加 “· ” 符号
}
规则：
- 不要提疾病、心理测验、命运论。
- 语气温柔、有东方玄学味，但让现代人听得懂。
- 只能依据提供的标签，不要自创剧情。`
      : `You are an Eastern dream interpreter blending Zhou Gong symbolism with modern, gentle language. Use ONLY the provided tags to output JSON with this structure:
{
  "ImageSymbol": "2-3 sentences describing the symbolism (based on the symbolic note), gentle and non-alarmist",
  "MindState": "One paragraph that reflects the mood pattern so the dreamer feels understood",
  "Trend": "One paragraph explaining the reminder or direction (trend hint)",
  "Advice": ["Tip 1","Tip 2","Tip 3(optional)"] // each tip can start with "· "
}
Rules:
- No medical or psychiatric diagnoses, no fortune-telling.
- Tone should feel like refined Eastern symbolism but easy for modern readers.
- Use only the supplied tags; do not invent scenes.`;

  const userPrompt = locale === "zh"
    ? `【梦境类型】${archetype.type}
【象意说明】${archetype.symbol_meaning}
【心绪模式】${archetype.mood_pattern}
【趋势提醒】${archetype.trend_hint}
【建议标签】${suggestionLine}`
    : `Dream Type: ${archetype.type}
Symbolic Meaning: ${archetype.symbol_meaning}
Mood Pattern: ${archetype.mood_pattern}
Trend Hint: ${archetype.trend_hint}
Suggestion Tags: ${suggestionLine}`;

  try {
    const response = await llm.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.8, max_tokens: 1500 },
    );

    const parsed = parseJSONResponse<DreamInsight>(
      response.content,
      getFallbackDreamInsight(locale, archetype),
    );

    if (
      !parsed.ImageSymbol ||
      !parsed.MindState ||
      !parsed.Trend ||
      !Array.isArray(parsed.Advice)
    ) {
      return getFallbackDreamInsight(locale, archetype);
    }

    return parsed;
  } catch (error) {
    console.error("[LLM] Dream interpretation failed:", error);
    return getFallbackDreamInsight(locale, archetype);
  }
}

// 降级方案（当 LLM 不可用时）
function getFallbackPalmInsight(archetype: PalmArchetype, locale: Locale): PalmInsight {
  const summary = archetypeSummary(archetype, locale);
  const bullets = fallbackPalmBullets(locale);
  return mapPalmNarrative(archetype, summary, bullets);
}

function archetypeSummary(archetype: PalmArchetype, locale: Locale): string {
  if (locale === "zh") {
    return `${archetype.vitality}；${archetype.emotion_pattern}；${archetype.thinking_pattern}。`;
  }
  return `${archetype.vitality} | ${archetype.emotion_pattern} | ${archetype.thinking_pattern}.`;
}

function fallbackPalmBullets(locale: Locale): string[] {
  if (locale === "zh") {
    return ["今天喝点温水，别急着满格输出", "把最重要的事排前面，剩下的留白", "分段完成任务，肩膀会轻松许多"];
  }
  return ["Sip warm water, don't rush to full output", "Put the most important things first, leave the rest blank", "Complete tasks in segments, your shoulders will be much more relaxed"];
}

function getFallbackTongueInsight(archetype: TongueStateTags, locale: Locale): TongueInsight {
  const summaryZh = `整体气机呈现：${archetype.energy_state}；湿度表现：${archetype.moisture_pattern}；寒热倾向：${archetype.heat_pattern}；胃气提示：${archetype.digestive_trend}。`;
  const summaryEn = `Qi overview: ${archetype.energy_state}. Moisture pattern: ${archetype.moisture_pattern}. Heat tendency: ${archetype.heat_pattern}. Digestive hint: ${archetype.digestive_trend}.`;

  const baseAdviceZh = [
    "喝点温水或淡茶，缓和体内紧绷",
    "清淡饮食，少油炸重口",
    "早点收工休息，保持充足睡眠",
  ];
  const baseAdviceEn = [
    "Sip warm water or mild tea to soften tension",
    "Keep meals light and avoid greasy, heavy flavors",
    "Wind down early and secure enough sleep",
  ];

  if (locale === "zh") {
    return {
      summary: summaryZh,
      energy_state: archetype.energy_state,
      body_trend: archetype.digestive_trend,
      moisture_pattern: archetype.moisture_pattern,
      heat_pattern: archetype.heat_pattern,
      digestive_trend: archetype.digestive_trend,
      special_signs: archetype.special_signs,
      advice: baseAdviceZh,
    };
  }

  return {
    summary: summaryEn,
    energy_state: archetype.energy_state,
    body_trend: archetype.digestive_trend,
    moisture_pattern: archetype.moisture_pattern,
    heat_pattern: archetype.heat_pattern,
    digestive_trend: archetype.digestive_trend,
    special_signs: archetype.special_signs,
    advice: baseAdviceEn,
  };
}

function getFallbackDreamInsight(locale: Locale, archetype?: DreamArchetype): DreamInsight {
  if (!archetype) {
    return locale === "zh"
      ? {
          ImageSymbol: "这个梦像是一种'被追'的象（《周公解梦》：逃避现实、压力驱使），说明你最近感觉被某些事情推进着走。",
          MindState: "你对表现和评价比较在意，心气不稳，多事缠身。",
          Trend: "这是一个提醒你调整节奏、不要再一个人硬撑的阶段。心绪急、事逼身，适合减负放慢节奏。",
          Advice: ["给自己一些放松的时间，不要总是紧绷", "与信任的人分享你的感受", "学会说'不'，保护自己的边界"],
        }
      : {
          ImageSymbol: "This dream has a 'being chased' symbol, indicating you feel pushed forward by certain things recently.",
          MindState: "You also care deeply about performance and others' evaluations.",
          Trend: "It's suggested to adjust your pace and stop pushing yourself alone.",
          Advice: [
            "Give yourself some time to relax, don't always be tense",
            "Share your feelings with trusted people",
            "Learn to say 'no' and protect your boundaries",
          ],
        };
  }

  const advice = archetype.suggestion_tags.slice(0, 3).map((tag) => (locale === "zh" ? `· ${tag}` : `· ${tag}`));

  if (locale === "zh") {
    return {
      ImageSymbol: archetype.symbol_meaning,
      MindState: archetype.mood_pattern,
      Trend: archetype.trend_hint,
      Advice: advice.length > 0 ? advice : ["· 记录梦境，慢慢理解它的提醒"],
    };
  }

  return {
    ImageSymbol: archetype.symbol_meaning,
    MindState: archetype.mood_pattern,
    Trend: archetype.trend_hint,
    Advice: advice.length > 0 ? advice : ["· Record the dream and see what it nudges you toward"],
  };
}

/**
 * 体质 LLM 解读（12选1）
 */
export async function interpretConstitutionWithLLM(
  palmInsight: PalmInsight,
  tongueInsight: TongueInsight,
  dreamInsight: DreamInsight,
  locale: Locale,
): Promise<ConstitutionInsight> {
  const llm = createLLMService();
  if (!llm) {
    return getFallbackConstitutionInsight(locale);
  }

  const constitutionTypes = locale === "zh"
    ? [
        "emotional_surge（情绪敏感型）",
        "mental_overclock（轻躁随动型）",
        "grounded_steady（平稳根基型）",
        "social_drain（社交耗能型）",
        "thought_heavy（思虑偏重型）",
        "mild_fatigue（轻度疲劳型）",
        "low_heart_qi（心气不足型）",
        "underlight_pressure（轻压前行型）",
        "ascending_flow（整体上扬型）",
        "steady_build（稳步积累型）",
        "easy_flow（松弛自在型）",
        "high_vitality（精力充沛型）",
      ]
    : [
        "emotional_surge (Emotional Surge)",
        "mental_overclock (Airy Scattered)",
        "grounded_steady (Grounded Balance)",
        "social_drain (Social Drain)",
        "thought_heavy (Thought Heavy)",
        "mild_fatigue (Mild Fatigue)",
        "low_heart_qi (Low Heart Qi)",
        "underlight_pressure (Underlight Pressure)",
        "ascending_flow (Ascending Flow)",
        "steady_build (Steady Build)",
        "easy_flow (Easy Flow)",
        "high_vitality (High Vitality)",
      ];

  const systemPrompt =
    locale === "zh"
      ? `你是一位"东方智慧 × 现代生活"风格的体质解读专家。请根据掌纹、舌苔、梦境的综合洞察，从以下 12 种状态体质中选择最符合的一种，并输出以下 JSON 字段：
1. constitution_type：必须从以下 12 种中选择一个（只返回类型标识，如 "emotional_surge"）：
   ${constitutionTypes.join("\n   ")}
2. description_paragraphs：2-3 段描述性文字，说明该体质的特征与状态（每段一个字符串，组成数组）。
3. constitution_advice：3-5 条日常建议（数组），语气温柔、生活化、可执行，不医学化、不心理测验化。
规则：语气温柔、有文化感；必须明确这是"状态体质"，仅为中医保健建议，不构成医疗建议；站在"东方智慧 × 现代生活"视角。
输出 JSON：{"constitution_type":"…","description_paragraphs":["…","…"],"constitution_advice":["…","…","…"]}`
      : `You are a constitution interpreter in the tone of "Eastern Wisdom × Modern Life". Based on palm, tongue, and dream insights, select the most fitting one from these 12 state constitutions and output these JSON fields:
1. constitution_type: Must be one of these 12 (return only the type identifier, e.g., "emotional_surge"):
   ${constitutionTypes.join("\n   ")}
2. description_paragraphs: 2-3 descriptive paragraphs explaining the constitution's characteristics and state (each paragraph as a string in an array).
3. constitution_advice: 3-5 daily suggestions (array), gentle, life-oriented, actionable, not medicalized or psychological-test-like.
Rules: gentle, cultured tone; clearly state these are "state constitutions", only for TCM wellness suggestions, not medical advice; from the perspective of "Eastern Wisdom × Modern Life".
Return JSON: {"constitution_type":"...","description_paragraphs":["...","..."],"constitution_advice":["...","...","..."]}`;

  const userPrompt =
    locale === "zh"
      ? `请根据以下综合洞察，判断用户的状态体质：

掌纹洞察：
- 生命节奏：${palmInsight.life_rhythm || "未提供"}
- 情绪模式：${palmInsight.emotion_pattern || "未提供"}
- 思维风格：${palmInsight.thought_style || "未提供"}
- 总览：${palmInsight.palm_overview_summary || "未提供"}

舌苔洞察：
- 概览：${tongueInsight.summary || "未提供"}
- 能量状态：${tongueInsight.energy_state || "未提供"}
- 身体趋势：${tongueInsight.body_trend || "未提供"}

梦境洞察：
- 象义说明：${dreamInsight.ImageSymbol || dreamInsight.symbolic || "未提供"}
- 心理说明：${dreamInsight.MindState || dreamInsight.psychological || "未提供"}
- 趋势说明：${dreamInsight.Trend || dreamInsight.trend || "未提供"}

请从 12 种状态体质中选择最符合的一种，并生成描述和建议。`
      : `Please determine the user's state constitution based on these comprehensive insights:

Palm Insights:
- Life Rhythm: ${palmInsight.life_rhythm || "Not provided"}
- Emotion Pattern: ${palmInsight.emotion_pattern || "Not provided"}
- Thought Style: ${palmInsight.thought_style || "Not provided"}
- Overview: ${palmInsight.palm_overview_summary || "Not provided"}

Tongue Insights:
- Overview: ${tongueInsight.summary || "Not provided"}
- Energy State: ${tongueInsight.energy_state || "Not provided"}
- Body Trend: ${tongueInsight.body_trend || "Not provided"}

Dream Insights:
- Image Symbol: ${dreamInsight.ImageSymbol || dreamInsight.symbolic || "Not provided"}
- Mind State: ${dreamInsight.MindState || dreamInsight.psychological || "Not provided"}
- Trend: ${dreamInsight.Trend || dreamInsight.trend || "Not provided"}

Please select the most fitting one from the 12 state constitutions and generate descriptions and advice.`;

  try {
    const response = await llm.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1500 },
    );

    const parsed = parseJSONResponse<ConstitutionInsight>(
      response.content,
      getFallbackConstitutionInsight(locale),
    );

    if (
      !parsed.constitution_type ||
      !Array.isArray(parsed.description_paragraphs) ||
      !Array.isArray(parsed.constitution_advice)
    ) {
      return getFallbackConstitutionInsight(locale);
    }

    // 验证 constitution_type 是否为有效的 12 种之一
    const validTypes = [
      "emotional_surge",
      "mental_overclock",
      "grounded_steady",
      "social_drain",
      "thought_heavy",
      "mild_fatigue",
      "low_heart_qi",
      "underlight_pressure",
      "ascending_flow",
      "steady_build",
      "easy_flow",
      "high_vitality",
    ];
    if (!validTypes.includes(parsed.constitution_type)) {
      return getFallbackConstitutionInsight(locale);
    }

    return parsed;
  } catch (error) {
    console.error("[LLM] Constitution interpretation failed:", error);
    return getFallbackConstitutionInsight(locale);
  }
}

function getFallbackConstitutionInsight(locale: Locale): ConstitutionInsight {
  if (locale === "zh") {
    return {
      constitution_type: "steady_build",
      description_paragraphs: [
        "整体节奏扎实稳健，做事踏实、有耐心。",
        "能在关系与工作中保持稳定存在感，外界影响较小，稳步推进自己的节奏。",
      ],
      constitution_advice: [
        "继续维持当下的节奏，不需要额外加速。",
        "适合处理长期任务、整理结构性事务。",
        "保持适度运动，让身体维持流畅感。",
      ],
    };
  }

  return {
    constitution_type: "steady_build",
    description_paragraphs: [
      "Overall rhythm is solid and steady, doing things reliably and patiently.",
      "Able to maintain a stable presence in relationships and work, less affected by external influences, steadily advancing at your own pace.",
    ],
    constitution_advice: [
      "Continue maintaining your current pace, no need to accelerate further.",
      "Suitable for handling long-term tasks and organizing structural matters.",
      "Maintain moderate exercise to keep your body flowing smoothly.",
    ],
  };
}

/**
 * 气运 LLM 解读
 * qi = combine(season_qi, palm_trend, tongue_energy, dream象)
 * 输出：summary + trend + advice
 */
export async function interpretQiRhythmWithLLM(
  palmInsight: PalmInsight,
  tongueInsight: TongueInsight,
  dreamInsight: DreamInsight,
  solarTermName: string,
  qiIndex: number,
  qiTag: string,
  locale: Locale,
): Promise<QiRhythmInsight> {
  const llm = createLLMService();
  if (!llm) {
    return getFallbackQiRhythmInsight(solarTermName, qiTag, locale);
  }

  const systemPrompt =
    locale === "zh"
      ? `你是一位"东方智慧 × 现代生活"风格的气运解读专家。请根据节气、掌纹势、舌象气、梦境象，综合生成今日气运解读，输出以下 JSON 字段：
1. summary：气运总览（1-2 句，综合节气、掌纹势、舌象气、梦境象，描述今日整体气运状态，语气温柔、有文化感）。
2. trend：气运趋势（1 句，描述今日气运的时间趋势，如"上午平稳，下午渐强，晚上适合收心整理"）。
3. advice：2-3 条气运建议（数组），生活化、可执行，不医学化、不心理测验化。
规则：语气温柔、有文化感；必须明确这是基于东方象学的解读，不构成医疗或确定性预测；气运不是算命，而是"今日气机 + 势的方向"。
输出 JSON：{"summary":"…","trend":"…","advice":["…","…","…"]}`
      : `You are a qi rhythm interpreter in the tone of "Eastern Wisdom × Modern Life". Based on solar term, palm momentum, tongue qi, and dream symbolism, generate today's qi rhythm interpretation and output these JSON fields:
1. summary: Qi overview (1-2 sentences, integrating solar term, palm momentum, tongue qi, and dream symbolism, describing today's overall qi rhythm state, gentle and cultured tone).
2. trend: Qi trend (1 sentence, describing the temporal trend of today's qi, e.g., "Steady in the morning, gradually stronger in the afternoon, suitable for winding down in the evening").
3. advice: 2-3 qi suggestions (array), life-oriented, actionable, not medicalized or psychological-test-like.
Rules: gentle, cultured tone; clearly state this is based on Eastern symbolism, not medical or deterministic prediction; qi rhythm is not fortune-telling, but "today's qi mechanism + direction of momentum".
Return JSON: {"summary":"...","trend":"...","advice":["...","...","..."]}`;

  const userPrompt =
    locale === "zh"
      ? `请根据以下信息，综合生成今日气运解读：

节气：${solarTermName}
气运指数：${qiIndex} 分
气运标签：${qiTag}

掌纹势（palm_trend）：
- 生命节奏：${palmInsight.life_rhythm || "未提供"}
- 情绪模式：${palmInsight.emotion_pattern || "未提供"}
- 思维风格：${palmInsight.thought_style || "未提供"}
- 总览：${palmInsight.palm_overview_summary || "未提供"}

舌象气（tongue_energy）：
- 概览：${tongueInsight.summary || "未提供"}
- 能量状态：${tongueInsight.energy_state || "未提供"}
- 身体趋势：${tongueInsight.body_trend || "未提供"}

梦境象（dream象）：
- 象义说明：${dreamInsight.ImageSymbol || dreamInsight.symbolic || "未提供"}
- 心理说明：${dreamInsight.MindState || dreamInsight.psychological || "未提供"}
- 趋势说明：${dreamInsight.Trend || dreamInsight.trend || "未提供"}

请综合节气、掌纹势、舌象气、梦境象，生成完整的气运解读（summary + trend + advice）。`
      : `Please generate today's qi rhythm interpretation based on the following information:

Solar Term: ${solarTermName}
Qi Index: ${qiIndex} points
Qi Tag: ${qiTag}

Palm Momentum (palm_trend):
- Life Rhythm: ${palmInsight.life_rhythm || "Not provided"}
- Emotion Pattern: ${palmInsight.emotion_pattern || "Not provided"}
- Thought Style: ${palmInsight.thought_style || "Not provided"}
- Overview: ${palmInsight.palm_overview_summary || "Not provided"}

Tongue Qi (tongue_energy):
- Overview: ${tongueInsight.summary || "Not provided"}
- Energy State: ${tongueInsight.energy_state || "Not provided"}
- Body Trend: ${tongueInsight.body_trend || "Not provided"}

Dream Symbolism (dream象):
- Image Symbol: ${dreamInsight.ImageSymbol || dreamInsight.symbolic || "Not provided"}
- Mind State: ${dreamInsight.MindState || dreamInsight.psychological || "Not provided"}
- Trend: ${dreamInsight.Trend || dreamInsight.trend || "Not provided"}

Please integrate solar term, palm momentum, tongue qi, and dream symbolism to generate a complete qi rhythm interpretation (summary + trend + advice).`;

  try {
    const response = await llm.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1000 },
    );

    const parsed = parseJSONResponse<QiRhythmInsight>(
      response.content,
      getFallbackQiRhythmInsight(solarTermName, qiTag, locale),
    );

    if (
      !parsed.summary ||
      !parsed.trend ||
      !Array.isArray(parsed.advice)
    ) {
      return getFallbackQiRhythmInsight(solarTermName, qiTag, locale);
    }

    return parsed;
  } catch (error) {
    console.error("[LLM] Qi rhythm interpretation failed:", error);
    return getFallbackQiRhythmInsight(solarTermName, qiTag, locale);
  }
}

function getFallbackQiRhythmInsight(solarTermName: string, qiTag: string, locale: Locale): QiRhythmInsight {
  if (locale === "zh") {
    return {
      summary: `今日为"${qiTag === "升" ? "顺势微扬" : qiTag === "稳" ? "平稳可循" : qiTag === "低" ? "内敛收束" : "中性过渡"}"，综合节气${solarTermName || "今日"}、掌纹势、舌象气、梦境象，你的精力虽未满格，但整体方向在变亮。`,
      trend: "上午平稳，下午渐强，晚上适合收心整理。",
      advice: [
        "把精力放在你最在意的 1–2 件事上，推进半步就好。",
        "可以主动发起一次沟通或合作邀请，顺着现在的势头试一试。",
        "减少在无关琐事上的耗损，把时间留给真正重要的事。",
      ],
    };
  }

  return {
    summary: `Today shows "${qiTag === "升" ? "gentle upward momentum" : qiTag === "稳" ? "steady and predictable" : qiTag === "低" ? "inward and conserving" : "neutral transition"}", integrating solar term ${solarTermName || "today"}, palm momentum, tongue qi, and dream symbolism, your energy isn't at full capacity, but the overall direction is brightening.`,
    trend: "Steady in the morning, gradually stronger in the afternoon, suitable for winding down in the evening.",
    advice: [
      "Focus your energy on 1–2 things you care most about, just push forward half a step.",
      "You can initiate a communication or collaboration invitation, test the current momentum.",
      "Reduce waste on trivial matters, save time for what truly matters.",
    ],
  };
}

