/**
 * 气运主引擎（V2）
 * - 掌纹：长期底盘，只占 10%
 * - 舌苔：当日气机，25%
 * - 梦境：心气波动，40%
 * - 黄历：外部环境，20%
 * - 状态体质：±5 微调
 */

import { AlmanacInfo, getTodayAlmanac } from "./calendar";
import {
  scoreAlmanacForQiV2,
  scoreConstitutionForQiV2,
  scoreDreamForQiV2,
  scorePalmForQiV2,
  scoreTongueForQiV2,
} from "./rules";
import type {
  BodyTongue,
  DreamInsight,
  PalmInsight,
  QiComponentsBreakdown,
  QiRhythmV2,
  QiTag,
  QiTrend,
} from "./types";
import type { ConstitutionSummary, ConstitutionType } from "@/lib/analysis/constitution";
import { QI_INDEX_RANGE, QI_TAG_THRESHOLDS, QI_TREND_BY_TAG, QI_WEIGHTS } from "./qiConfig";
import { interpretQiRhythmWithLLM } from "@/lib/llm/service";

export interface QiRhythmContext {
  locale?: "zh" | "en";
  palm?: PalmInsight | null;
  palmSummary?: string | null;
  tongue?: BodyTongue | null;
  tongueSummary?: string | null;
  dream?: DreamInsight | null;
  dreamSummary?: string | null;
  constitution?: ConstitutionSummary | null;
  constitutionType?: ConstitutionType | null;
  qiEffect?: number | null;
  date?: Date;
}

export async function inferQiRhythmV2(ctx: QiRhythmContext): Promise<QiRhythmV2> {
  const date = ctx.date ?? new Date();
  const alm = getTodayAlmanac(date);
  const locale: "zh" | "en" = ctx.locale === "en" ? "en" : "zh";

  const palmSummary = ctx.palmSummary ?? ctx.palm?.palm_overview_summary ?? "";
  const tongueSummary = ctx.tongueSummary ?? ctx.tongue?.summary ?? "";
  const dreamInsight: DreamInsight = ctx.dream ?? {
    symbolic: ctx.dreamSummary ?? "",
  };
  const constitutionDelta = scoreConstitutionForQiV2(
    ctx.constitution?.qiEffect ?? ctx.qiEffect ?? 0,
  );

  const palmScore = scorePalmForQiV2(palmSummary);
  const tongueScore = scoreTongueForQiV2(tongueSummary);
  const dreamScore = scoreDreamForQiV2(dreamInsight);
  const almScore = scoreAlmanacForQiV2(alm);

  const weightedPalm = palmScore * QI_WEIGHTS.palm;
  const weightedTongue = tongueScore * QI_WEIGHTS.tongue;
  const weightedDream = dreamScore * QI_WEIGHTS.dream;
  const weightedAlmanac = almScore * QI_WEIGHTS.almanac;

  let index = Math.round(
    weightedPalm + weightedTongue + weightedDream + weightedAlmanac + constitutionDelta,
  );
  index = Math.max(QI_INDEX_RANGE.min, Math.min(QI_INDEX_RANGE.max, index));

  const tag = resolveTag(index);
  const trend = resolveTrend(tag);
  const almanacHint = summarizeAlmanacHint(alm);
  const solarTermName = alm.lunarTerm || (locale === "zh" ? "今日" : "Today");

  // 使用 LLM 生成气运解读（fallback 到规则生成）
  let qiInsight;
  try {
    // 确保所有字段都有值，满足 interpretQiRhythmWithLLM 的类型要求
    // 将旧的 PalmInsight 格式转换为新格式
    const palmSummaryText = ctx.palm?.palm_overview_summary ?? palmSummary;
    const palmInsightForQi = {
      summary: Array.isArray(ctx.palm?.summary) 
        ? ctx.palm.summary 
        : palmSummaryText 
          ? [palmSummaryText]
          : [ctx.palm?.life_rhythm ?? "", ctx.palm?.emotion_pattern ?? "", ctx.palm?.thought_style ?? ""].filter(Boolean),
      bullets: Array.isArray(ctx.palm?.bullets) 
        ? ctx.palm.bullets 
        : ctx.palm?.palm_advice ?? [],
    };
    // 将旧的 BodyTongue 格式转换为新的 TongueInsight 格式
    const tongueSummaryText = ctx.tongue?.summary ?? ctx.tongue?.qi_pattern ?? "";
    const tongueInsightForQi: import("@/lib/llm/service").TongueInsight = {
      summary: typeof ctx.tongue?.summary === "string" 
        ? ctx.tongue.summary 
        : tongueSummaryText,
      bullets: ctx.tongue?.health_care_advice ?? [],
    };
    // 确保所有字段都有值，满足 interpretQiRhythmWithLLM 的类型要求
    const dreamInsightForQi = {
      symbol: dreamInsight.symbol ?? dreamInsight.ImageSymbol ?? dreamInsight.symbolic ?? "",
      mood: dreamInsight.mood ?? dreamInsight.MindState ?? dreamInsight.psychological ?? "",
      trend: dreamInsight.trend ?? dreamInsight.Trend ?? "",
      suggestions: dreamInsight.suggestions ?? dreamInsight.Advice ?? dreamInsight.advice ?? dreamInsight.actions ?? [],
    };

    // 获取宜忌信息
    const yi = alm.yi?.slice(0, 2) ?? [];
    const ji = alm.ji?.slice(0, 2) ?? [];
    const trendText = generateQiTrendText(tag, alm, locale);
    
    qiInsight = await interpretQiRhythmWithLLM(
      palmInsightForQi,
      tongueInsightForQi,
      dreamInsightForQi,
      solarTermName,
      index,
      tag,
      yi,
      ji,
      trendText,
      locale,
    );
  } catch (error) {
    console.error("[inferQiRhythmV2] LLM failed, using rule-based fallback:", error);
    // Fallback 到规则生成
    const description = composeQiNarrative({
      tag,
      index,
      almanac: alm,
      almanacHint,
      palmScore,
      palmSummary,
      tongueScore,
      tongueSummary,
      dreamInsight,
      locale,
    });
    const trendText = generateQiTrendText(tag, alm, locale);
    const suggestions = generateQiSuggestions(tag);
    qiInsight = {
      summary: description,
      trend: trendText || "",
      advice: suggestions,
    };
  }

  const components: QiComponentsBreakdown = {
    palm: Math.round(weightedPalm),
    tongue: Math.round(weightedTongue),
    dream: Math.round(weightedDream),
    almanac: Math.round(weightedAlmanac),
    constitution: constitutionDelta,
  };

  return {
    index,
    trend, // 趋势方向（"up" | "down" | "flat"）
    tag,
    // LLM 生成的简化字段（最终格式：summary + trend + advice）
    summary: qiInsight.summary,
    trendText: qiInsight.trend, // 趋势文本（LLM 生成）
    advice: qiInsight.advice,
    // 兼容旧字段
    description: qiInsight.summary,
    suggestions: qiInsight.advice,
    almanacHint,
    components,
    constitutionType: ctx.constitution?.type ?? ctx.constitutionType ?? undefined,
  };
}

