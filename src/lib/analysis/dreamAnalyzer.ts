type Locale = "zh" | "en";

type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

type DreamSymbol = {
  meaning: string;
  cultural: string;
  psychology: string;
  advice: string | Record<Locale, string>;
  element: ElementKey;
  intensity: 1 | 2 | 3 | 4 | 5;
  keywords: Record<Locale, string[]>;
  subtext?: {
    archetype?: Record<Locale, string>;
    affirmation?: Record<Locale, string>;
  };
};

type DreamSymbolKey = keyof typeof DREAM_SYMBOLS;

type DreamKeywordMatch = {
  key: DreamSymbolKey;
  symbol: DreamSymbol;
};

type DreamAnalysisResult = {
  success: boolean;
  keywords: DreamSymbolKey[];
  intensity: number;
  elements: Record<ElementKey, number>;
  symbolDetails: Array<{
    key: DreamSymbolKey;
    meaning: string;
    cultural: string;
    psychology: string;
    advice: string;
    element: ElementKey;
    intensity: number;
    subtext?: {
      archetype?: string;
      affirmation?: string;
    };
  }>;
  advice: string[];
  summary: string;
  culturalInsight: string;
  interpretation: string;
  category?: string | null;
  tags?: string[];
  mood?: string | null;
  rawText?: string;
};

type EmotionInsight = {
  aspect: string;
  element: ElementKey;
  advice: Record<Locale, string>;
  cultural: string;
};

