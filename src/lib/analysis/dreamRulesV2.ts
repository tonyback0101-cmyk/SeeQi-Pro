/**
 * Dream Rules V2
 * 结构化标签：周公象意 + 现代心理 + 行动提醒
 */

export type DreamType =
  | "chase"
  | "fall"
  | "exam"
  | "teeth"
  | "fly"
  | "naked"
  | "death"
  | "lost"
  | "water"
  | "house"
  | "other";

export interface DreamArchetype {
  type: DreamType;
  symbol_meaning: string;
  mood_pattern: string;
  trend_hint: string;
  suggestion_tags: string[];
  // 新增结构化标签（类似 PalmArchetype）
  symbol_tags: string[]; // 象意标签
  emotion_tags: string[]; // 情绪标签
  dream_type_signal?: string; // 梦型信号句
  systemTags: string[]; // 系统内部标签
}

export interface DreamContextInput {
  text: string;
  emotionHint?: string;
}

export interface DreamFeaturesInput {
  tone: DreamType;
  emotion?: "panic" | "sad" | "angry" | "calm" | "curious";
  characters?: string[];
  symbols?: string[];
  setting?: string;
  keywords?: string[];
}

export interface DreamStateTags {
  symbolic_meaning: string;
  inner_state: string;
  momentum: string;
  reminder_points: string[];
}

export function normalizeText(text: string): string {
  return text.toLowerCase();
}

export function classifyDreamTypeFromText(text: string): DreamType {
  const t = normalizeText(text);

  if (t.includes("chase") || t.includes("chasing") || t.includes("being chased")) {
    return "chase";
  }
  if (t.includes("falling") || t.includes("fall") || t.includes("drop")) {
    return "fall";
  }
  if (
    t.includes("exam") ||
    t.includes("test") ||
    t.includes("late") ||
    t.includes("missed the bus") ||
    t.includes("missed the train")
  ) {
    return "exam";
  }
  if (t.includes("teeth") || t.includes("tooth") || t.includes("lose my teeth")) {
    return "teeth";
  }
  if (t.includes("fly") || t.includes("flying")) {
    return "fly";
  }
  if (t.includes("naked") || t.includes("nude") || t.includes("no clothes")) {
    return "naked";
  }
  if (t.includes("die") || t.includes("death") || t.includes("funeral") || t.includes("goodbye")) {
    return "death";
  }
  if (t.includes("lost") || t.includes("can't find") || t.includes("迷路")) {
    return "lost";
  }
  if (t.includes("water") || t.includes("sea") || t.includes("ocean") || t.includes("flood") || t.includes("river")) {
    return "water";
  }
  if (t.includes("house") || t.includes("home") || t.includes("room") || t.includes("building")) {
    return "house";
  }

  if (t.includes("追我") || t.includes("被追") || t.includes("追赶")) {
    return "chase";
  }
  if (t.includes("掉下") || t.includes("掉落") || t.includes("坠落")) {
    return "fall";
  }
  if (t.includes("考试") || t.includes("迟到") || t.includes("赶不上")) {
    return "exam";
  }
  if (t.includes("掉牙") || t.includes("牙齿")) {
    return "teeth";
  }
  if (t.includes("飞") || t.includes("飞翔")) {
    return "fly";
  }
  if (t.includes("裸") || t.includes("没穿衣服")) {
    return "naked";
  }
  if (t.includes("死亡") || t.includes("死去") || t.includes("葬礼")) {
    return "death";
  }
  if (t.includes("迷路")) {
    return "lost";
  }
  if (t.includes("水") || t.includes("海") || t.includes("洪水") || t.includes("大海")) {
    return "water";
  }
  if (t.includes("房子") || t.includes("房间") || t.includes("屋子")) {
    return "house";
  }

  return "other";
}

