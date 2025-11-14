"use client";

/**
 * 周易八卦生成逻辑
 *
 * - 采用三枚铜钱法模拟（亦可扩展蓍草法）
 * - 支持生成本卦、变卦、卦辞与爻辞
 * - 提供现代语境下的生活建议
 *
 * 说明：本模块旨在提供文化与哲学层面的启发，不涉及占卜迷信，
 *      结果仅供文化、娱乐与自省参考。
 */

export type CoinMethod = "coins" | "yarrow";

export type LineValue = 6 | 7 | 8 | 9;

export type LineType = "yin" | "yang";

export type LinePosition = 1 | 2 | 3 | 4 | 5 | 6;

export type HexagramKey = string; // 例如 "111111"

export interface HexagramMeta {
  id: HexagramKey;
  name: string;
  description: string;
  judgement: string;
  image: string;
  lineTexts: string[];
  modernAdvice: string;
}

export interface IchingLine {
  position: LinePosition;
  value: LineValue;
  type: LineType;
  isChanging: boolean;
  traditionalMeaning: string;
  modernReflection: string;
}

export interface IchingReading {
  method: CoinMethod;
  baseHexagram: HexagramMeta;
  changingHexagram?: HexagramMeta;
  lines: IchingLine[];
  guidanceSummary: string;
}

export interface GenerateOptions {
  method?: CoinMethod;
  seed?: number;
}

const HEXAGRAM_DATABASE: Record<HexagramKey, HexagramMeta> = {
  // 乾为天
  "111111": {
    id: "111111",
    name: "乾",
    description: "纯阳之象，象征生成与开创。",
    judgement: "大哉乾元，万物资始，乃统天。",
    image: "天行健，君子以自强不息。",
    lineTexts: [
      "初九：潜龙勿用。",
      "九二：见龙在田，利见大人。",
      "九三：君子终日乾乾，夕惕若厉。",
      "九四：或跃在渊，无咎。",
      "九五：飞龙在天，利见大人。",
      "上九：亢龙有悔。",
    ],
    modernAdvice:
      "保持长期主义，循序渐进。当具备条件时主动承担责任，同时警惕自我膨胀。",
  },
  // 坤为地
  "000000": {
    id: "000000",
    name: "坤",
    description: "纯阴之象，象征承载与滋养。",
    judgement: "至哉坤元，万物资生，乃顺承天。",
    image: "地势坤，君子以厚德载物。",
    lineTexts: [
      "初六：履霜，坚冰至。",
      "六二：直方大，不习无不利。",
      "六三：含章可贞，或从王事，无成有终。",
      "六四：括囊，无咎无誉。",
      "六五：黄裳，元吉。",
      "上六：龙战于野，其血玄黄。",
    ],
    modernAdvice:
      "拥抱耐心与包容，为团队与关系提供稳定土壤，以柔克刚，同时守住底线。",
  },
  // 水雷屯
  "010001": {
    id: "010001",
    name: "屯",
    description: "万物初生，艰难中孕育新机。",
    judgement: "元亨，利贞。勿用有攸往，利建侯。",
    image: "云雷屯，君子以经纶。",
    lineTexts: [
      "初九：磐桓，利居贞。利建侯。",
      "六二：屯如邅如，乘马班如，匪寇婚媾。",
      "六三：即鹿无虞，惟入于林中，君子几不如舍，往吝。",
      "六四：乘马班如，求婚媾，往吉，无不利。",
      "九五：屯其膏，小贞吉，大贞凶。",
      "上六：乘马班如，泣血涟如。",
    ],
    modernAdvice:
      "创业或新计划初期会遇到阻力，重在整合资源、寻求伙伴，并保持灵活路径。",
  },
  // 火风鼎
  "101110": {
    id: "101110",
    name: "鼎",
    description: "革故鼎新，调和五味，器成而用。",
    judgement: "元吉，亨。",
    image: "木上有火，鼎。君子以正位凝命。",
    lineTexts: [
      "初六：鼎颠趾，利出否，得妾以其子，无咎。",
      "九二：鼎有实，我仇有疾，不我能即，吉。",
      "九三：鼎耳革，其行塞，雉膏不食。方雨亏悔，终吉。",
      "九四：鼎折足，覆公餗，其形渥，凶。",
      "六五：鼎黄耳金铉，利贞。",
      "上九：鼎玉铉，大吉，无不利。",
    ],
    modernAdvice:
      "是整合与升级的时期，适合重塑团队结构或生活方式，讲究节奏与火候。",
  },
};

const GENERIC_LINE_GUIDANCE: Record<LineType, { classical: string; modern: string }> = {
  yang: {
    classical: "阳爻：积极外向，代表行动与突破。",
    modern: "保持推进，但需警惕过度用力与冒失。",
  },
  yin: {
    classical: "阴爻：内敛包容，代表蓄势与体察。",
    modern: "善用倾听与等待，寻找柔性解决方案。",
  },
};

const DEFAULT_HEXAGRAM: HexagramMeta = {
  id: "000000",
  name: "坤",
  description: "纯阴之象，象征承载与滋养。",
  judgement: "至哉坤元，万物资生，乃顺承天。",
  image: "地势坤，君子以厚德载物。",
  lineTexts: [
    "初六：履霜，坚冰至。",
    "六二：直方大，不习无不利。",
    "六三：含章可贞，或从王事，无成有终。",
    "六四：括囊，无咎无誉。",
    "六五：黄裳，元吉。",
    "上六：龙战于野，其血玄黄。",
  ],
  modernAdvice: "拥抱耐心与包容，为团队与关系提供稳定土壤，以柔克刚，同时守住底线。",
};

