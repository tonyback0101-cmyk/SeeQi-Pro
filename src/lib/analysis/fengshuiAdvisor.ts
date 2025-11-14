import type { FengshuiRecordData } from "@/types/assessment";

type Locale = "zh" | "en";

type FengshuiGoalAdvice = {
  goal: string;
  suggestions: string[];
};

export type FengshuiAnalysis = {
  headline: string;
  elementLabel: string;
  description: string;
  spaceTips: string[];
  ritualTips: string[];
  goals: FengshuiGoalAdvice[];
};

const RESIDENCE_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    apartment: "现代公寓或高层建筑",
    house: "独栋或联排住宅",
    studio: "单身公寓 / 开放式空间",
    other: "其他类型居住空间",
  },
  en: {
    apartment: "Modern apartment / high-rise",
    house: "Detached or townhouse residence",
    studio: "Studio / open loft",
    other: "Other residence type",
  },
};

const ELEMENT_MAP: Record<string, "water" | "fire" | "wood" | "metal" | "earth"> = {
  north: "water",
  south: "fire",
  east: "wood",
  west: "metal",
  complex: "earth",
};

const ELEMENT_LABELS: Record<Locale, Record<"water" | "fire" | "wood" | "metal" | "earth", string>> = {
  zh: {
    water: "水 · 流动与智慧",
    fire: "火 · 热情与启发",
    wood: "木 · 生发与成长",
    metal: "金 · 结构与聚焦",
    earth: "土 · 稳定与承载",
  },
  en: {
    water: "Water · Flow & wisdom",
    fire: "Fire · Passion & illumination",
    wood: "Wood · Growth & expansion",
    metal: "Metal · Structure & focus",
    earth: "Earth · Stability & grounding",
  },
};

const ELEMENT_DESCRIPTIONS: Record<Locale, Record<"water" | "fire" | "wood" | "metal" | "earth", string>> = {
  zh: {
    water: "以柔克刚，强调动线顺畅与光影变化，适合加入蓝/黑色与水元素装饰。",
    fire: "空间宜明亮温暖，可使用红橙色调及香薰蜡烛，增强能量与行动力。",
    wood: "注重植物与木质材质的运用，保持良好通风、引入自然光。",
    metal: "适合简约秩序的布置，使用金属线条或白色系强化专注力。",
    earth: "强调稳定与承载，可使用米色与陶土材质，维持规律作息。",
  },
  en: {
    water: "Embrace fluid circulation and gentle lighting; add blue/black accents or water features.",
    fire: "Keep the space warm and bright with red-orange accents or candles to ignite motivation.",
    wood: "Introduce plants, wooden textures, and fresh airflow to encourage continuous growth.",
    metal: "Favour minimalist layouts, white tones, and metallic lines to sharpen focus.",
    earth: "Highlight grounding elements with beige or clay materials; maintain a steady routine.",
  },
};

const SPACE_TIPS: Record<Locale, Record<string, string[]>> = {
  zh: {
    apartment: [
      "注意阳台与窗户的采光，引入自然风。",
      "利用玄关铺设地垫，形成缓冲气场。",
    ],
    house: [
      "可在庭院设置水景或绿植，调节五行循环。",
      "保持门厅整洁，形成良好纳气路径。",
    ],
    studio: [
      "用屏风或地毯划分功能区，避免气场混杂。",
      "床头背靠实体墙，提升安全感。",
    ],
    other: ["根据实际空间灵活调整动线与光照，保持适度留白。"],
  },
  en: {
    apartment: [
      "Maximize natural airflow and light via balcony or windows.",
      "Use an entryway mat to create a gentle energy buffer.",
    ],
    house: [
      "Add water features or thriving plants outdoors to balance the five elements.",
      "Keep the foyer tidy to welcome supportive energy.",
    ],
    studio: [
      "Use screens or rugs to define zones and prevent energy scattering.",
      "Anchor the bed against a solid wall to enhance security.",
    ],
    other: ["Adapt circulation and lighting to the actual layout, leaving intentional breathing space."],
  },
};

