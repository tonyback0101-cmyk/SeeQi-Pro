type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

type ConstitutionProfile = {
  constitution: string[];
  element: ElementKey | `${ElementKey}/${ElementKey}`;
};

type PalmData = {
  color?: "pale" | "pink" | "red" | "yellow" | "dark";
  lines?: {
    life?: "deep" | "shallow" | "broken" | "double";
    heart?: "long" | "short" | "curved" | "straight";
    head?: "clear" | "wavy" | "broken" | "forked";
  };
  texture?: "dry" | "moist" | "rough" | "smooth";
};

type TongueData = {
  color?: "pale" | "red" | "crimson" | "purple" | "dark" | "normal";
  coating?: "thin" | "thick" | "yellow" | "greasy" | "none" | "peel";
  shape?: "swollen" | "teethmark" | "thin" | "cracked" | "normal";
};

type BirthData = {
  year?: number;
  month?: number;
  day?: number;
  hourBranch?: "zi" | "chou" | "yin" | "mao" | "chen" | "si" | "wu" | "wei" | "shen" | "you" | "xu" | "hai";
  hemisphere?: "north" | "south";
};

type ConstitutionAdvice = {
  diet: string[];
  avoid: string[];
  exercise: string[];
  acupoints: string[];
  herbs?: string[];
  routines?: string[];
};

type ConstitutionAnalysisResult = {
  primaryConstitutions: string[];
  secondaryConstitutions: string[];
  elementScores: Record<ElementKey, number>;
  elementAdvice: Record<ElementKey, ConstitutionAdvice>;
  highlights: string[];
  focusAreas: string[];
  summary: string;
};

const PALM_ANALYSIS: {
  color: Record<Required<PalmData>["color"], ConstitutionProfile>;
  lines: {
    life: Record<NonNullable<PalmData["lines"]>["life"], string>;
    heart: Record<NonNullable<PalmData["lines"]>["heart"], string>;
    head: Record<NonNullable<PalmData["lines"]>["head"], string>;
  };
  texture: Record<Required<PalmData>["texture"], { constitution: string; advice: string }>;
} = {
  color: {
    pale: { constitution: ["阳虚", "气虚"], element: "metal/earth" },
    pink: { constitution: ["平和体质"], element: "wood" },
    red: { constitution: ["阴虚", "湿热"], element: "fire" },
    yellow: { constitution: ["脾虚", "湿阻"], element: "earth" },
    dark: { constitution: ["血瘀", "气滞"], element: "water" },
  },
  lines: {
    life: {
      deep: "生命力充沛，注意维持规律作息",
      shallow: "元气偏弱，宜加强锻炼与补气",
      broken: "阶段性健康挑战，必要时寻求专业评估",
      double: "恢复能力佳，但避免过度透支",
    },
    heart: {
      long: "情感丰富，需防情绪过度投入",
      short: "理性主导，适度释放情绪",
      curved: "情绪波动较大，建议冥想调息",
      straight: "思维敏捷，注意心胸放松",
    },
    head: {
      clear: "逻辑清晰，学习吸收快",
      wavy: "情绪影响思考，需稳定心绪",
      broken: "专注力易分散，建议练习正念",
      forked: "具备多元思考力，重在选择重点",
    },
  },
  texture: {
    dry: { constitution: "津液不足", advice: "多补水分，适量食用芝麻、银耳" },
    moist: { constitution: "气血调和", advice: "维持当前养生节奏" },
    rough: { constitution: "肝郁气滞", advice: "尝试太极、八段锦舒展筋络" },
    smooth: { constitution: "气血流畅", advice: "适度运动以巩固状态" },
  },
};

const TONGUE_ANALYSIS: {
  color: Record<Required<TongueData>["color"], string>;
  coating: Record<Required<TongueData>["coating"], string>;
  shape: Record<Required<TongueData>["shape"], string>;
} = {
  color: {
    pale: "气血不足，偏阳虚体质",
    red: "内热偏盛，注意滋阴清热",
    crimson: "阴虚火旺，需清心安神",
    purple: "血瘀气滞，留意循环系统",
    dark: "寒凝血瘀，宜温养阳气",
    normal: "颜色和润，体质相对平和",
  },
  coating: {
    thin: "胃气正常，运化平衡",
    thick: "湿气偏重，建议健脾祛湿",
    yellow: "湿热内蕴，可适量饮青籽茶、莲心",
    greasy: "痰湿内阻，减少油腻食物",
    none: "胃阴不足，注意补水与滋阴",
    peel: "胃气受损，慢慢调理饮食",
  },
  shape: {
    swollen: "脾虚水湿内停，易浮肿",
    teethmark: "脾气不足，注意运脾健胃",
    thin: "阴血不足，适合滋补",
    cracked: "津液亏虚，补水护阴",
    normal: "形态平衡，继续保持",
  },
};