const DREAM_SYMBOLS = {
  water: {
    meaning: "情感、潜意识、生命流动",
    cultural: "水主智，代表情感流动与深层意识",
    psychology: "多与情绪起伏、情感需求相关",
    advice: "关注内心感受，让情绪自然流动",
    element: "water",
    intensity: 3,
    keywords: { zh: ["水", "海", "河", "湖", "雨"], en: ["water", "sea", "ocean", "river", "rain"] },
  },
  fire: {
    meaning: "激情、能量、变革动力",
    cultural: "火主礼，象征热情与行动力",
    psychology: "可能反映动力、愤怒或焦虑能量",
    advice: "聚焦能量于创造性与可执行的计划",
    element: "fire",
    intensity: 4,
    keywords: { zh: ["火", "火焰", "燃烧"], en: ["fire", "flame", "burn"] },
  },
  flight: {
    meaning: "自由、超越、追求理想",
    cultural: "飞翔象征精神升华与自由意志",
    psychology: "可能表达渴望自由或逃避现实",
    advice: "寻找现实突破点，平衡理想与现实",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["飞", "飞翔", "天空", "翅膀"], en: ["fly", "flight", "sky", "wings"] },
  },
  falling: {
    meaning: "失控、焦虑、失去支持",
    cultural: "坠落暗示根基不稳或失去安全感",
    psychology: "常见于压力大或面临重大决策时",
    advice: "建立安全感，分步骤解决难题",
    element: "earth",
    intensity: 4,
    keywords: { zh: ["坠落", "跌落", "掉下"], en: ["fall", "falling", "drop"] },
  },
  chase: {
    meaning: "压力、逃避责任、未解决问题",
    cultural: "追逐暗示需要面对的现实挑战",
    psychology: "反映逃避中的紧张和焦虑",
    advice: "正视挑战，制定可执行的应对策略",
    element: "metal",
    intensity: 5,
    keywords: { zh: ["追", "追逐", "被追", "逃跑"], en: ["chase", "pursuit", "run after"] },
  },
  teeth: {
    meaning: "自信、表达能力、掌控感",
    cultural: "齿为骨之余，与根基和稳定相关",
    psychology: "常见于对外表、沟通的焦虑",
    advice: "提升自信，练习清晰表达",
    element: "earth",
    intensity: 3,
    keywords: { zh: ["牙齿", "牙掉", "牙"], en: ["teeth", "tooth"] },
  },
  mirror: {
    meaning: "自我认知、反思内在",
    cultural: "镜为照物之器，寓意审视自我",
    psychology: "象征自我评价或外界反馈",
    advice: "观察内在变化，接纳真实自己",
    element: "metal",
    intensity: 2,
    keywords: { zh: ["镜子", "镜"], en: ["mirror", "reflection"] },
  },
  ocean: {
    meaning: "情绪广阔、灵感源泉",
    cultural: "海纳百川，有容乃大",
    psychology: "多与情绪、潜意识内容相关",
    advice: "记录灵感与情绪波动，保持柔韧",
    element: "water",
    intensity: 3,
    keywords: { zh: ["大海", "海洋"], en: ["ocean", "sea"] },
  },
  forest: {
    meaning: "未知探索、迷失感",
    cultural: "林象征生长与隐秘知识",
    psychology: "反映对未知的好奇或不安",
    advice: "在安全范围内尝试新体验",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["森林", "树林", "密林"], en: ["forest", "woods"] },
  },
  rain: {
    meaning: "情绪释放、净化更新",
    cultural: "雨润万物，象征滋养",
    psychology: "暗示情绪宣泄或需要表达",
    advice: "允许情绪释放，寻找表达渠道",
    element: "water",
    intensity: 2,
    keywords: { zh: ["雨", "下雨", "雨水"], en: ["rain", "raining"] },
  },
  fireSymbol: {
    meaning: "激情、重生、光亮",
    cultural: "火象征礼与生命力",
    psychology: "代表兴奋、愤怒或灵感",
    advice: "将能量转化为对自我有益的行动",
    element: "fire",
    intensity: 4,
    keywords: { zh: ["火堆", "篝火"], en: ["bonfire", "campfire"] },
  },
  snake: {
    meaning: "转变、智慧、潜在威胁",
    cultural: "蛇主变革，象征智慧与再生",
    psychology: "可能表示潜意识警示或情欲",
    advice: "正视生活中的变化，善用直觉",
    element: "fire",
    intensity: 4,
    keywords: { zh: ["蛇"], en: ["snake", "serpent"] },
  },
  fish: {
    meaning: "丰裕、潜意识、情感丰富",
    cultural: "鱼主富贵，多象征财富与祝福",
    psychology: "反映情感丰盛或资源意识",
    advice: "关注情感需求和创造性表达",
    element: "water",
    intensity: 2,
    keywords: { zh: ["鱼"], en: ["fish"] },
  },
  mountain: {
    meaning: "目标、阻力、自我挑战",
    cultural: "山象征稳固与登高望远",
    psychology: "表达对目标的渴望或压力",
    advice: "拆解目标，循序渐进",
    element: "earth",
    intensity: 3,
    keywords: { zh: ["山", "高峰"], en: ["mountain", "peak"] },
  },
  phoenix: {
    meaning: "重生、荣耀、精神蜕变",
    cultural: "凤凰涅槃，象征新生与王者之气",
    psychology: "暗示经历重大成长或身份重塑",
    advice: {
      zh: "珍惜这次蜕变契机，设定新的远景目标",
      en: "Honour this moment of rebirth and set a renewed horizon for yourself.",
    },
    element: "fire",
    intensity: 5,
    keywords: {
      zh: ["凤凰", "浴火重生"],
      en: ["phoenix", "rebirth"],
    },
    subtext: {
      archetype: {
        zh: "象征勇者回归、重新定义自我价值",
        en: "Represents the hero’s return and self-worth redefinition",
      },
      affirmation: {
        zh: "我允许自己以新的姿态绽放并照亮他人。",
        en: "I allow myself to rise renewed and illuminate others.",
      },
    },
  },
  train: {
    meaning: "人生节奏、群体动力",
    cultural: "列车象征进程与集体力量",
    psychology: "反映人生方向感与团队关系",
    advice: "检视当前节奏是否合适",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["火车", "列车"], en: ["train"] },
  },
  child: {
    meaning: "初心、脆弱、创造力",
    cultural: "童象初生，寓意纯真与希望",
    psychology: "指向内在孩童需求",
    advice: "呵护内在孩子，允许表达感受",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["孩子", "童年"], en: ["child", "baby"] },
  },
  light: {
    meaning: "启示、希望、觉察",
    cultural: "光象征智慧与指南",
    psychology: "展现灵感、指引与觉醒",
    advice: "记录灵感，落实于实际行动",
    element: "fire",
    intensity: 3,
    keywords: { zh: ["光", "灯光"], en: ["light", "glow"] },
  },
  house: {
    meaning: "自我、心理状态、安全感",
    cultural: "宅为安身之所，代表内在世界",
    psychology: "房屋状况映照心理层面",
    advice: "梳理生活环境，建立安全感",
    element: "earth",
    intensity: 2,
    keywords: { zh: ["房子", "家"], en: ["house", "home"] },
  },
  door: {
    meaning: "机遇、转折、选择",
    cultural: "门为通道，象征转变与新开始",
    psychology: "表示人生阶段的转换点",
    advice: "觉察新机会，勇敢迈出一步",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["门"], en: ["door", "gate"] },
  },
  bridge: {
    meaning: "连接、过渡、沟通",
    cultural: "桥联结两岸，象征关系与过渡",
    psychology: "涉及沟通、关系修复或过渡期",
    advice: "搭建沟通桥梁，协调资源",
    element: "metal",
    intensity: 2,
    keywords: { zh: ["桥"], en: ["bridge"] },
  },
  desert: {
    meaning: "孤独、资源匮乏",
    cultural: "沙漠寓意考验与沉思",
    psychology: "反映资源或支持感不足",
    advice: "补充能量，主动寻求支持",
    element: "earth",
    intensity: 4,
    keywords: { zh: ["沙漠"], en: ["desert"] },
  },
  rainbow: {
    meaning: "整合、希望、疗愈",
    cultural: "彩虹象征吉兆与承诺",
    psychology: "指向希望与情绪整合",
    advice: "肯定自身努力，庆祝阶段成果",
    element: "water",
    intensity: 2,
    keywords: { zh: ["彩虹"], en: ["rainbow"] },
  },
  elevator: {
    meaning: "升降、地位变化",
    cultural: "升降机象征地位与境遇起伏",
    psychology: "反映职业或生活层级变化",
    advice: "稳住心态，逐步提升能力",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["电梯"], en: ["elevator", "lift"] },
  },
  car: {
    meaning: "人生方向、自主掌控",
    cultural: "车指行程与行动力",
    psychology: "关乎人生的掌控感与速度",
    advice: "明确目的地，调整节奏掌控",
    element: "fire",
    intensity: 3,
    keywords: { zh: ["车", "汽车"], en: ["car", "vehicle"] },
  },
  road: {
    meaning: "道路选择、未来规划",
    cultural: "路象征行程、命运方向",
    psychology: "反映选择与决策焦虑",
    advice: "设定阶段性目标，保持弹性",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["道路", "路"], en: ["road", "path"] },
  },
  clock: {
    meaning: "时间压力、节奏感",
    cultural: "钟象时间之序，提醒珍惜光阴",
    psychology: "暗示任务、时限与压力",
    advice: "制定时间表，安排缓冲时间",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["钟", "闹钟", "时间"], en: ["clock", "time", "alarm"] },
  },
  spider: {
    meaning: "自我编织、警觉",
    cultural: "蛛网象征结构与策略",
    psychology: "提示耐心、警觉或复杂关系",
    advice: "耐心编织计划，保持警惕",
    element: "water",
    intensity: 3,
    keywords: { zh: ["蜘蛛"], en: ["spider"] },
  },
  cat: {
    meaning: "独立、柔软感性",
    cultural: "猫象优雅敏感的生活方式",
    psychology: "涉及独立需求与敏感情绪",
    advice: "照顾自我，倾听直觉",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["猫"], en: ["cat"] },
  },
  dog: {
    meaning: "忠诚、陪伴、安全感",
    cultural: "犬象忠诚守护",
    psychology: "反映陪伴需求与信任关系",
    advice: "加强与支持者的连接",
    element: "earth",
    intensity: 2,
    keywords: { zh: ["狗"], en: ["dog"] },
  },
  pregnancy: {
    meaning: "孕育新事物、期待",
    cultural: "孕象生命延续与希望",
    psychology: "象征计划成形、自我成长",
    advice: "给予新计划时间与资源",
    element: "earth",
    intensity: 3,
    keywords: { zh: ["怀孕", "孕妇"], en: ["pregnant", "pregnancy"] },
  },
  wedding: {
    meaning: "承诺、合作、融合",
    cultural: "婚礼象征契约与互信",
    psychology: "涉及关系与责任调整",
    advice: "评估合作关系，明确边界",
    element: "metal",
    intensity: 3,
    keywords: { zh: ["婚礼", "结婚"], en: ["wedding", "marriage"] },
  },
  exam: {
    meaning: "自我评估、压力",
    cultural: "考试象征榜进与成就",
    psychology: "反映自我要求与焦虑",
    advice: "准备计划，调整心态",
    element: "fire",
    intensity: 4,
    keywords: { zh: ["考试", "测验"], en: ["exam", "test"] },
  },
  phone: {
    meaning: "沟通、信息接收",
    cultural: "通信象征联系与互动",
    psychology: "涉及交流渴望或信息焦虑",
    advice: "建立明确沟通节奏",
    element: "metal",
    intensity: 2,
    keywords: { zh: ["电话", "手机"], en: ["phone", "call", "message"] },
  },
  storm: {
    meaning: "情绪波动、外界冲击",
    cultural: "风雷象征变局与警示",
    psychology: "表示压力、冲突或强烈情绪",
    advice: "建立情绪缓冲，预备方案",
    element: "water",
    intensity: 5,
    keywords: { zh: ["暴风", "风暴", "雷雨"], en: ["storm", "thunder", "lightning"] },
  },
  flood: {
    meaning: "情绪泛滥、潜意识淹没",
    cultural: "洪水象征失控之势，提醒居安思危",
    psychology: "常见于压力巨大或情绪压抑阶段",
    advice: "设定界限，分阶段处理积压情绪",
    element: "water",
    intensity: 5,
    keywords: { zh: ["洪水", "泛滥", "海啸"], en: ["flood", "tsunami", "deluge"] },
  },
  pursuitKill: {
    meaning: "危机感、求生本能",
    cultural: "被追逐象征人生重大考验",
    psychology: "可能反映逃避压力或过去创伤",
    advice: "识别现实压力源，制定应对策略并求助支持",
    element: "metal",
    intensity: 5,
    keywords: { zh: ["追杀", "杀我"], en: ["chase me", "kill me"] },
  },
  gecko: {
    meaning: "捕捉细节、自我修复",
    cultural: "壁虎象征守护与再生",
    psychology: "提醒关注小问题与恢复力",
    advice: "注意环境细节，逐步修复关系或健康",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["壁虎", "壁蜥"], en: ["gecko", "house lizard"] },
  },
  childNaked: {
    meaning: "纯真、脆弱、真实自我",
    cultural: "赤子之心寓意无伪与真诚",
    psychology: "反映对坦诚表达或被看见的需求",
    advice: "营造可靠环境，让内在脆弱被呵护",
    element: "earth",
    intensity: 3,
    keywords: { zh: ["小孩裸体", "赤裸小孩"], en: ["naked child", "child naked"] },
  },
  childLaugh: {
    meaning: "喜悦、轻松、疗愈能量",
    cultural: "孩童笑声象征祥瑞与福气",
    psychology: "表示内在积极能量希望被分享",
    advice: "保留童心，创造带来笑声的日常片刻",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["小孩笑", "孩子笑"], en: ["child laugh", "kid laughing"] },
  },
  city: {
    meaning: "社交场域、竞争压力",
    cultural: "城市象征资源与挑战",
    psychology: "反映社交、工作或竞争系统",
    advice: "平衡社交与独处，设定界限",
    element: "earth",
    intensity: 3,
    keywords: { zh: ["城市", "街道"], en: ["city", "urban"] },
  },
  bird: {
    meaning: "自由、讯息、方向感",
    cultural: "鸟象征灵性与视野",
    psychology: "代表自由渴望或新讯息",
    advice: "保持开放心态，留意机遇",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["鸟", "飞鸟"], en: ["bird", "sparrow", "eagle"] },
  },
  flower: {
    meaning: "美感、情感绽放",
    cultural: "花象征生命盛放与缘分",
    psychology: "反映感性与人际关系",
    advice: "欣赏生活之美，表达情感",
    element: "wood",
    intensity: 2,
    keywords: { zh: ["花", "花朵"], en: ["flower", "blossom"] },
  },
  boat: {
    meaning: "旅程、跨越、载体",
    cultural: "舟渡象征渡过难关",
    psychology: "指向人生旅程与情感载体",
    advice: "梳理旅程方向，稳步前行",
    element: "water",
    intensity: 3,
    keywords: { zh: ["船", "小船"], en: ["boat", "ship"] },
  },
} satisfies Record<string, DreamSymbol>;

