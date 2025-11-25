import { getCalendarQiInfo } from "./calendarQi";

export type QiTrend = "up" | "down" | "flat";

export interface QiRhythmResult {
  index: number;
  tag: string;
  trend: QiTrend;
  summary: string;
  trendText: string;
  advice: string[];
  calendar: {
    solarTerm?: string;
    yi: string[];
    ji: string[];
    lunarDate: string;
    dayGanzhi: string;
  };
}

function scorePalm(palmTags: string[]): number {
  if (!palmTags) return 50;
  if (palmTags.includes("vitality_strong")) return 85;
  if (palmTags.includes("vitality_low")) return 40;
  return 60;
}

function scoreTongue(tongueTags: string[]): number {
  if (!tongueTags) return 50;
  if (tongueTags.includes("energy_low")) return 45;
  if (tongueTags.includes("fire_strong")) return 70;
  return 55;
}

function scoreDream(dreamTags: string[]): number {
  if (!dreamTags) return 50;
  if (dreamTags.includes("stress")) return 40;
  if (dreamTags.includes("breakthrough")) return 75;
  return 55;
}

export function inferQiRhythmV2(
  palmTags: string[],
  tongueTags: string[],
  dreamTags: string[],
  date: Date = new Date(),
): QiRhythmResult {
  const c = getCalendarQiInfo(date);

  const total =
    scorePalm(palmTags) * 0.4 +
    scoreTongue(tongueTags) * 0.3 +
    scoreDream(dreamTags) * 0.3;

  const index = Math.round(total);

  let tag = "稳中求进";
  if (index >= 80) tag = "顺势而为";
  else if (index <= 45) tag = "收心蓄力";

  const summary = `今日节气为「${c.solarTerm ?? "（无节气）"}」，当天干支为「${c.dayGanzhi}」。从整体节奏看，属于「${tag}」的一天。`;

  const trendText = "上午宜处理轻任务，中段适合交流沟通，晚上适合收心与内在整理。";

  let trend: QiTrend = "flat";
  if (tag === "顺势而为") trend = "up";
  else if (tag === "收心蓄力") trend = "down";

  const advice = [
    `宜：${c.yi.slice(0, 3).join("、")}（取前三项）`,
    `忌：${c.ji.slice(0, 3).join("、")}（取前三项）`,
    "保持节奏，不急不躁。",
    "根据今日身心状态安排轻重任务。",
  ];

  return {
    index,
    tag,
    trend,
    summary,
    trendText,
    advice,
    calendar: {
      solarTerm: c.solarTerm,
      yi: c.yi,
      ji: c.ji,
      lunarDate: c.lunarDate,
      dayGanzhi: c.dayGanzhi,
    },
  };
}

