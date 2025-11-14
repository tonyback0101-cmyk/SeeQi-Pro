type Locale = "zh" | "en";

export type DreamOption = {
  value: string;
  label: Record<Locale, string>;
};

export const DREAM_TYPES: DreamOption[] = [
  { value: "adventure", label: { zh: "冒险 / 探索", en: "Adventure / Exploration" } },
  { value: "relationship", label: { zh: "关系互动", en: "Relationships" } },
  { value: "work", label: { zh: "事业 / 学业", en: "Work / Study" } },
  { value: "family", label: { zh: "家庭日常", en: "Family Life" } },
  { value: "stress", label: { zh: "焦虑 / 危机", en: "Stress / Crisis" } },
  { value: "mystic", label: { zh: "象征 / 玄秘", en: "Symbolic / Mystic" } },
  { value: "health", label: { zh: "身体 / 健康", en: "Body / Health" } },
  { value: "travel", label: { zh: "旅行 / 迁移", en: "Travel / Transition" } },
];

export const DREAM_EMOTIONS: DreamOption[] = [
  { value: "joy", label: { zh: "喜悦", en: "Joy" } },
  { value: "calm", label: { zh: "平静", en: "Calm" } },
  { value: "hope", label: { zh: "期待", en: "Hopeful" } },
  { value: "confusion", label: { zh: "困惑", en: "Confused" } },
  { value: "fear", label: { zh: "恐惧", en: "Fearful" } },
  { value: "anxiety", label: { zh: "焦虑", en: "Anxious" } },
  { value: "sadness", label: { zh: "悲伤", en: "Sad" } },
  { value: "anger", label: { zh: "愤怒", en: "Angry" } },
];

export const DREAM_TAGS: DreamOption[] = [
  { value: "water", label: { zh: "水 / 雨", en: "Water / Rain" } },
  { value: "fire", label: { zh: "火焰 / 光", en: "Fire / Light" } },
  { value: "flight", label: { zh: "飞行 / 腾空", en: "Flying" } },
  { value: "falling", label: { zh: "坠落 / 失足", en: "Falling" } },
  { value: "chase", label: { zh: "追逐 / 逃跑", en: "Chasing" } },
  { value: "teeth", label: { zh: "牙齿 / 口腔", en: "Teeth" } },
  { value: "mirror", label: { zh: "镜子 / 影像", en: "Mirror / Image" } },
  { value: "snake", label: { zh: "蛇 / 动物", en: "Snake / Animal" } },
  { value: "rain", label: { zh: "雨 / 洪水", en: "Rain / Flood" } },
  { value: "wedding", label: { zh: "婚礼 / 承诺", en: "Wedding" } },
  { value: "child", label: { zh: "孩子 / 新生", en: "Child / Newborn" } },
  { value: "pregnancy", label: { zh: "怀孕 / 孕育", en: "Pregnancy" } },
  { value: "car", label: { zh: "车辆 / 旅程", en: "Car / Journey" } },
  { value: "house", label: { zh: "房屋 / 空间", en: "House / Space" } },
  { value: "mountain", label: { zh: "山峰 / 攀登", en: "Mountain" } },
  { value: "exam", label: { zh: "考试 / 测试", en: "Exam / Test" } },
];

export function getOptionLabel(options: DreamOption[], value: string | null | undefined, locale: Locale): string | null {
  if (!value) return null;
  const option = options.find((item) => item.value === value);
  return option ? option.label[locale] : null;
}

export function getTagLabels(values: string[] | undefined | null, locale: Locale): string[] {
  if (!values || values.length === 0) return [];
  const map = new Map(DREAM_TAGS.map((item) => [item.value, item.label[locale]]));
  return values
    .map((value) => map.get(value) ?? value)
    .filter((label, index, array) => Boolean(label) && array.indexOf(label) === index) as string[];
}