const RANDOM_SEED_COEFFICIENT = 9301;
const RANDOM_SEED_INCREMENT = 49297;
const RANDOM_SEED_MODULUS = 233280;

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % RANDOM_SEED_MODULUS;
  }

  next() {
    this.seed = (this.seed * RANDOM_SEED_COEFFICIENT + RANDOM_SEED_INCREMENT) % RANDOM_SEED_MODULUS;
    return this.seed / RANDOM_SEED_MODULUS;
  }
}

function createRandomGenerator(seed?: number) {
  if (typeof seed === "number") {
    const seeded = new SeededRandom(seed);
    return () => seeded.next();
  }
  return Math.random;
}

function tossCoins(randomFn: () => number): LineValue {
  let total = 0;
  for (let i = 0; i < 3; i += 1) {
    total += randomFn() < 0.5 ? 2 : 3;
  }
  return total as LineValue;
}

function yarrowMethod(randomFn: () => number): LineValue {
  const results: LineValue[] = [6, 7, 8, 9];
  const probabilities = [1, 5, 7, 3]; // 蓍草法概率分布
  const sum = probabilities.reduce((acc, value) => acc + value, 0);
  const roll = randomFn() * sum;
  let cumulative = 0;
  for (let i = 0; i < results.length; i += 1) {
    cumulative += probabilities[i];
    if (roll < cumulative) {
      return results[i];
    }
  }
  return results[results.length - 1];
}

function getLineValue(method: CoinMethod, randomFn: () => number): LineValue {
  if (method === "yarrow") {
    return yarrowMethod(randomFn);
  }
  return tossCoins(randomFn);
}

function toLineType(value: LineValue): LineType {
  return value === 7 || value === 9 ? "yang" : "yin";
}

function isChanging(value: LineValue) {
  return value === 6 || value === 9;
}

function lineToBit(value: LineValue) {
  return toLineType(value) === "yang" ? "1" : "0";
}

function invertLine(value: LineValue): LineValue {
  switch (value) {
    case 6:
      return 7;
    case 7:
      return 6;
    case 8:
      return 9;
    case 9:
      return 8;
    default:
      return value;
  }
}

function findHexagram(key: HexagramKey): HexagramMeta {
  return HEXAGRAM_DATABASE[key] ?? DEFAULT_HEXAGRAM;
}

function buildHexagramKey(lines: LineValue[]): HexagramKey {
  return lines
    .map((line) => lineToBit(line))
    .reverse()
    .join("");
}

function describeLine(position: LinePosition, type: LineType, isChangingFlag: boolean): { classic: string; modern: string } {
  const base = GENERIC_LINE_GUIDANCE[type];
  const positionNames = ["初", "二", "三", "四", "五", "上"];
  const branch =
    type === "yang"
      ? ["潜龙", "见龙", "慎行", "跃渊", "飞龙", "亢龙"]
      : ["履霜", "直方", "含章", "括囊", "黄裳", "龙战"];
  const classic = `${positionNames[position - 1]}${type === "yang" ? "九" : "六"}：${
    branch[position - 1]
  }。${base.classical}${isChangingFlag ? "（阴阳转换，需关注变化点）" : ""}`;
  const modern = `${base.modern}${isChangingFlag ? " 变化提醒：留意该位置的局势转折。" : ""}`;
  return { classic, modern };
}

function summarizeGuidance(meta: HexagramMeta, lines: IchingLine[], locale: Locale) {
  const changingLines = lines.filter((line) => line.isChanging);
  if (!changingLines.length) {
    return locale === "zh"
      ? `此卦强调「${meta.name}」之象：${meta.modernAdvice}`
      : `Focus on the spirit of ${meta.name}: ${meta.modernAdvice}`;
  }
  const focus = changingLines
    .map((line) => (locale === "zh" ? `第${line.position}爻` : `line ${line.position}`))
    .join(locale === "zh" ? "、" : " & ");
  return locale === "zh"
    ? `变化重点落在 ${focus}。请结合卦辞与变卦含义，谨慎调适。`
    : `Transformations appear at ${focus}. Reflect on the judgement and changing lines to adapt wisely.`;
}

export function generateIchingReading(options: GenerateOptions = {}): IchingReading {
  const method: CoinMethod = options.method ?? "coins";
  const randomFn = createRandomGenerator(options.seed);

  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i += 1) {
    lines.push(getLineValue(method, randomFn));
  }

  const baseKey = buildHexagramKey(lines);
  const baseHexagram = findHexagram(baseKey);

  const invertedLines = lines.map((line) => (isChanging(line) ? invertLine(line) : line));
  const hasChanges = invertedLines.some((line, index) => line !== lines[index]);
  const changingHexagram = hasChanges ? findHexagram(buildHexagramKey(invertedLines)) : undefined;

  const ichingLines: IchingLine[] = lines.map((value, index) => {
    const position = (index + 1) as LinePosition;
    const type = toLineType(value);
    const changing = isChanging(value);
    const descriptions = describeLine(position, type, changing);
    const classical =
      baseHexagram.lineTexts[index] ?? `${type === "yang" ? "九" : "六"}${position}：${descriptions.classic}`;
    return {
      position,
      value,
      type,
      isChanging: changing,
      traditionalMeaning: baseHexagram.lineTexts[index] ?? classical,
      modernReflection: descriptions.modern,
    };
  });

  const guidanceSummary = summarizeGuidance(
    baseHexagram,
    ichingLines,
    options.seed && options.seed % 2 === 0 ? "en" : "zh"
  );

  return {
    method,
    baseHexagram,
    changingHexagram,
    lines: ichingLines,
    guidanceSummary,
  };
}

export default {
  generateIchingReading,
};

