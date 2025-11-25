import type { ConstitutionMeta, ConstitutionType } from "./types";

export const CONSTITUTION_DATA: Record<ConstitutionType, ConstitutionMeta> = {
  emotional_surge: {
    id: "emotional_surge",
    name: "情绪敏感型",
    en: "Emotional Surge",
    brief: "最近情绪像潮水，容易被细节牵动，也能捕捉到更细腻的势。",
    feature: [
      "对人对事特别在意，容易被别人一句话牵动心绪。",
      "思考深、感受强，累的时候容易让情绪绕圈。",
      "有创意、有直觉，但需要一点心绪缓冲时间。",
    ],
    advice: [
      "把今天的重要事安排在心绪较稳的时段。",
      "刻意给自己一点留白，情绪会更快回正。",
      "听点轻柔音乐或散步，让感受重新对齐。",
    ],
    adviceSummary: "先稳住情绪的潮水，再去处理重要关系与事项，势头会更顺。",
    qiEffect: -2,
  },
  mental_overclock: {
    id: "mental_overclock",
    name: "轻躁随动型",
    en: "Airy Scattered",
    brief: "念头像风一样快速流动，灵感多、节拍快，也容易有点飘。",
    feature: [
      "思维反应快、洞察准，但信息量太大时会焦躁。",
      "倾向一次做很多事，身体节奏容易被忽略。",
      "擅长处理复杂、多变的判断题，用好就是真优势。",
    ],
    advice: [
      "把任务排优先级，大脑就不会到处乱飞。",
      "冥想或深呼吸 3 分钟，让“过热”降下来。",
      "睡前减少大量输入，给念头一个缓冲带。",
    ],
    adviceSummary: "把灵感集中在少数关键点，再配短暂停顿，轻躁就能化成好势。",
    qiEffect: +1,
  },
  grounded_steady: {
    id: "grounded_steady",
    name: "平稳根基型",
    en: "Grounded Balance",
    brief: "根基稳、节奏匀，像在铺好的路上缓慢发力。",
    feature: [
      "遇事不急不躁，喜欢按自己的内在节拍前进。",
      "对关系与工作都能提供稳定存在感，少受外界波动影响。",
      "擅长做需要时间堆砌的事，耐力足、韧性强。",
    ],
    advice: [
      "维持当下的步调即可，稳就是你的优势。",
      "安排一点结构化的任务，慢慢搭建更安心。",
      "做些温和的伸展或走路，让气血也跟上这份稳定。",
    ],
    adviceSummary: "守住根基、按部前行，慢慢推进长期任务就能看到积累的势能。",
    qiEffect: +3,
  },
  social_drain: {
    id: "social_drain",
    name: "社交外放型",
    en: "Warm Expressive",
    brief: "社交火花足、存在感强，但也容易在互动中消耗大量能量。",
    feature: [
      "与人互动时非常带氛围，容易成为场域中心。",
      "投入感情多，若互动密集就需要更长恢复时间。",
      "更适合深度关系，在太多场合中会被耗到。",
    ],
    advice: [
      "精简社交清单，把时间留给真正重要的人。",
      "练习礼貌拒绝，能帮你守住自己的能量场。",
      "独处疗愈或安静听歌，能让外放后的自己重新充电。",
    ],
    adviceSummary: "保持热情但不过度撒网，把能量用在核心关系，存在感会更暖更稳。",
    qiEffect: -2,
  },
  thought_heavy: {
    id: "thought_heavy",
    name: "思虑偏重型",
    en: "Overthinking Flow",
    brief: "最近脑内戏份偏多，念头像河流一样不断回旋。",
    feature: [
      "面对变化或不确定时，会想得更细更深。",
      "容易陷入“要不要、是不是”的来回衡量。",
      "在深度思考上强，但决策速度因此变慢。",
    ],
    advice: [
      "把问题写下来，念头就不会一直绕圈。",
      "今天不必急着定结论，延后更顺。",
      "散步或洗澡等“解脑”仪式能帮你换频道。",
    ],
    adviceSummary: "把念头落地、慢慢排序，心绪就会轻下来，势也会更清晰。",
    qiEffect: -3,
  },
  mild_fatigue: {
    id: "mild_fatigue",
    name: "湿缓积滞型",
    en: "Damp Easy-Tired",
    brief: "身心像被小雾气包着，行动力还在但容易累、容易困。",
    feature: [
      "一忙就想躺，但休息一下又能恢复不少。",
      "事情多时会出现心累和身体发闷的感觉。",
      "湿感稍重，行动力需要靠温暖节奏唤醒。",
    ],
    advice: [
      "今天的节奏宜慢不宜快，别一下塞太多事。",
      "多喝温热水、吃得清淡，帮助气机舒展。",
      "任务逐件做完，湿感就不会越积越多。",
    ],
    adviceSummary: "放慢脚步、温养身体，让湿滞散一散，气就能重新流起来。",
    qiEffect: -4,
  },
  low_heart_qi: {
    id: "low_heart_qi",
    name: "寒静收敛型",
    en: "Cool Contained",
    brief: "气息偏寒、内心收敛，整体状态像按下静音键。",
    feature: [
      "面对压力时容易冒出“我行不行”的不确定感。",
      "想得多、说得少，容易把心事藏里面。",
      "对支持与肯定很敏感，一句暖话就能回暖。",
    ],
    advice: [
      "告诉自己“我可以慢慢来”，先让心气回温。",
      "今天不必硬撑，保持稳定就好。",
      "做点让自己真心开心的小事，气息会打开。",
    ],
    adviceSummary: "先暖好自己的底气，再慢慢接外界节奏，状态就能稳下来。",
    qiEffect: -5,
  },
  underlight_pressure: {
    id: "underlight_pressure",
    name: "紧绷压抑型",
    en: "Tense Holding",
    brief: "最近像拉紧了一根弦，外表镇定、内在却一直用力。",
    feature: [
      "人事、关系或自我要求让身体一直绷着。",
      "压力不一定巨大，却像一股持续的暗流。",
      "内心知道自己能扛，但也需要安全出口。",
    ],
    advice: [
      "今天暂时别接新压力，先把手上的舒展开。",
      "把任务拆成小块，一件件放掉紧劲。",
      "跟信任的人说说近况，筋会松很多。",
    ],
    adviceSummary: "松一松绷紧的弦，边拆压边呼吸，状态才好继续推进。",
    qiEffect: -1,
  },
  ascending_flow: {
    id: "ascending_flow",
    name: "精力上扬型",
    en: "Rising Vitality",
    brief: "整体气势往上走，做事顺手、人际也在顺风。",
    feature: [
      "做事顺手、关系顺势，像遇到顺流。",
      "心态抬升，容易接到积极的推动。",
      "有“想做点大事”的冲动，火候正好。",
    ],
    advice: [
      "把重要节点排进来，这波势能值得好好用。",
      "保持节奏，不必太快，就能持续走高。",
      "多做让你兴奋、有未来感的事，势头会继续上扬。",
    ],
    adviceSummary: "趁势推进重点事项，再留一点余地，能让上扬曲线更持久。",
    qiEffect: +4,
  },
  steady_build: {
    id: "steady_build",
    name: "专注稳态型",
    en: "Focused Grounded",
    brief: "专注力稳定、心绪沉着，适合把能量集中在长期阵地。",
    feature: [
      "适合做结构化、长期收益的项目。",
      "情绪平稳，不容易被外部节奏打乱。",
      "精力中等偏上，能长时间保持专注。",
    ],
    advice: [
      "按既定节奏推进即可，不需要额外加速。",
      "整理、建设、推进长期任务都会见效。",
      "搭配一些身体活动，让精神与身体节奏同步。",
    ],
    adviceSummary: "今天就是稳稳垒成果的一天，专注推进、别停，积木自然成塔。",
    qiEffect: +2,
  },
  easy_flow: {
    id: "easy_flow",
    name: "转换过渡型",
    en: "Shifting Cycle",
    brief: "正处在转换期，状态像潮水推移，既不紧绷也不完全松弛。",
    feature: [
      "心态开放，愿意尝试新的方向或位置。",
      "有时松、有时紧，能量在不同模式间流动。",
      "适合探索新体验，用小实验找下一步的势。",
    ],
    advice: [
      "安排一些轻量尝试或对话，帮助你看清下一步。",
      "保持适度节奏，别因为过渡期就放任拖延。",
      "做些让身体流动的运动，带动转换的顺感。",
    ],
    adviceSummary: "顺着这股转换的势走，多做小实验，你会很快找到新的节拍。",
    qiEffect: +1,
  },
  high_vitality: {
    id: "high_vitality",
    name: "火力旺盛型",
    en: "Fiery Drive",
    brief: "能量充足、势头正旺，属于“点火就冲”的档。",
    feature: [
      "行动力强、决策快，喜欢直接推进。",
      "身心协调，有明显的“向前”驱力。",
      "容易带动身边人，形成正向气场。",
    ],
    advice: [
      "选一件真正值得的事，全力推进就对了。",
      "把热度用在关键节点，容易有突破。",
      "记得预留休息区，防止火力过冲。",
    ],
    adviceSummary: "把高能势头投向重点任务，再配一份节奏感，推进就会很漂亮。",
    qiEffect: +5,
  },
};

export const CONSTITUTION_LIST = Object.values(CONSTITUTION_DATA);