const SYMBOLIC_LIBRARY: Record<DreamType, DreamStateTags> = {
  chase: {
    symbolic_meaning: "周公：被追象→说明你在逃避压力或突然加速的责任。",
    inner_state: "内心焦虑，但仍想保持掌控感。",
    momentum: "节奏偏快，外界推着走。",
    reminder_points: [
      "不用解释一切，先确认当下真正要面对的核心。",
      "和信任的人交换想法，分担一些压力。",
      "把任务拆小，留一点喘息位。",
    ],
  },
  fall: {
    symbolic_meaning: "周公：坠落象→安全感暂时下滑，需要把重心拉回自己。",
    inner_state: "担心失控或失去支持。",
    momentum: "节奏出现下坠感，提醒减负。",
    reminder_points: [
      "给自己稳住的仪式，比如早晚自检或记录。",
      "尽量避免临时背负别人的情绪。",
    ],
  },
  teeth: {
    symbolic_meaning: "周公：掉牙象→象征外在形象、沟通方式在调整。",
    inner_state: "怕被误解，但也在寻找新表达。",
    momentum: "旧模式松动，新习惯尚未定型。",
    reminder_points: [
      "说话慢一点，先确认真实想法。",
      "照顾身体和作息，帮助气血更稳。",
    ],
  },
  fly: {
    symbolic_meaning: "周公：飞行象→勇气被激活，渴望发光。",
    inner_state: "兴奋夹带一点小紧张。",
    momentum: "趋势上扬，适合探索。",
    reminder_points: [
      "大胆测试新点子，但别忘了落地计划。",
      "留意伙伴协作，别单打独斗。",
    ],
  },
  exam: {
    symbolic_meaning: "周公：考试象→正在面对检验或自我对比。",
    inner_state: "谨慎、怕犯错。",
    momentum: "节奏严密，需要缓冲。",
    reminder_points: [
      "把准备动作列清单，只做可控范围。",
      "奖励自己小小仪式，减轻紧绷。",
    ],
  },
  naked: {
    symbolic_meaning: "周公：裸露象→在意他人眼光，害怕真实被放大。",
    inner_state: "怕出丑，同时渴望自由。",
    momentum: "心门想开又犹豫，处于调整期。",
    reminder_points: [
      "先确认自己的边界，再决定分享尺度。",
      "容许自己不完美，轻松一点。",
    ],
  },
  death: {
    symbolic_meaning: "周公：死亡象→旧阶段结束，迎来新的节奏。",
    inner_state: "情绪复杂，夹着不舍与期待。",
    momentum: "正在收尾，需要温柔收心。",
    reminder_points: [
      "做个仪式告别旧阶段，迎接新起点。",
      "不要急着填满行程，让转变有缓冲。",
    ],
  },
  lost: {
    symbolic_meaning: "周公：迷路象→计划暂时没有参照点。",
    inner_state: "心里有点乱，但本能在找方向。",
    momentum: "需要暂停、整理资讯。",
    reminder_points: [
      "把情绪与行动分开记录，帮助澄清。",
      "多问一句“这个是我想要的吗？”。",
    ],
  },
  water: {
    symbolic_meaning: "周公：水象→情绪能量旺，容易被氛围影响。",
    inner_state: "感性面上升，渴望释放。",
    momentum: "水势或平或急，提醒顺势而行。",
    reminder_points: [
      "睡前用温热泡脚或泡澡，安抚心绪。",
      "适度运动排湿，保持能量流动。",
    ],
  },
  house: {
    symbolic_meaning: "周公：屋宅象→内在结构与安全感议题。",
    inner_state: "在乎界线与隐私，想重新整理生活。",
    momentum: "适合收纳、修补和重建。",
    reminder_points: [
      "整理桌面或房间，让空间先清爽。",
      "在关系里说出真实需求。",
    ],
  },
  other: {
    symbolic_meaning: "梦象未明，但潜意识在提醒你暂停、整理。",
    inner_state: "状态复杂，需要先照顾自身节奏。",
    momentum: "保持中性，等待更多线索。",
    reminder_points: [
      "记录梦境碎片，帮助自己的内心对话。",
      "日常多补水、轻运动，稳住气息。",
    ],
  },
};

