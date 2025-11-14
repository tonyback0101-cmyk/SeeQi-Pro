type HexagramId = number;

type HexagramEntry = {
  name: string;
  chinese: string;
  attributes: string[];
  judgment: string;
  image: string;
  lines?: Record<number, string>;
};

const HEXAGRAMS: Record<HexagramId, HexagramEntry> = {
  1: {
    name: "乾卦",
    chinese: "乾为天",
    attributes: ["创造", "刚健", "主动"],
    judgment: "元亨利贞",
    image: "天行健，君子以自强不息",
    lines: {
      1: "潜龙勿用",
      2: "见龙在田，利见大人",
      3: "君子终日乾乾，夕惕若厉",
      4: "或跃在渊，无咎",
      5: "飞龙在天，利见大人",
      6: "亢龙有悔",
    },
  },
  2: {
    name: "坤卦",
    chinese: "坤为地",
    attributes: ["顺从", "包容", "滋养"],
    judgment: "元亨，利牝马之贞",
    image: "地势坤，君子以厚德载物",
    lines: {
      1: "履霜，坚冰至",
      2: "直方大，不习无不利",
      3: "含章可贞，或从王事，无成有终",
      4: "括囊，无咎无誉",
      5: "黄裳，元吉",
      6: "龙战于野，其血玄黄",
    },
  },
  3: {
    name: "屯卦",
    chinese: "水雷屯",
    attributes: ["初始", "艰难", "孕育"],
    judgment: "元亨，利贞。勿用有攸往，利建侯",
    image: "云雷屯，君子以经纶",
    lines: {
      1: "磐桓，利居贞，利建侯",
      2: "屯如邅如，乘马班如，匪寇婚媾",
      3: "即鹿无虞，惟入于林中，君子几不如舍，往吝",
      4: "乘马班如，求婚媾，往吉，无不利",
      5: "屯其膏，小贞吉，大贞凶",
      6: "乘马班如，泣血涟如",
    },
  },
  4: {
    name: "蒙卦",
    chinese: "山水蒙",
    attributes: ["启蒙", "学习", "启发"],
    judgment: "亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞",
    image: "山下出泉，蒙。君子以果行育德",
    lines: {
      1: "发蒙，利用刑人，用说桎梏，以往吝",
      2: "包蒙，吉；纳妇，吉；子克家",
      3: "勿用取女，见金夫，不有躬。无攸利",
      4: "困蒙，吝",
      5: "童蒙，吉",
      6: "击蒙，不利为寇，利御寇",
    },
  },
  5: {
    name: "需卦",
    chinese: "水天需",
    attributes: ["等待", "聚集", "信念"],
    judgment: "需。有孚，光亨，贞吉。利涉大川",
    image: "云上于天，需。君子以饮食宴乐",
    lines: {
      1: "需于郊，利用恒，无咎",
      2: "需于沙，小有言，终吉",
      3: "需于泥，致寇至",
      4: "需于血，出自穴",
      5: "需于酒食，贞吉",
      6: "入于穴，有不速之客三人来，敬之终吉",
    },
  },
  6: {
    name: "讼卦",
    chinese: "天水讼",
    attributes: ["争执", "辩理", "谨慎"],
    judgment: "讼。有孚窒惕，中吉，终凶。利见大人，不利涉大川",
    image: "天与水违行，讼。君子以作事谋始",
    lines: {
      1: "不永所事，小有言，终吉",
      2: "不克讼，归而逋。其邑人三百户，无眚",
      3: "食旧德，贞厉，终吉。或从王事，无成",
      4: "不克讼，复即命，渝安贞，吉",
      5: "讼，元吉",
      6: "或锡之鞶带，终朝三褫之",
    },
  },
  7: {
    name: "师卦",
    chinese: "地水师",
    attributes: ["团队", "纪律", "谋略"],
    judgment: "师。贞，丈人吉，无咎",
    image: "地中有水，师。君子以容民畜众",
    lines: {
      1: "师出以律，否臧，凶",
      2: "在师中，吉，无咎。王三锡命",
      3: "师或舆尸，凶",
      4: "师左次，无咎",
      5: "田有禽，利执言。无咎。长子帅师，弟子舆尸，贞凶",
      6: "大君有命，开国承家，小人勿用",
    },
  },
  8: {
    name: "比卦",
    chinese: "水地比",
    attributes: ["亲和", "结盟", "诚信"],
    judgment: "比，吉。原筮，元永贞，无咎。不宁方来，后夫凶",
    image: "地上有水，比。先王以建万国，亲诸侯",
    lines: {
      1: "有孚比之，无咎。有孚盈缶，终来有他，吉",
      2: "比之自内，贞吉",
      3: "比之匪人",
      4: "外比之，贞吉",
      5: "显比，王用三驱，失前禽。邑人不诫，吉",
      6: "比之无首，凶",
    },
  },
  9: {
    name: "小畜卦",
    chinese: "风天小畜",
    attributes: ["积累", "收敛", "蓄养"],
    judgment: "小畜。亨。密云不雨，自我西郊",
    image: "风行天上，小畜。君子以懿文德",
    lines: {
      1: "复自道，何其咎，吉",
      2: "牵复，吉",
      3: "舆说辐，夫妻反目",
      4: "有孚，血去惕出，无咎",
      5: "有孚挛如，富以其邻",
      6: "既雨既处，尚德载。妇贞厉。月几望，君子征凶",
    },
  },
  10: {
    name: "履卦",
    chinese: "天泽履",
    attributes: ["礼仪", "谨慎", "实践"],
    judgment: "履虎尾，不咥人，亨",
    image: "上天下泽，履。君子以辨上下，定民志",
    lines: {
      1: "素履，往无咎",
      2: "履道坦坦，幽人贞吉",
      3: "眇能视，跛能履。履虎尾，咥人，凶。武人为于大君",
      4: "履虎尾，愬愬，终吉",
      5: "夬履，贞厉",
      6: "视履考祥，其旋元吉",
    },
  },
  11: {
    name: "泰卦",
    chinese: "地天泰",
    attributes: ["通达", "繁荣", "和谐"],
    judgment: "泰，小往大来，吉亨",
    image: "天地交，泰。后以财成天地之道，辅相天地之宜，以左右民",
    lines: {
      1: "拔茅茹，以其彙，征吉",
      2: "包荒，用冯河，不遐遗，朋亡，得尚于中行",
      3: "无平不陂，无往不复。艰贞无咎。勿恤其孚，于食有福",
      4: "翩翩，不富以其邻，不戒以孚",
      5: "帝乙归妹，以祉元吉",
      6: "城复于隍，勿用师。自邑告命，贞吝",
    },
  },
  12: {
    name: "否卦",
    chinese: "天地否",
    attributes: ["阻隔", "停滞", "内守"],
    judgment: "否之匪人，不利君子贞，大往小来",
    image: "天地不交，否。君子以俭德辟难，不可荣以禄",
    lines: {
      1: "拔茅茹，以其彙，贞吉亨",
      2: "包承，小人吉，大人否。亨",
      3: "包羞",
      4: "有命，无咎，畴离祉",
      5: "休否，大人吉。其亡其亡，系于苞桑",
      6: "倾否，先否后喜",
    },
  },
  13: {
    name: "同人卦",
    chinese: "天火同人",
    attributes: ["协作", "共鸣", "开放"],
    judgment: "同人于野，亨。利涉大川，利君子贞",
    image: "天与火，同人。君子以类族辨物",
    lines: {
      1: "同人于门，无咎",
      2: "同人于宗，吝",
      3: "伏戎于莽，升其高陵，三岁不兴",
      4: "乘其墉，弗克攻，吉",
      5: "同人，先号咷而后笑。大师克相遇",
      6: "同人于郊，无悔",
    },
  },
  14: {
    name: "大有卦",
    chinese: "火天大有",
    attributes: ["丰盛", "自信", "护持"],
    judgment: "大有，元亨",
    image: "火在天上，大有。君子以遏恶扬善，顺天休命",
    lines: {
      1: "无交害，匪咎。艰则无咎",
      2: "大车以载，有攸往，无咎",
      3: "公用亨于天子，小人弗克",
      4: "匪其彭，无咎",
      5: "厥孚交如，威如；吉",
      6: "自天佑之，吉无不利",
    },
  },
  15: {
    name: "谦卦",
    chinese: "地山谦",
    attributes: ["谦逊", "柔和", "积蓄"],
    judgment: "谦亨，君子有终",
    image: "地中有山，谦。君子以裒多益寡，称物平施",
    lines: {
      1: "谦谦君子，用涉大川，吉",
      2: "鸣谦，贞吉",
      3: "劳谦君子，有终，吉",
      4: "无不利，撝谦",
      5: "不富以其邻，利用侵伐，无不利",
      6: "鸣谦，利用行师征邑国",
    },
  },
  16: {
    name: "豫卦",
    chinese: "雷地豫",
    attributes: ["喜悦", "筹备", "感召"],
    judgment: "豫，利建侯行师",
    image: "雷出地奋，豫。先王以作乐崇德，殷荐之上帝，以配祖考",
    lines: {
      1: "鸣豫，凶",
      2: "介于石，不终日，贞吉",
      3: "盱豫，悔。迟有悔",
      4: "由豫，大有得，不疑妻孚",
      5: "贞疾，恒不死",
      6: "冥豫，成有渝，无咎",
    },
  },
  63: {
    name: "既济",
    chinese: "水火既济",
    attributes: ["完成", "平衡", "谨慎"],
    judgment: "亨，小利贞，初吉终乱",
    image: "水在火上，既济。君子以思患而预防之",
    lines: {
      1: "曳其轮，濡其尾，无咎",
      2: "妇丧其茀，勿逐，七日得",
      3: "高宗伐鬼方，三年克之，小人勿用",
      4: "繻有衣袽，终日戒",
      5: "东邻杀牛，不如西邻之禴祭，实受其福",
      6: "濡其首，厉",
    },
  },
};