const EMOTION_ANALYSIS: Record<string, EmotionInsight> = {
  fear: {
    aspect: "需要注意的恐惧源",
    element: "water",
    advice: {
      zh: "逐步面对恐惧，建立安全感",
      en: "Face fears gradually and rebuild a sense of safety.",
    },
    cultural: "恐伤肾，宜固本培元，温养阳气",
  },
  joy: {
    aspect: "潜藏的积极能量",
    element: "fire",
    advice: {
      zh: "分享快乐，让积极能量流动",
      en: "Share your joy so its energy keeps flowing.",
    },
    cultural: "喜伤心，宜平和养心，保持节制",
  },
  confusion: {
    aspect: "需要厘清的思维",
    element: "earth",
    advice: {
      zh: "静心思考，寻求清晰方向",
      en: "Slow down, breathe, and let clarity emerge.",
    },
    cultural: "思伤脾，宜调脾和胃，理气和中",
  },
  anger: {
    aspect: "未被表达的边界需求",
    element: "wood",
    advice: {
      zh: "健康表达情绪，设立个人边界",
      en: "Express feelings healthily and reinforce your boundaries.",
    },
    cultural: "怒伤肝，宜疏肝理气，舒展身心",
  },
  sadness: {
    aspect: "需要释放的情感",
    element: "metal",
    advice: {
      zh: "允许自己感受悲伤，寻求支持",
      en: "Allow grief to be felt and seek supportive company.",
    },
    cultural: "忧伤肺，宜宣肺益气，舒缓情绪",
  },
  calm: {
    aspect: "稳定的自我调节能力",
    element: "wood",
    advice: {
      zh: "保持伸展与呼吸，守护平稳心境",
      en: "Maintain gentle stretches and steady breathing to protect your calm.",
    },
    cultural: "木旺宜柔，顺应四时之气",
  },
  anxiety: {
    aspect: "持续的心理压力需释放",
    element: "water",
    advice: {
      zh: "练习冥想与放松技巧，给心灵缓冲",
      en: "Practise relaxation and mindfulness to give your mind breathing space.",
    },
    cultural: "恐伤肾，宜收摄心神，护肾调水",
  },
  hope: {
    aspect: "内心期待转化为动力",
    element: "wood",
    advice: {
      zh: "设定实际目标，让愿景落地",
      en: "Set practical plans so your vision can take root.",
    },
    cultural: "木得生机，宜循序渐进",
  },
  unknown: {
    aspect: "未解的潜意识信息",
    element: "metal",
    advice: {
      zh: "记录梦境细节，关注生活印象",
      en: "Record dream details and observe daily reflections.",
    },
    cultural: "金主肃杀，宜守正清明",
  },
};