function resolveTag(index: number): QiTag {
  const found = QI_TAG_THRESHOLDS.find((cfg) => index >= cfg.min && index < cfg.max);
  return found?.tag ?? "中";
}

function resolveTrend(tag: QiTag): QiTrend {
  return QI_TREND_BY_TAG[tag] ?? "flat";
}

function summarizeAlmanacHint(alm: AlmanacInfo): string {
  const yi = alm.yi?.slice(0, 2) ?? [];
  const ji = alm.ji?.slice(0, 2) ?? [];
  const parts: string[] = [];

  if (yi.length) {
    parts.push(`宜：${yi.join("、")}`);
  }
  if (ji.length) {
    parts.push(`忌：${ji.join("、")}`);
  }

  if (!parts.length && !alm.lunarTerm) {
    return "";
  }

  const base = parts.length ? parts.join("；") : "";
  const term = alm.lunarTerm ? `今日节气：${alm.lunarTerm}。` : "";
  return `${term}${base}`;
}

interface QiNarrativeInput {
  tag: QiTag;
  index: number;
  almanac: AlmanacInfo;
  almanacHint: string;
  palmScore: number;
  palmSummary?: string | null;
  tongueScore: number;
  tongueSummary?: string | null;
  dreamInsight: DreamInsight;
  locale: "zh" | "en";
}

function composeQiNarrative(input: QiNarrativeInput): string {
  const {
    tag,
    index,
    almanac,
    almanacHint,
    palmScore,
    palmSummary,
    tongueScore,
    tongueSummary,
    dreamInsight,
    locale,
  } = input;
  const fragments: string[] = [];

  const seasonal = describeAlmanacMood(almanac, tag, locale);
  if (seasonal) fragments.push(seasonal);

  const palmLine = describePalmMomentum(palmScore, palmSummary, locale);
  if (palmLine) fragments.push(palmLine);

  const tongueLine = describeTongueQi(tongueScore, tongueSummary, locale);
  if (tongueLine) fragments.push(tongueLine);

  const dreamLine = describeDreamSymbolism(dreamInsight, locale);
  if (dreamLine) fragments.push(dreamLine);

  const baseTone = describeOverallFlow(tag, index, locale);
  if (baseTone) fragments.push(baseTone);

  if (almanacHint) {
    fragments.push(almanacHint);
  }

  return fragments.join(" ");
}