const ELEMENT_ADVICE: Record<ElementKey, ConstitutionAdvice> = {
  wood: {
    diet: ["绿色蔬菜", "酸味食物", "小麦胚芽"],
    avoid: ["过度油炸", "长时间熬夜", "暴怒情绪"],
    exercise: ["伸展运动", "户外散步", "太极"],
    acupoints: ["太冲穴", "行间穴"],
    herbs: ["柴胡", "玫瑰花"],
    routines: ["定期深呼吸", "户外亲近绿植"],
  },
  fire: {
    diet: ["苦瓜", "莲子", "百合"],
    avoid: ["烧烤", "烈酒", "咖啡因过量"],
    exercise: ["冥想", "瑜伽", "轻度有氧"],
    acupoints: ["心俞穴", "神门穴"],
    herbs: ["麦冬", "丹参"],
    routines: ["规律作息", "睡前清静心"] ,
  },
  earth: {
    diet: ["小米粥", "山药", "南瓜"],
    avoid: ["生冷", "暴饮暴食", "过甜"],
    exercise: ["快走", "核心力量训练"],
    acupoints: ["脾俞穴", "足三里"],
    herbs: ["黄芪", "党参"],
    routines: ["定时进餐", "饭后暖腹"],
  },
  metal: {
    diet: ["梨子", "白木耳", "百合"],
    avoid: ["过辣", "烟酒"],
    exercise: ["呼吸练习", "慢跑"],
    acupoints: ["肺俞穴", "列缺穴"],
    herbs: ["沙参", "银杏叶"],
    routines: ["保持室内空气清新", "适度日光浴"],
  },
  water: {
    diet: ["黑豆", "芝麻", "海参"],
    avoid: ["寒凉生冷", "过咸"],
    exercise: ["游泳", "温和力量训练"],
    acupoints: ["肾俞穴", "涌泉穴"],
    herbs: ["枸杞", "熟地黄"],
    routines: ["早睡早起", "脚底热水泡"],
  },
};

const STEM_ELEMENT_MAP: Record<number, ElementKey> = {
  0: "metal",
  1: "metal",
  2: "water",
  3: "water",
  4: "wood",
  5: "wood",
  6: "fire",
  7: "fire",
  8: "earth",
  9: "earth",
};

const MONTH_ELEMENT_MAP: Record<number, ElementKey> = {
  1: "water",
  2: "wood",
  3: "wood",
  4: "earth",
  5: "earth",
  6: "fire",
  7: "fire",
  8: "earth",
  9: "metal",
  10: "metal",
  11: "water",
  12: "water",
};

const BRANCH_ELEMENT_MAP: Record<NonNullable<BirthData["hourBranch"]>, ElementKey> = {
  zi: "water",
  chou: "earth",
  yin: "wood",
  mao: "wood",
  chen: "earth",
  si: "fire",
  wu: "fire",
  wei: "earth",
  shen: "metal",
  you: "metal",
  xu: "earth",
  hai: "water",
};

function normalizeElement(element: ConstitutionProfile["element"]): ElementKey[] {
  if (element.includes("/")) {
    return element.split("/") as ElementKey[];
  }
  return [element as ElementKey];
}

