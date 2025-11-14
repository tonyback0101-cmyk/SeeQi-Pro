export type DreamKeywordLite = {
  keyword: string;
  locale: "zh" | "en";
  symbolism: string;
  emotion?: string;
  healthCue?: string;
  advice?: string;
};

const BASE_DATA: DreamKeywordLite[] = [
  {
    keyword: "牙齿",
    locale: "zh",
    symbolism: "变化 / 成长 / 对控制感的担忧",
    emotion: "焦虑",
    healthCue: "注意肾精与睡眠压力",
    advice: "今晚早点入睡，温补类茶饮更合适",
  },
  {
    keyword: "teeth",
    locale: "en",
    symbolism: "Change or growth; concern over control",
    emotion: "Anxious",
    healthCue: "Watch kidney essence and sleep stress",
    advice: "Wind down early; warm herbal tea helps",
  },
  {
    keyword: "水",
    locale: "zh",
    symbolism: "情绪流动、潜意识释放",
    emotion: "平静",
    healthCue: "留意肾脏与内分泌平衡",
    advice: "保持补水，尝试冥想或温泉泡脚",
  },
  {
    keyword: "rain",
    locale: "en",
    symbolism: "Emotional release; cleansing phase",
    emotion: "Calm",
    healthCue: "Support kidneys and endocrine balance",
    advice: "Hydrate well, try meditation or a warm foot bath",
  },
  {
    keyword: "蛇",
    locale: "zh",
    symbolism: "潜藏的能量或需要面对的阴影",
    emotion: "紧张",
    healthCue: "关注肝胆解毒与血液循环",
    advice: "清淡饮食，加入解毒草本，适度拉伸",
  },
  {
    keyword: "snake",
    locale: "en",
    symbolism: "Hidden energy or shadow work awaiting",
    emotion: "Alert",
    healthCue: "Support liver detox and circulation",
    advice: "Light diet, add detox herbs, gentle stretching",
  },
  {
    keyword: "飞行",
    locale: "zh",
    symbolism: "自我突破、渴望自由",
    emotion: "喜悦",
    healthCue: "留心心肺功能与血氧循环",
    advice: "安排深呼吸或有氧运动，保持作息规律",
  },
  {
    keyword: "flying",
    locale: "en",
    symbolism: "Breaking limits; craving freedom",
    emotion: "Joyful",
    healthCue: "Watch cardio-respiratory stamina",
    advice: "Schedule breathing drills or light cardio; keep routines steady",
  },
  {
    keyword: "考试",
    locale: "zh",
    symbolism: "自我评估、焦虑或期待被认可",
    emotion: "紧张",
    healthCue: "注意脾胃与焦虑性疲劳",
    advice: "适度补充 B 族维生素，睡前写下担忧事项",
  },
  {
    keyword: "exam",
    locale: "en",
    symbolism: "Self-evaluation; anxiety around recognition",
    emotion: "Tense",
    healthCue: "Watch spleen-digestive stress and fatigue",
    advice: "Take B-vitamin support and jot worries before bed",
  },
  {
    keyword: "坠落",
    locale: "zh",
    symbolism: "安全感动摇，现实或工作压力",
    emotion: "惊慌",
    healthCue: "留意血压与交感神经紧张",
    advice: "睡前做放松伸展，减少咖啡因摄入",
  },
  {
    keyword: "falling",
    locale: "en",
    symbolism: "Shaken security; pressure from life/work",
    emotion: "Fearful",
    healthCue: "Monitor blood pressure and sympathetic tension",
    advice: "Evening stretches, taper caffeine intake",
  },
  {
    keyword: "追逐",
    locale: "zh",
    symbolism: "压力与回避",
    emotion: "紧张",
    healthCue: "神经疲劳",
    advice: "冥想，并写下当日目标",
  },
  {
    keyword: "chasing",
    locale: "en",
    symbolism: "Stress and avoidance",
    emotion: "Tense",
    healthCue: "Nervous fatigue",
    advice: "Meditate and jot down today's goals",
  },
];

export function findDreamKeywordFallback(keyword: string, locale: "zh" | "en") {
  if (!keyword) return null;
  const normalized = keyword.toLowerCase();
  const exact = BASE_DATA.find((item) => item.locale === locale && item.keyword.toLowerCase() === normalized);
  if (exact) return exact;
  const zhMatch = locale === "zh" ? BASE_DATA.find((item) => item.locale === "zh" && normalized.includes(item.keyword.toLowerCase())) : null;
  const enMatch =
    locale === "en"
      ? BASE_DATA.find((item) => item.locale === "en" && normalized.includes(item.keyword.toLowerCase()))
      : null;
  return exact ?? zhMatch ?? enMatch ?? null;
}

