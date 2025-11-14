export type SolarTermKey =
  | "lichun"
  | "yushui"
  | "jingzhe"
  | "chunfen"
  | "guyu"
  | "lixia"
  | "xiaoman"
  | "mangzhong"
  | "xiazhi"
  | "xiaoshu"
  | "dashu"
  | "liqiu"
  | "chushu"
  | "bailu"
  | "qiufen"
  | "hanlu"
  | "shuangjiang"
  | "lidong"
  | "xiaoxue"
  | "daxue"
  | "dongzhi"
  | "xiaohan"
  | "dahan";

export type SolarTermInsight = {
  key: SolarTermKey;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  advice: {
    diet: {
      zh: string[];
      en: string[];
    };
    routine: {
      zh: string[];
      en: string[];
    };
  };
  almanac: {
    favorable: {
      zh: string[];
      en: string[];
    };
    avoid: {
      zh: string[];
      en: string[];
    };
  };
  qi?: {
    index: number;
    emoji: string;
    phrase: {
      zh: string;
      en: string;
    };
    warning: {
      zh: string;
      en: string;
    };
  };
};

const SOLAR_TERMS: SolarTermInsight[] = [
  {
    key: "lidong",
    name: { zh: "立冬", en: "Start of Winter" },
    description: {
      zh: "天地肃杀，万物闭藏，宜温阳护肾。",
      en: "Heaven and earth turn cold; focus on preserving yang and warming the kidneys.",
    },
    advice: {
      diet: {
        zh: ["黑芝麻粥", "山药百合羹", "胡桃炖乳鸽"],
        en: ["Black sesame porridge", "Chinese yam & lily bulb soup", "Walnut stewed pigeon"],
      },
      routine: {
        zh: ["早睡悠起，避寒保暖", "泡脚按摩涌泉穴"],
        en: ["Sleep early, keep warm", "Foot bath with Yongquan acupoint massage"],
      },
    },
    almanac: {
      favorable: {
        zh: ["温补进补", "家族团聚", "乔迁入宅"],
        en: ["Nourishing meals", "Family gatherings", "Moving into a new home"],
      },
      avoid: {
        zh: ["远行探险", "露天婚礼"],
        en: ["Long-distance expeditions", "Outdoor weddings"],
      },
    },
    qi: {
      index: 72,
      emoji: "❄️",
      phrase: {
        zh: "阳气渐收，适合静养蓄力。",
        en: "Yang energy withdraws — a good time to recuperate quietly.",
      },
      warning: {
        zh: "北方风寒强，注意腰腹保暖。",
        en: "Northern winds bite; keep your core warm.",
      },
    },
  },
  {
    key: "lichun",
    name: { zh: "立春", en: "Beginning of Spring" },
    description: {
      zh: "阳气萌动，肝木初生，宜舒肝解郁。",
      en: "Yang energy sprouts; nourish the liver and release stagnation.",
    },
    advice: {
      diet: {
        zh: ["春笋炒豆干", "枸杞菊花茶"],
        en: ["Stir-fried bamboo shoots with tofu", "Goji & chrysanthemum tea"],
      },
      routine: {
        zh: ["晨起伸展，户外踏青", "保持情绪舒畅"],
        en: ["Morning stretches outdoors", "Maintain a relaxed mood"],
      },
    },
    almanac: {
      favorable: {
        zh: ["开市开工", "结交新友"],
        en: ["Start new ventures", "Make new connections"],
      },
      avoid: {
        zh: ["长夜娱乐", "剧烈运动"],
        en: ["Staying up late", "Intense workouts"],
      },
    },
    qi: {
      index: 86,
      emoji: "🌸",
      phrase: {
        zh: "今日气运上升，宜表达与行动。",
        en: "Luck is rising—lean into expression and action.",
      },
      warning: {
        zh: "东南方向气场略弱，不宜远行。",
        en: "Eastern-southeast flow is soft; avoid long journeys that way.",
      },
    },
  },
  {
    key: "xiaoman",
    name: { zh: "小满", en: "Grain Buds" },
    description: {
      zh: "万物渐盈未满，调养脾胃、平衡湿热。",
      en: "All things swell yet are not full; balance damp-heat and support the spleen.",
    },
    advice: {
      diet: {
        zh: ["薏米绿豆粥", "荷叶山楂饮"],
        en: ["Coix seed & mung bean porridge", "Lotus leaf hawthorn tea"],
      },
      routine: {
        zh: ["午后小憩，舒缓心火", "黄昏轻散步"],
        en: ["Take a midday break to ease heart fire", "Light walks at dusk"],
      },
    },
    almanac: {
      favorable: {
        zh: ["整理居所", "计划夏季运动"],
        en: ["Organize living space", "Plan summer workouts"],
      },
      avoid: {
        zh: ["情绪激烈争执", "长时间暴晒"],
        en: ["Heated arguments", "Prolonged sun exposure"],
      },
    },
    qi: {
      index: 78,
      emoji: "🌾",
      phrase: {
        zh: "顺势而为，宜收敛心火。",
        en: "Go with the flow—cool and gather the heart fire.",
      },
      warning: {
        zh: "正午炎热，避免暴晒。",
        en: "Noon heat peaks; steer clear of harsh sun.",
      },
    },
  },
  {
    key: "xiazhi",
    name: { zh: "夏至", en: "Summer Solstice" },
    description: {
      zh: "阳极转阴，心火偏旺，宜清心安神。",
      en: "Yang is at its peak; clear the heart fire and calm the mind.",
    },
    advice: {
      diet: {
        zh: ["绿豆薏米汤", "莲子百合粥"],
        en: ["Mung bean & coix seed soup", "Lotus seed lily porridge"],
      },
      routine: {
        zh: ["午后小憩，避免暴晒", "练习冥想调整呼吸"],
        en: ["Take a short nap and avoid direct sun", "Meditation with gentle breathing"],
      },
    },
    almanac: {
      favorable: {
        zh: ["婚礼喜庆", "出行旅行"],
        en: ["Weddings", "Travel plans"],
      },
      avoid: {
        zh: ["熬夜加班", "高温作业"],
        en: ["Working overtime at night", "High-heat labor"],
      },
    },
    qi: {
      index: 78,
      emoji: "☀️",
      phrase: {
        zh: "火气偏旺，宜清心安神。",
        en: "Heart fire runs high — lean into calm and clarity.",
      },
      warning: {
        zh: "正午燥热，避免久晒与躁动。",
        en: "Midday heat drains qi; avoid overexposure and restlessness.",
      },
    },
  },
  {
    key: "qiufen",
    name: { zh: "秋分", en: "Autumn Equinox" },
    description: {
      zh: "阴阳均衡，燥气渐显，宜滋阴润肺。",
      en: "Yin and yang balance; dryness rises. Moisten the lungs and nourish yin.",
    },
    advice: {
      diet: {
        zh: ["雪梨银耳汤", "百合炖南瓜"],
        en: ["Snow pear with white fungus soup", "Pumpkin stewed with lily"],
      },
      routine: {
        zh: ["适度慢跑，保持舒展", "睡前热水泡手足"],
        en: ["Light jogging with stretches", "Warm hand & foot soak before bed"],
      },
    },
    almanac: {
      favorable: {
        zh: ["签约合作", "学习进修"],
        en: ["Signing contracts", "Advanced learning"],
      },
      avoid: {
        zh: ["动土破土", "长距离搬迁"],
        en: ["Groundbreaking construction", "Long relocations"],
      },
    },
    qi: {
      index: 82,
      emoji: "🍁",
      phrase: {
        zh: "阴阳均衡，专注收敛与沉淀。",
        en: "Balance reigns — focus on consolidation and reflection.",
      },
      warning: {
        zh: "西北方燥风渐起，外出注意补水润肺。",
        en: "Dry northern winds arrive; hydrate and protect your lungs.",
      },
    },
  },
  {
    key: "dongzhi",
    name: { zh: "冬至", en: "Winter Solstice" },
    description: {
      zh: "阴极转阳，肾气保藏，宜补肾培本。",
      en: "Yin reaches its peak and yang turns; store kidney essence.",
    },
    advice: {
      diet: {
        zh: ["当归生姜羊肉汤", "黑豆糯米饭"],
        en: ["Angelica & ginger lamb soup", "Black bean sticky rice"],
      },
      routine: {
        zh: ["冬令进补三九养生", "早睡晚起，注意腰膝保暖"],
        en: ["Winter nourishment regimen", "Sleep early, keep the waist and knees warm"],
      },
    },
    almanac: {
      favorable: {
        zh: ["祭祖感恩", "室内装修"],
        en: ["Ancestor rituals", "Indoor renovations"],
      },
      avoid: {
        zh: ["远行出游", "大规模聚餐"],
        en: ["Long travels", "Large cold banquets"],
      },
    },
    qi: {
      index: 68,
      emoji: "🕯️",
      phrase: {
        zh: "阴极转阳，安静蓄势最宜。",
        en: "As yin turns to yang, nurture stillness and inner strength.",
      },
      warning: {
        zh: "黄昏后寒气重，注意足膝保暖。",
        en: "Twilight chills intensify — mind your feet and knees.",
      },
    },
  },
];