const ELEMENT_WISDOM: Record<ElementKey, { quality: string; challenge: string; advice: Record<Locale, string> }> = {
  wood: {
    quality: "生长、拓展、决策",
    challenge: "易固执或缺乏弹性",
    advice: {
      zh: "木气旺，保持灵活与伸展，像枝叶拥抱阳光。",
      en: "Wood energy is strong—stay flexible and reach toward new light.",
    },
  },
  fire: {
    quality: "热情、表达、行动",
    challenge: "可能冲动或精力分散",
    advice: {
      zh: "火势旺，聚焦热情如灯火照路，避免能量外泄。",
      en: "Fire energy burns bright—focus your spark like a guiding flame to avoid burnout.",
    },
  },
  earth: {
    quality: "稳定、包容、实践",
    challenge: "容易担忧或过度保守",
    advice: {
      zh: "土气旺，脚踏实地，像大地承载万物般安定情绪。",
      en: "Earth energy predominates—ground yourself and steady emotions as the earth holds all things.",
    },
  },
  metal: {
    quality: "清晰、原则、价值",
    challenge: "可能苛求或欠缺温度",
    advice: {
      zh: "金气旺，坚持原则之外别忘了保持温度与柔软。",
      en: "Metal energy is crisp—honour your standards while staying warm and approachable.",
    },
  },
  water: {
    quality: "智慧、流动、适应",
    challenge: "易逃避或情绪波动",
    advice: {
      zh: "水气旺，顺势引导情绪流动，如流水因器成形。",
      en: "Water energy flows—guide emotions gracefully and adapt like water in any vessel.",
    },
  },
};