function initScore(): Record<ElementKey, number> {
  return {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
}

function deriveBirthElements(birthData: BirthData): ElementKey[] {
  const elements: ElementKey[] = [];
  if (birthData.year !== undefined) {
    const stemElement = STEM_ELEMENT_MAP[Math.abs(birthData.year) % 10];
    elements.push(stemElement);
  }
  if (birthData.month !== undefined && MONTH_ELEMENT_MAP[birthData.month]) {
    elements.push(MONTH_ELEMENT_MAP[birthData.month]);
  }
  if (birthData.hourBranch) {
    elements.push(BRANCH_ELEMENT_MAP[birthData.hourBranch]);
  }
  return elements;
}

export function analyzeConstitution(palmData: PalmData, tongueData: TongueData, birthData: BirthData = {}): ConstitutionAnalysisResult {
  const scores = initScore();
  const constitutions = new Set<string>();
  const highlights: string[] = [];
  const focusAreas: string[] = [];

  if (palmData.color && PALM_ANALYSIS.color[palmData.color]) {
    const profile = PALM_ANALYSIS.color[palmData.color];
    profile.constitution.forEach((item) => constitutions.add(item));
    normalizeElement(profile.element).forEach((element) => {
      scores[element] += 2;
    });
    highlights.push(`手相颜色显示：${profile.constitution.join("、")}（关联元素：${profile.element}）`);
  }

  if (palmData.texture && PALM_ANALYSIS.texture[palmData.texture]) {
    const info = PALM_ANALYSIS.texture[palmData.texture];
    constitutions.add(info.constitution);
    focusAreas.push(`手掌质地提示：${info.advice}`);
  }

  if (palmData.lines) {
    if (palmData.lines.life) highlights.push(`生命线：${PALM_ANALYSIS.lines.life[palmData.lines.life]}`);
    if (palmData.lines.heart) focusAreas.push(`感情线：${PALM_ANALYSIS.lines.heart[palmData.lines.heart]}`);
    if (palmData.lines.head) focusAreas.push(`智慧线：${PALM_ANALYSIS.lines.head[palmData.lines.head]}`);
  }

  if (tongueData.color && TONGUE_ANALYSIS.color[tongueData.color]) {
    focusAreas.push(`舌色提示：${TONGUE_ANALYSIS.color[tongueData.color]}`);
    if (tongueData.color === "pale") scores.metal += 1;
    if (tongueData.color === "red" || tongueData.color === "crimson") scores.fire += 2;
    if (tongueData.color === "purple" || tongueData.color === "dark") scores.water += 2;
  }

  if (tongueData.coating && TONGUE_ANALYSIS.coating[tongueData.coating]) {
    focusAreas.push(`舌苔提示：${TONGUE_ANALYSIS.coating[tongueData.coating]}`);
    if (tongueData.coating === "thick" || tongueData.coating === "greasy" || tongueData.coating === "yellow") {
      scores.earth += 2;
    }
    if (tongueData.coating === "none" || tongueData.coating === "peel") {
      scores.fire += 1;
    }
  }

  if (tongueData.shape && TONGUE_ANALYSIS.shape[tongueData.shape]) {
    focusAreas.push(`舌形提示：${TONGUE_ANALYSIS.shape[tongueData.shape]}`);
    if (tongueData.shape === "swollen" || tongueData.shape === "teethmark") scores.earth += 1;
    if (tongueData.shape === "thin" || tongueData.shape === "cracked") scores.water += 1;
  }

  const birthElements = deriveBirthElements(birthData);
  if (birthElements.length) {
    birthElements.forEach((element) => {
      scores[element] += 1;
    });
    highlights.push(`出生信息推算五行：${birthElements.join("、")}`);
  }

  const sortedElements = Object.entries(scores).sort(([, a], [, b]) => b - a) as [ElementKey, number][];
  const dominantElements = sortedElements.slice(0, 3).map(([element]) => element);
  dominantElements.forEach((element) => focusAreas.push(`当前重点调理元素：${element}`));

  const allConstitutions = Array.from(constitutions);
  const primaryConstitutions = allConstitutions.slice(0, 2);
  const secondaryConstitutions = allConstitutions.slice(2);

  const elementAdvice = dominantElements.reduce<Record<ElementKey, ConstitutionAdvice>>((acc, element) => {
    acc[element] = ELEMENT_ADVICE[element];
    return acc;
  }, {} as Record<ElementKey, ConstitutionAdvice>);

  const summary = `主导体质：${primaryConstitutions.join("、") || "平和体质"}；次要提示：${secondaryConstitutions.join("、") || "暂无"}。关键五行：${dominantElements.join("、") || "均衡"}，建议依序调理。`;

  return {
    primaryConstitutions,
    secondaryConstitutions,
    elementScores: scores,
    elementAdvice,
    highlights,
    focusAreas,
    summary,
  };
}

export type { PalmData, TongueData, BirthData, ConstitutionAnalysisResult };