function generateQiTrendText(tag: QiTag, alm: AlmanacInfo, locale: "zh" | "en"): string {
  const yi = alm.yi?.[0];
  const ji = alm.ji?.[0];
  const baseZh = alm.lunarTerm ? `处在 ${alm.lunarTerm}` : "今日黄历";
  const baseEn = alm.lunarTerm ? `Under ${alm.lunarTerm}` : "Today's almanac";
  const tailZh = yi || ji ? `（宜 ${yi ?? "顺势"}, 忌 ${ji ?? "分心"}）` : "";
  const tailEn =
    yi || ji ? `(favorable for ${yi ?? "moving with the flow"}, avoid ${ji ?? "over-committing"})` : "";

  if (locale === "en") {
    if (tag === "升") {
      return `${baseEn} pushes upward: test ideas in the morning, lean in during the afternoon, and wind down gently at night ${tailEn}`.trim();
    }
    if (tag === "低") {
      return `${baseEn} suggests taking it slow—lay foundations in the morning, keep it light later, and close the day early ${tailEn}`.trim();
    }
    if (tag === "稳") {
      return `${baseEn} stays steady: follow your plan in the morning, tidy and organize in the afternoon, wrap softly tonight ${tailEn}`.trim();
    }
    return `${baseEn} stays neutral: keep your rhythm in the morning, leave some flex in the afternoon, and reflect lightly at night ${tailEn}`.trim();
  }

  if (tag === "升") {
    return `${baseZh} 的气息在往上走，上午试探、下午发力，晚上记得收心整理 ${tailZh}`.trim();
  }
  if (tag === "低") {
    return `${baseZh} 提醒你慢下来，上午宜打底，下午保持轻节奏，晚上早点收功 ${tailZh}`.trim();
  }
  if (tag === "稳") {
    return `${baseZh} 偏稳，上午照计划推进，下午适合整理，晚上温和收尾 ${tailZh}`.trim();
  }
  return `${baseZh} 对你是中性背景，上午专注自身节奏，下午留一点机动，晚上适度复盘 ${tailZh}`.trim();
}

function generateQiSuggestions(tag: QiTag): string[] {
  if (tag === "升") {
    return [
      "把精力放在你最在意的 1–2 件事上，推进半步就好，不用一口气做完。",
      "可以主动发起一次沟通或合作邀请，顺着现在的势头试一试。",
      "减少在无关琐事上的耗损，把时间留给真正重要的事。",
    ];
  }

  if (tag === "稳") {
    return [
      "按原本的计划走，就是今天最优解，不必强行制造变化。",
      "适合检查细节、补齐遗漏，把之前半成品的事情收一收。",
      "要做决定，可以优先处理那些你已经想清楚的，而不是临时起意的。",
    ];
  }

  if (tag === "低") {
    return [
      "今天可以刻意少答应几件事，先把自己的能量照顾好。",
      "不宜冲动做重大决定，有犹豫的事可以再多想一天。",
      "适合整理空间、精简任务，把不必要的负担先减下来。",
    ];
  }

  return [
    "今天适合小步试错，用轻量级的行动试一试你最近在想的点子。",
    "不要把行程排太满，留一点机动时间给临时的变化。",
    "把注意力放在“现在能做的小事”上，而不是空想很远的大目标。",
  ];
}

function describeAlmanacMood(alm: AlmanacInfo, tag: QiTag, locale: "zh" | "en"): string | null {
  const termZh = alm.lunarTerm ? `今日 ${alm.lunarTerm}` : "今日黄历";
  const termEn = alm.lunarTerm ? `Today's solar term is ${alm.lunarTerm}` : "Today's almanac";
  const yi = alm.yi?.[0];
  const ji = alm.ji?.[0];
  const toneZh =
    tag === "升"
      ? "外部气息助推上扬"
      : tag === "稳"
        ? "外部氛围平稳可循"
        : tag === "低"
          ? "外部节奏偏内敛"
          : "外部走势中性";
  const toneEn =
    tag === "升"
      ? "the outside vibe nudges everything upward"
      : tag === "稳"
        ? "the outside rhythm stays steady and predictable"
        : tag === "低"
          ? "the outside flow feels more inward and conserving"
          : "the outside pattern is fairly neutral";

  if (locale === "en") {
    const detail = [yi ? `favours ${yi}` : null, ji ? `avoid ${ji}` : null].filter(Boolean).join(", ");
    const hint = detail ? ` (${detail})` : "";
    return `${termEn}${hint}, ${toneEn}.`;
  }

  const detail = [yi ? `宜 ${yi}` : null, ji ? `忌 ${ji}` : null].filter(Boolean).join("，");
  const hint = detail ? `，${detail}` : "";
  return `${termZh}${hint}，${toneZh}。`;
}