const ELEMENT_LABELS: Record<Locale, Record<ElementKey, string>> = {
  zh: {
    wood: "木 · 柔而向上",
    fire: "火 · 炽热启发",
    earth: "土 · 承载扎根",
    metal: "金 · 清晰聚焦",
    water: "水 · 流动智慧",
  },
  en: {
    wood: "Wood · Upward growth",
    fire: "Fire · Radiant inspiration",
    earth: "Earth · Grounded support",
    metal: "Metal · Sharp focus",
    water: "Water · Flowing wisdom",
  },
};

const CULTURAL_INSIGHT_TEXT: Record<Locale, string> = {
  zh: "梦境是潜意识与传统文化智慧的对话窗口，象征性图像传递着内在讯息。",
  en: "Dreams act as a dialogue between the subconscious and cultural wisdom, carrying messages through symbols.",
};

const EMOTION_TONES: Record<string, Record<Locale, string>> = {
  fear: {
    zh: "恐惧感提醒你关注安全感的建立",
    en: "Fear hints that nurturing a sense of safety is timely",
  },
  joy: {
    zh: "喜悦能量希望被分享与表达",
    en: "Joyful energy wants to be shared and expressed",
  },
  confusion: {
    zh: "迷惑感提示需要厘清思绪",
    en: "Confusion signals a need to clarify your thoughts",
  },
  anger: {
    zh: "怒气唤醒你设定健康边界",
    en: "Anger calls for affirming healthy boundaries",
  },
  sadness: {
    zh: "悲伤需要温柔释放与接纳",
    en: "Sadness seeks gentle release and acceptance",
  },
  calm: {
    zh: "平静说明你拥有自我调节能力",
    en: "Calm shows you possess steady self-regulation",
  },
  anxiety: {
    zh: "焦虑提醒你创造缓冲与放松",
    en: "Anxiety reminds you to create buffers and relax",
  },
  hope: {
    zh: "希望感正准备化为前进动力",
    en: "Hope is ready to become forward momentum",
  },
  unknown: {
    zh: "潜意识仍在酝酿讯息，建议持续记录",
    en: "The subconscious is still composing its message; keep recording details",
  },
};