const MODERN_INTERPRETATION = {
  career: "在事业发展方面，关注节奏与资源整合，保持长期主义并及时调整策略。",
  relationship: "人际关系上强调坦诚沟通与相互支持，主动倾听对方的需求。",
  health: "健康养生方面提醒你调和作息，注意饮食、睡眠与情绪平衡。",
  wisdom: "心灵成长方面启示：保持觉察，适时反思，稳中求进。",
} as const;

type YarrowResult = 6 | 7 | 8 | 9;

type HexagramLine = {
  position: number;
  value: YarrowResult;
  type: "yin" | "yang";
  changing: boolean;
};

type HexagramReading = {
  baseId: HexagramId;
  base: HexagramEntry;
  changingId?: HexagramId;
  changing?: HexagramEntry;
  lines: HexagramLine[];
  interpretation: {
    career: string;
    relationship: string;
    health: string;
    wisdom: string;
  };
};

const RANDOM_COEFFICIENT = 9301;
const RANDOM_INCREMENT = 49297;
const RANDOM_MODULUS = 233280;

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % RANDOM_MODULUS;
  }

  next(): number {
    this.seed = (this.seed * RANDOM_COEFFICIENT + RANDOM_INCREMENT) % RANDOM_MODULUS;
    return this.seed / RANDOM_MODULUS;
  }
}