export function buildDreamArchetypeV2(input: DreamFeaturesInput): DreamStateTags {
  const base = SYMBOLIC_LIBRARY[input.tone] ?? SYMBOLIC_LIBRARY.other;
  const reminder_points = [...base.reminder_points];

  if (input.emotion === "panic") {
    reminder_points.push("深呼吸或热水澡，帮助放慢心跳节奏。");
  }
  if (input.emotion === "calm") {
    reminder_points.push("趁平静把想法记下来，未来会感激现在的你。");
  }

  return {
    symbolic_meaning: base.symbolic_meaning,
    inner_state: base.inner_state,
    momentum: base.momentum,
    reminder_points: reminder_points.slice(0, 5),
  };
}

export const DREAM_ARCHETYPE_BASE: Record<DreamType, DreamArchetype> = {
  chase: {
    type: "chase",
    symbol_meaning: "被追的梦在周公解梦里，多与「有事在催你往前」有关，像是生活中总有一件事在推着你走。",
    mood_pattern: "内心对压力和评价都很在意，有一点「不想被落下」的紧绷感。",
    trend_hint: "这是一个提醒，不是坏预兆：该面对的事慢慢面对，不必再一个人硬扛。",
    suggestion_tags: ["列出最烦的一件事", "拆分成小步骤", "找人聊聊现状"],
    symbol_tags: ["chase", "pressure", "urgency"],
    emotion_tags: ["anxious", "stressed", "pressed"],
    systemTags: ["chase", "pressure"],
  },
  fall: {
    type: "fall",
    symbol_meaning: "坠落的梦常和「安全感」与「失控感」相关，像是脚下的地面突然不稳。",
    mood_pattern: "最近对某个领域的掌控感下降，心里有不确定和担心。",
    trend_hint: "提醒你为自己多准备一点缓冲空间，不要把所有希望压在一件事上。",
    suggestion_tags: ["给自己留退路", "降低一次性期待", "先稳住基本盘"],
    symbol_tags: ["fall", "insecurity", "loss_of_control"],
    emotion_tags: ["worried", "uncertain"],
    systemTags: ["fall", "insecurity"],
  },
  exam: {
    type: "exam",
    symbol_meaning: "考试、迟到、赶不上车之类的梦，在周公解梦体系里，多与「被检验」「怕掉队」有关。",
    mood_pattern: "对表现和结果很在意，怕自己做得不够好，或怕来不及。",
    trend_hint: "这是心里在提醒你：比起一次性完美，更需要稳定输出与节奏感。",
    suggestion_tags: ["制定可执行计划", "给自己减分数焦虑", "重视过程而非一次结果"],
    symbol_tags: ["exam", "test", "performance"],
    emotion_tags: ["anxious", "worried_about_performance"],
    systemTags: ["exam", "performance_anxiety"],
  },
  teeth: {
    type: "teeth",
    symbol_meaning: "掉牙在周公解梦中常与「底气、根基」有关，也容易被联想到家人、长辈与角色变化。",
    mood_pattern: "对家庭、现实基础或身份角色有一点不安感，怕出现变化。",
    trend_hint: "提醒你关照自己和家人的状态，有些话适合及时说，有些安排适合提前想。",
    suggestion_tags: ["关心家人状态", "检查作息与饮食", "整理现实基础问题"],
    symbol_tags: ["teeth", "foundation", "identity"],
    emotion_tags: ["uneasy", "afraid_of_change"],
    systemTags: ["teeth", "identity_change"],
  },
  fly: {
    type: "fly",
    symbol_meaning: "飞翔的梦常与「自由感、突破感」相关，像是想跳出原来的框架。",
    mood_pattern: "内心有对自由、创造或突破的渴望，不想只按部就班。",
    trend_hint: "适合思考下一步想去哪里，但也要让梦想落地到行动。",
    suggestion_tags: ["写下一个小目标", "尝试新体验", "给自己一点探索时间"],
    symbol_tags: ["fly", "freedom", "breakthrough"],
    emotion_tags: ["desire_freedom", "desire_creativity"],
    systemTags: ["fly", "freedom"],
  },
  naked: {
    type: "naked",
    symbol_meaning: "裸露、尴尬的梦，多与「被看见」「被评价」「害怕暴露脆弱」有关。",
    mood_pattern: "在某些场合里，内心对自己是否被接纳很敏感，怕别人看到自己的不完美。",
    trend_hint: "提醒你适度接纳自己的不完美，真实比完美更有力量。",
    suggestion_tags: ["练习说出真实感受", "降低对自己苛刻要求", "在安全环境表达自己"],
    symbol_tags: ["naked", "exposure", "vulnerability"],
    emotion_tags: ["afraid_of_exposure", "sensitive"],
    systemTags: ["naked", "vulnerability"],
  },
  death: {
    type: "death",
    symbol_meaning: "死亡、告别类的梦，在周公体系中不一定是坏事，往往指向一个阶段结束，另一个阶段将要开始。",
    mood_pattern: "对某些关系、身份或习惯有强烈的在意与不舍，同时也在酝酿改变。",
    trend_hint: "提醒你允许旧的东西慢慢退场，把注意力放在新的可能性上。",
    suggestion_tags: ["整理一段旧关系或经历", "给自己一个告别仪式", "思考接下来想成为什么样的人"],
    symbol_tags: ["death", "ending", "transition"],
    emotion_tags: ["reluctant", "expectant", "complex"],
    systemTags: ["death", "transition"],
  },
  lost: {
    type: "lost",
    symbol_meaning: "迷路的梦，多与方向感和选择有关，像是站在人生的十字路口。",
    mood_pattern: "内心对「往哪走」这件事有疑惑，怕走错，也怕不走。",
    trend_hint: "提醒你不用一次性想明白全局，先确认眼前一小步即可。",
    suggestion_tags: ["写下当下最重要的一件事", "减少选择数量", "寻求可信赖人的建议"],
    symbol_tags: ["lost", "direction", "choice"],
    emotion_tags: ["confused", "afraid_of_wrong_choice"],
    systemTags: ["lost", "direction_confusion"],
  },
  water: {
    type: "water",
    symbol_meaning: "水、海、水流在周公解梦中，多与情绪、潜意识、财运相关：水势越大，情绪与能量越强。",
    mood_pattern: "情绪比较活跃，容易被气氛带动，或有财务方面的思考。",
    trend_hint: "提醒你学会顺势而为，不要和情绪硬碰硬。",
    suggestion_tags: ["给自己一个安静时间", "做一点身体运动来疏导", "理一理近期收支"],
    symbol_tags: ["water", "emotion", "subconscious", "wealth"],
    emotion_tags: ["active_emotion", "easily_influenced"],
    systemTags: ["water", "emotion_flow"],
  },
  house: {
    type: "house",
    symbol_meaning: "房屋、房间在周公体系里常象征自我与内心空间，不同房间代表不同生活领域。",
    mood_pattern: "在自我定位、家庭、事业等领域有整理、调整的需求。",
    trend_hint: "适合做一些「生活收纳」式的梳理，把内外空间都理一理。",
    suggestion_tags: ["整理房间", "检查长期未处理的事项", "设一个小小的生活仪式"],
    symbol_tags: ["house", "self", "inner_space"],
    emotion_tags: ["need_organization", "need_adjustment"],
    systemTags: ["house", "inner_space"],
  },
  other: {
    type: "other",
    symbol_meaning: "这个梦包含多种象，适合综合来看，不必被单一符号限制。",
    mood_pattern: "内心在整合不同的情绪与经历，有一点复杂但也在自我消化。",
    trend_hint: "提醒你给自己一点时间，不急着给梦和生活下结论。",
    suggestion_tags: ["记录梦境与感受", "关注一段时间内反复出现的主题", "用温和方式照顾自己"],
    symbol_tags: ["mixed", "complex"],
    emotion_tags: ["integrating", "self_digesting"],
    systemTags: ["other", "complex"],
  },
};