function describePalmMomentum(score: number, summary: string | null | undefined, locale: "zh" | "en"): string | null {
  const toneZh =
    score >= 57
      ? "掌纹势头偏扬，底盘有前进的劲道"
      : score >= 50
        ? "掌纹势稳，长期节奏仍在可控范围"
        : "掌纹势稍紧，提醒你别把任务排得太满";
  const toneEn =
    score >= 57
      ? "Palm lines lean upward, your long-term momentum has torque"
      : score >= 50
        ? "Palm lines stay even, long-term rhythm remains within control"
        : "Palm lines tighten a little, hinting to keep tasks lighter";
  const detail = pickSentence(summary, locale);
  if (locale === "en") {
    return detail ? `${toneEn}. ${detail}` : `${toneEn}.`;
  }
  return detail ? `${toneZh}${detail.startsWith("，") ? detail : ` ${detail}`}` : `${toneZh}。`;
}

function describeTongueQi(score: number, summary: string | null | undefined, locale: "zh" | "en"): string | null {
  const toneZh =
    score >= 60
      ? "舌苔气机偏旺，身体能量正在抬头"
      : score >= 45
        ? "舌苔显示气机中等，保持均衡即可"
        : "舌苔提示能量偏低，需要温补与慢节奏";
  const toneEn =
    score >= 60
      ? "Tongue signs show higher qi—your body energy is rising"
      : score >= 45
        ? "Tongue signs suggest mid-level qi, keep things balanced"
        : "Tongue signs show lower qi, warm nourishment and slower pacing help";
  const detail = pickSentence(summary, locale);
  if (locale === "en") {
    return detail ? `${toneEn}. ${detail}` : `${toneEn}.`;
  }
  return detail ? `${toneZh}${detail.startsWith("，") ? detail : ` ${detail}`}` : `${toneZh}。`;
}

function describeDreamSymbolism(dream: DreamInsight, locale: "zh" | "en"): string | null {
  const symbolic = dream.symbolic ?? dream.symbol ?? dream.meaning ?? dream.trend ?? dream.mood;
  if (!symbolic) return null;
  if (locale === "en") {
    return `Dream symbolism hint: ${symbolic.replace(/[。！？.!?]+$/, "")}.`;
  }
  return `梦境象义提醒：${symbolic.replace(/[。！？]+$/, "")}。`;
}

function describeOverallFlow(tag: QiTag, index: number, locale: "zh" | "en"): string | null {
  const strongDay = index >= 75;
  const weakDay = index <= 35;

  if (locale === "en") {
    if (tag === "升") {
      return strongDay
        ? "Overall flow feels like a gentle lift—use it to push key matters forward."
        : "Overall flow is rising; small moves get instant feedback, so no need to finish everything at once.";
    }
    if (tag === "稳") {
      return "Overall qi stays steady—stick to your plan, polish details, and you'll see solid progress.";
    }
    if (tag === "低") {
      return weakDay
        ? "Qi is lower today, ideal for shedding load, closing loops, and caring for yourself."
        : "Qi dips a little; trim your schedule and leave space so things stay smooth.";
    }
    return "Qi feels neutral—use the day to transition, adjust pacing, and test ideas lightly.";
  }

  if (tag === "升") {
    return strongDay
      ? "整体走向属于“顺势微扬”，做事会更有冲劲，推进重点事项很合适。"
      : "整体走向在慢慢抬头，做一点就会有一点回应，别急着一次做完。";
  }
  if (tag === "稳") {
    return "整体气场平稳，按照原计划推进、修补细节，都会看到实质进展。";
  }
  if (tag === "低") {
    return weakDay
      ? "气场偏低，适合减负、收尾与自我照护，不宜硬扛大事。"
      : "气场略低，行程要精简一点，留白会让事情更顺。";
  }
  return "气场中性，是用于过渡、调整节奏、用轻量行动试探想法的一天。";
}

function pickSentence(text: string | null | undefined, locale: "zh" | "en"): string | null {
  if (!text) return null;
  const sentence = text
    .split(locale === "zh" ? /[。！？\n]/ : /[.!?\n]/)
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  if (!sentence) return null;
  const cleaned = sentence.replace(/[。！？.!?]+$/, "");
  return locale === "zh" ? `${cleaned}。` : `${cleaned}.`;
}