function formatSymbolName(key: DreamSymbolKey, locale: Locale): string {
  const symbol = DREAM_SYMBOLS[key];
  if (locale === "zh") return symbol.meaning;
  const englishKeyword = symbol.keywords.en?.[0];
  if (englishKeyword) return titleCase(englishKeyword);
  return titleCase(key.replace(/([A-Z])/g, " $1"));
}

function titleCase(input: string): string {
  return input
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractKeywordMatches(dreamText: string, locale: Locale = "zh"): DreamKeywordMatch[] {
  if (!dreamText || dreamText.trim().length < 5) {
    return [{ key: "water", symbol: DREAM_SYMBOLS.water }];
  }

  const text = dreamText.toLowerCase();
  const matches: DreamKeywordMatch[] = [];

  Object.entries(DREAM_SYMBOLS).forEach(([key, symbol]) => {
    const keywords = symbol.keywords[locale];
    if (keywords.some((word) => text.includes(word))) {
      matches.push({ key: key as DreamSymbolKey, symbol });
    }
  });

  if (matches.length) {
    return matches.slice(0, 8);
  }

  const fallbackCategories: Record<DreamSymbolKey, string[]> = {
    water: ["river", "swim", "游泳"],
    fire: ["sun", "炎热", "lava"],
    flight: ["sky", "bird", "翅膀"],
    falling: ["drop", "下坠"],
    chase: ["追捕", "追赶", "hunt"],
    teeth: ["牙齿", "口腔"],
    mirror: ["镜面", "倒影"],
    ocean: ["海浪", "潮汐"],
    forest: ["雨林", "树林"],
    rain: ["雨滴", "暴雨"],
    snake: ["毒蛇", "蟒蛇"],
    fish: ["鱼儿", "河鱼"],
    mountain: ["山峰", "山脉"],
    train: ["地铁", "列车"],
    child: ["孩子们", "幼儿"],
    light: ["光束", "灯光"],
    house: ["住宅", "房屋"],
    door: ["门框", "门缝"],
    bridge: ["桥梁", "桥墩"],
    desert: ["沙丘", "荒漠"],
    rainbow: ["彩带", "七色"],
    elevator: ["扶梯", "上升"],
    car: ["驾驶", "汽"],
    road: ["路径", "高速"],
    clock: ["时钟", "钟表"],
    spider: ["蛛网", "蜘蛛"],
    cat: ["小猫", "喵"],
    dog: ["小狗", "汪"],
    pregnancy: ["胎儿", "宝贝"],
    wedding: ["婚宴", "新娘"],
    exam: ["考场", "教室"],
    phone: ["短信", "铃声"],
    storm: ["风暴", "飓风"],
    city: ["都市", "街景"],
    bird: ["飞禽", "羽翼"],
    flower: ["花瓣", "花园"],
    boat: ["航行", "船舶"],
    flood: ["洪水", "海啸", "flood", "tsunami"],
    pursuitKill: ["追杀", "杀我", "chase me", "kill me"],
    gecko: ["壁虎", "壁蜥", "gecko", "lizard"],
    childNaked: ["小孩裸体", "赤裸", "naked child"],
    childLaugh: ["小孩笑", "孩子笑", "child laugh", "kid laughing"],
    fireSymbol: ["火堆", "篝火", "bonfire", "campfire"],
    phoenix: ["凤凰", "浴火重生", "phoenix", "rebirth"],
  };

  Object.entries(fallbackCategories).forEach(([key, words]) => {
    if (words.some((word) => text.includes(word))) {
      matches.push({ key: key as DreamSymbolKey, symbol: DREAM_SYMBOLS[key as DreamSymbolKey] });
    }
  });

  return matches.length ? matches.slice(0, 4) : [{ key: "water", symbol: DREAM_SYMBOLS.water }];
}

export function extractKeywords(dreamText: string, locale: Locale = "zh"): DreamSymbolKey[] {
  const matches = extractKeywordMatches(dreamText, locale);
  const seen = new Set<DreamSymbolKey>();
  matches.forEach((match) => seen.add(match.key));
  return Array.from(seen);
}

function analyzeEmotionalIntensity(keywords: DreamSymbolKey[]): number {
  if (!keywords.length) return 3;
  const scores = keywords.map((key) => DREAM_SYMBOLS[key].intensity);
  const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  return Math.min(5, Math.max(1, Math.round(avg)));
}

function analyzeElementBalance(keywords: DreamSymbolKey[], emotion: string): Record<ElementKey, number> {
  const elements: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  keywords.forEach((key) => {
    const symbol = DREAM_SYMBOLS[key];
    elements[symbol.element] += 2;
  });
  const emotionData = EMOTION_ANALYSIS[emotion.toLowerCase()] ?? EMOTION_ANALYSIS.unknown;
  elements[emotionData.element] += 3;
  return elements;
}

function determineDominantElement(elements: Record<ElementKey, number>): ElementKey {
  return Object.entries(elements).sort(([, a], [, b]) => b - a)[0][0] as ElementKey;
}

function generatePersonalizedAdvice(
  keywords: DreamSymbolKey[],
  userEmotion: string,
  elements: Record<ElementKey, number>,
  locale: Locale,
  dominantElement: ElementKey
): string[] {
  const advice = new Set<string>();
  keywords.forEach((key) => {
    const symbolAdvice = DREAM_SYMBOLS[key].advice;
    if (typeof symbolAdvice === "string") {
      advice.add(symbolAdvice);
    } else {
      advice.add(symbolAdvice[locale]);
    }
  });
  const emotionData = EMOTION_ANALYSIS[userEmotion.toLowerCase()];
  if (emotionData?.advice) advice.add(emotionData.advice[locale]);
  advice.add(ELEMENT_WISDOM[dominantElement].advice[locale]);
  if (!advice.size) {
    if (locale === "zh") {
      advice.add("梦境充满象征讯息，建议记录细节以深化解析。");
      advice.add("留意现实生活中的同步性，寻找梦境提示的回应。");
    } else {
      advice.add("Your dream speaks in symbols; jot the details to deepen the decoding.");
      advice.add("Watch for synchronicities in waking life that mirror the dream’s cues.");
    }
  }
  return Array.from(advice);
}

function generateInterpretation(keywords: DreamSymbolKey[], emotion: string, locale: Locale): string {
  const emotionKey = emotion.toLowerCase();
  const emotionTone = EMOTION_TONES[emotionKey] ?? EMOTION_TONES.unknown;
  if (!keywords.length) {
    return locale === "zh"
      ? "梦境信息较为隐晦，建议关注近期的情感变化与直觉感受。"
      : "The message feels abstract—pay attention to emotional shifts and intuition in waking life.";
  }
  const primary = DREAM_SYMBOLS[keywords[0]];
  const primaryName = formatSymbolName(keywords[0], locale);
  const rawAdvice = typeof primary.advice === "string" ? primary.advice : primary.advice[locale];
  const primaryAdvice =
    typeof primary.advice === "string" && locale === "en"
      ? `Pay attention to ${ELEMENT_LABELS.en[primary.element]} qualities in daily life.`
      : rawAdvice;
  return locale === "zh"
    ? `梦境以「${primaryName}」为主题，并与${emotionTone.zh}呼应，潜意识提醒你：${primaryAdvice}`
    : `The dream centers on ${primaryName}, resonating with ${emotionTone.en}. Your subconscious encourages you to: ${primaryAdvice}`;
}

export function generateAdvice(keywords: DreamSymbolKey[], emotion: string, locale: Locale = "zh"): string[] {
  const elements = analyzeElementBalance(keywords, emotion);
  const dominantElement = determineDominantElement(elements);
  return generatePersonalizedAdvice(keywords, emotion, elements, locale, dominantElement);
}

export function analyzeDream(dreamText: string, userEmotion: string = "unknown", locale: Locale = "zh"): DreamAnalysisResult {
  try {
    const keywordMatches = extractKeywordMatches(dreamText, locale);
    const keywords = keywordMatches.map((match) => match.key);
    const intensity = analyzeEmotionalIntensity(keywords);
    const elements = analyzeElementBalance(keywords, userEmotion);
    const dominantElement = determineDominantElement(elements);
    const advice = generatePersonalizedAdvice(keywords, userEmotion, elements, locale, dominantElement);

    const symbolDetails = keywordMatches.map((match) => ({
      key: match.key,
      meaning: match.symbol.meaning,
      cultural: match.symbol.cultural,
      psychology: match.symbol.psychology,
      advice: typeof match.symbol.advice === "string" ? match.symbol.advice : match.symbol.advice[locale],
      element: match.symbol.element,
      intensity: match.symbol.intensity,
      subtext: match.symbol.subtext
        ? {
            archetype: match.symbol.subtext.archetype?.[locale],
            affirmation: match.symbol.subtext.affirmation?.[locale],
          }
        : undefined,
    }));

    const elementLabel = ELEMENT_LABELS[locale][dominantElement];
    const symbolNames = keywords.map((key) => formatSymbolName(key, locale));
    const summary =
      keywords.length > 0
        ? locale === "zh"
          ? `梦境聚焦于${symbolNames.join("、")}，情感强度约 ${intensity}/5，主导五行：${elementLabel}。`
          : `Your dream highlights ${symbolNames.join(", ")} with intensity around ${intensity}/5. Dominant element: ${elementLabel}.`
        : locale === "zh"
        ? "梦境以抽象意象出现，建议记录更多细节以便后续解析。"
        : "The dream feels abstract—record more details to deepen future interpretations.";

    return {
      success: true,
      keywords,
      intensity,
      elements,
      symbolDetails,
      advice,
      summary,
      culturalInsight: CULTURAL_INSIGHT_TEXT[locale],
      interpretation: generateInterpretation(keywords, userEmotion, locale),
      category: null,
      tags: [],
      mood: userEmotion,
      rawText: dreamText,
    };
  } catch (error) {
    console.error("[dreamAnalyzer] analyzeDream error:", error);
    return {
      success: false,
      keywords: [],
      intensity: 0,
      elements: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
      symbolDetails: [],
      advice: ["解析过程中出现问题，请尝试更详细地描述梦境。"],
      summary: "解析失败。",
      culturalInsight: "",
      interpretation: "",
      category: null,
      tags: [],
      mood: userEmotion,
      rawText: dreamText,
    };
  }
}

export function getDreamSymbols() {
  return DREAM_SYMBOLS;
}

export function getEmotionAnalysis(): Record<string, EmotionInsight> {
  return EMOTION_ANALYSIS;
}

export function testDreamAnalysis() {
  const samples = [
    { text: "我梦见在大海里游泳，然后飞上天空", emotion: "joy" },
    { text: "梦见牙齿掉了，很害怕", emotion: "fear" },
    { text: "被陌生人追逐，一直逃跑", emotion: "anxiety" },
  ];
  return samples.map(({ text, emotion }) => analyzeDream(text, emotion));
}

export type { DreamAnalysisResult, DreamSymbol, DreamSymbolKey, DreamKeywordMatch };