/**
 * 映射梦型标签和信号句
 */
function mapDreamTypeTags(type: DreamType): {
  symbol_tags: string[];
  emotion_tags: string[];
  signal: string;
  systemTags: string[];
} {
  const base = DREAM_ARCHETYPE_BASE[type];
  const symbol_tags: string[] = [];
  const emotion_tags: string[] = [];
  const systemTags: string[] = [`dream_type_${type}`];

  // 根据梦型提取标签
  switch (type) {
    case "chase":
      symbol_tags.push("被追", "压力", "责任");
      emotion_tags.push("焦虑", "紧绷", "在意评价");
      systemTags.push("stress", "pressure");
      break;
    case "fall":
      symbol_tags.push("坠落", "安全感", "失控感");
      emotion_tags.push("担心", "不确定");
      systemTags.push("insecurity", "loss_of_control");
      break;
    case "exam":
      symbol_tags.push("考试", "被检验", "怕掉队");
      emotion_tags.push("在意表现", "怕来不及");
      systemTags.push("performance_anxiety", "time_pressure");
      break;
    case "teeth":
      symbol_tags.push("掉牙", "底气", "根基");
      emotion_tags.push("不安", "怕变化");
      systemTags.push("identity_change", "foundation_shift");
      break;
    case "fly":
      symbol_tags.push("飞翔", "自由感", "突破感");
      emotion_tags.push("渴望自由", "渴望创造");
      systemTags.push("freedom", "breakthrough");
      break;
    case "naked":
      symbol_tags.push("裸露", "被看见", "被评价");
      emotion_tags.push("怕出丑", "渴望自由");
      systemTags.push("vulnerability", "exposure_fear");
      break;
    case "death":
      symbol_tags.push("死亡", "告别", "阶段结束");
      emotion_tags.push("不舍", "期待", "复杂情绪");
      systemTags.push("transition", "ending_beginning");
      break;
    case "lost":
      symbol_tags.push("迷路", "方向感", "选择");
      emotion_tags.push("疑惑", "怕走错");
      systemTags.push("direction_confusion", "decision_anxiety");
      break;
    case "water":
      symbol_tags.push("水", "情绪", "潜意识", "财运");
      emotion_tags.push("情绪活跃", "易被带动");
      systemTags.push("emotion_flow", "subconscious");
      break;
    case "house":
      symbol_tags.push("房屋", "自我", "内心空间");
      emotion_tags.push("整理需求", "调整需求");
      systemTags.push("inner_space", "self_organization");
      break;
    case "other":
      symbol_tags.push("综合象", "复杂");
      emotion_tags.push("整合中", "自我消化");
      systemTags.push("complex", "mixed");
      break;
  }

  const signal = `${base.symbol_meaning} ${base.mood_pattern} ${base.trend_hint}`;

  return {
    symbol_tags,
    emotion_tags,
    signal,
    systemTags,
  };
}

export function buildDreamArchetypeFromText(input: DreamContextInput): DreamArchetype {
  const type = classifyDreamTypeFromText(input.text);
  const base = DREAM_ARCHETYPE_BASE[type];
  const typeTags = mapDreamTypeTags(type);

  // emotionHint 可用于微调 emotion_tags
  if (input.emotionHint) {
    const emotionMap: Record<string, string[]> = {
      fear: ["恐惧", "紧张"],
      sad: ["悲伤", "低落"],
      angry: ["愤怒", "不满"],
      calm: ["平静", "稳定"],
      curious: ["好奇", "探索"],
    };
    const additionalEmotions = emotionMap[input.emotionHint.toLowerCase()] || [];
    typeTags.emotion_tags.push(...additionalEmotions);
    typeTags.systemTags.push(`emotion_${input.emotionHint.toLowerCase()}`);
  }

  return {
    ...base,
    // 新增结构化标签
    symbol_tags: typeTags.symbol_tags,
    emotion_tags: typeTags.emotion_tags,
    dream_type_signal: typeTags.signal,
    systemTags: typeTags.systemTags,
  };
}