function getRandomGenerator(seed?: number) {
  if (typeof seed === "number") {
    const random = new SeededRandom(seed);
    return () => random.next();
  }
  return Math.random;
}

function tossYarrow(random: () => number): YarrowResult {
  const results: YarrowResult[] = [6, 7, 8, 9];
  const weights = [1, 5, 7, 3];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = random() * total;
  for (let i = 0; i < results.length; i += 1) {
    threshold -= weights[i];
    if (threshold < 0) return results[i];
  }
  return 7;
}

function toLineType(value: YarrowResult) {
  return value === 7 || value === 9 ? "yang" : "yin";
}

function isChanging(value: YarrowResult) {
  return value === 6 || value === 9;
}

function invert(value: YarrowResult): YarrowResult {
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

function linesToKey(lines: YarrowResult[]) {
  return parseInt(
    lines
      .map((line) => (toLineType(line) === "yang" ? "1" : "0"))
      .reverse()
      .join(""),
    2,
  ) as HexagramId;
}

function findHexagram(id: HexagramId): HexagramEntry {
  return HEXAGRAMS[id] ?? HEXAGRAMS[1];
}

function describeModernAdvice(base: HexagramEntry): { career: string; relationship: string; health: string; wisdom: string } {
  const baseLabel = `${base.name} · ${base.chinese}`;
  return {
    career: `${baseLabel} — ${MODERN_INTERPRETATION.career}`,
    relationship: `${baseLabel} — ${MODERN_INTERPRETATION.relationship}`,
    health: `${baseLabel} — ${MODERN_INTERPRETATION.health}`,
    wisdom: `${baseLabel} — ${MODERN_INTERPRETATION.wisdom}`,
  };
}

export function generateHexagram(seed?: number): HexagramReading {
  const random = getRandomGenerator(seed);
  const rawLines: YarrowResult[] = [];

  for (let i = 0; i < 6; i += 1) {
    rawLines.push(tossYarrow(random));
  }

  const lines: HexagramLine[] = rawLines.map((value, index) => ({
    position: index + 1,
    value,
    type: toLineType(value),
    changing: isChanging(value),
  }));

  const baseId = linesToKey(rawLines);
  const baseHexagram = findHexagram(baseId);

  const transformed = rawLines.map((value) => (isChanging(value) ? invert(value) : value));
  const hasTransform = transformed.some((value, idx) => value !== rawLines[idx]);
  const changingId = hasTransform ? linesToKey(transformed) : undefined;
  const changingHexagram = changingId ? findHexagram(changingId) : undefined;

  const interpretation = describeModernAdvice(changingHexagram ?? baseHexagram);

  return {
    baseId,
    base: baseHexagram,
    changingId,
    changing: changingHexagram,
    lines,
    interpretation,
  };
}

export type { HexagramReading, HexagramLine, HexagramEntry };