function getOrderedKeys() {
  return SOLAR_TERMS.map((item) => item.key);
}

export function getSolarTermInsight(locale: "zh" | "en", key?: SolarTermKey) {
  const fallback = SOLAR_TERMS[0];
  const found = key ? SOLAR_TERMS.find((item) => item.key === key) : undefined;
  const target = found ?? fallback;
  const defaultQi = {
    index: 75,
    emoji: "🌤️",
    phrase: {
      zh: "节气流转，保持松弛与专注。",
      en: "Seasonal qi flows — stay relaxed yet focused.",
    },
    warning: {
      zh: "留意身体信号，循序调节。",
      en: "Listen to your body and adjust gently.",
    },
  };
  const qi = target.qi ?? defaultQi;
  return {
    name: target.name[locale],
    description: target.description[locale],
    diet: target.advice.diet[locale],
    routine: target.advice.routine[locale],
    favorable: target.almanac.favorable[locale],
    avoid: target.almanac.avoid[locale],
    key: target.key,
    qiIndex: qi.index,
    qiPhrase: qi.phrase[locale],
    qiWarning: qi.warning[locale],
    emoji: qi.emoji,
  };
}

export function listSolarTermKeys() {
  return getOrderedKeys();
}

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getSolarTermForDate(locale: "zh" | "en", date = new Date()) {
  const keys = getOrderedKeys();
  if (keys.length === 0) {
    return getSolarTermInsight(locale);
  }
  const dayIndex = getDayOfYear(date);
  const index = dayIndex % keys.length;
  const key = keys[index];
  return getSolarTermInsight(locale, key);
}