const RITUAL_TIPS: Record<Locale, Record<"water" | "fire" | "wood" | "metal" | "earth", string[]>> = {
  zh: {
    water: ["傍晚可点香薰或听柔和水声，帮助身心过渡。", "保持玄关明亮整洁，象征财气流动。"],
    fire: ["早晨进行日光冥想或快步行走，点燃动力。", "睡前可写感恩清单，稳定心火。"],
    wood: ["每周安排自然散步或园艺活动，保持生机。", "适量使用柑橘类或草本香气提振。"],
    metal: ["设置固定工作/学习时段，形成专注节奏。", "定期断舍离，维持空间清爽。"],
    earth: ["坚持温热饮水与规律饮食，稳固脾胃。", "可在客厅摆放陶土或水晶装饰，增强安定感。"],
  },
  en: {
    water: ["Play calming water sounds or aromatherapy in the evening for smooth transitions.", "Keep the foyer bright and tidy to signify flowing abundance."],
    fire: ["Begin the day with sunlight breathing or brisk walking to ignite energy.", "Write a gratitude list at night to harmonise the heart fire."],
    wood: ["Schedule weekly nature walks or gardening to sustain vitality.", "Diffuse citrus or herbal scents for uplifting freshness."],
    metal: ["Block focused time slots for work/study to reinforce rhythm.", "Declutter regularly to maintain clarity in the space."],
    earth: ["Stay hydrated with warm beverages and consistent meals.", "Place clay or crystal decor in the living area for grounded comfort."],
  },
};

const GOAL_SUGGESTIONS: Record<
  Locale,
  Record<
    string,
    {
      label: string;
      tips: string[];
    }
  >
> = {
  zh: {
    health: {
      label: "养生调理",
      tips: ["床铺远离门窗直冲，头朝实墙而睡。", "加入四季对应的养生茶或汤品。"],
    },
    sleep: {
      label: "改善睡眠",
      tips: ["卧室保持遮光与适度湿度，避免过多电子产品。", "使用柔和香氛或呼吸练习，建立睡前仪式。"],
    },
    career: {
      label: "事业突破",
      tips: ["书桌背靠实墙，面向明亮采光。", "设置励志语句或成果展示角，巩固信心。"],
    },
    relationships: {
      label: "家庭关系",
      tips: ["餐桌保持整洁圆满，象征共享与团结。", "安排固定家庭交流时间，营造温暖氛围。"],
    },
    wealth: {
      label: "财运规划",
      tips: ["确认入口明亮通畅，象征财气进门。", "保留一处整齐的财位，可摆放聚宝盆或绿植。"],
    },
  },
  en: {
    health: {
      label: "Health & wellness",
      tips: ["Keep the bed away from direct drafts; rest with the head against a solid wall.", "Integrate seasonal tonics or herbal teas into daily routines."],
    },
    sleep: {
      label: "Deeper sleep",
      tips: ["Ensure blackout curtains and balanced humidity; limit electronics in the bedroom.", "Adopt a calming bedtime ritual with soft scents or breathing exercises."],
    },
    career: {
      label: "Career momentum",
      tips: ["Position the desk against a solid wall facing natural light.", "Create a vision corner with affirmations or achievements to reinforce confidence."],
    },
    relationships: {
      label: "Relationship harmony",
      tips: ["Keep the dining table uncluttered and balanced to symbolise unity.", "Schedule dedicated family connection time to nurture warmth."],
    },
    wealth: {
      label: "Wealth planning",
      tips: ["Maintain a bright, unobstructed entrance to welcome prosperity.", "Designate an organised prosperity area with a bowl or thriving plant."],
    },
  },
};

export function analyzeFengshui(data: FengshuiRecordData, locale: Locale): FengshuiAnalysis {
  const residenceLabel = RESIDENCE_LABELS[locale][data.residenceType] ?? RESIDENCE_LABELS[locale].other;
  const elementKey = ELEMENT_MAP[data.facingDirection] ?? "earth";
  const elementLabel = ELEMENT_LABELS[locale][elementKey];
  const description = ELEMENT_DESCRIPTIONS[locale][elementKey];

  const spaceTips = SPACE_TIPS[locale][data.residenceType] ?? SPACE_TIPS[locale].other;
  const ritualTips = RITUAL_TIPS[locale][elementKey];

  const goals: FengshuiGoalAdvice[] = (data.goals ?? []).map((goalKey) => {
    const goalData = GOAL_SUGGESTIONS[locale][goalKey];
    if (!goalData) {
      return {
        goal: goalKey,
        suggestions: locale === "zh" ? ["可根据个人目标进一步定制空间布置。"] : ["Tailor the space layout to suit this personal intention."],
      };
    }
    return {
      goal: goalData.label,
      suggestions: goalData.tips,
    };
  });

  const headline =
    locale === "zh"
      ? `${residenceLabel} · ${elementLabel}`
      : `${residenceLabel} · ${elementLabel}`;

  return {
    headline,
    elementLabel,
    description,
    spaceTips,
    ritualTips,
    goals,
  };
}

