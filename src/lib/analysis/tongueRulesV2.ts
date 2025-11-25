export interface TongueFeatures {
  bodyColor: "light-red" | "red" | "dark-red" | "purple";
  coatingColor: "white" | "yellow" | "none";
  coatingThickness: "thin" | "thick";
  moisture: "moist" | "dry";
  teethMarks: boolean;
}

export interface TongueStateTags {
  energy_state: string; // 气机/能量
  moisture_pattern: string; // 湿/燥
  heat_pattern: string; // 寒/热
  digestive_trend: string; // 胃气、积滞、偏轻偏重
  special_signs: string[]; // 例如 舌边齿痕 等
  // 新增结构化标签（类似 PalmArchetype）
  body_color_tag: string[]; // 舌体颜色标签
  coating_color_tag: string[]; // 舌苔颜色标签
  moisture_tag: string[]; // 湿润度标签
  tongue_color_signal?: string; // 舌体颜色信号句
  tongue_coating_signal?: string; // 舌苔信号句
  tongue_moisture_signal?: string; // 湿润度信号句
  systemTags: string[]; // 系统内部标签
}

/**
 * 映射舌体颜色标签
 */
function mapBodyColorTags(color: TongueFeatures["bodyColor"]): {
  tags: string[];
  signal: string;
  systemTags: string[];
} {
  switch (color) {
    case "light-red":
      return {
        tags: ["气机中等", "状态平稳"],
        signal: "舌色淡红，气机中等偏稳，属于普通轻疲劳状态",
        systemTags: ["body_color_light_red", "energy_medium"],
      };
    case "red":
      return {
        tags: ["用力偏多", "气机外放", "精神易偏亢"],
        signal: "舌色偏红，用力偏多，气机外放，精神易偏亢",
        systemTags: ["body_color_red", "energy_high", "heat_strong"],
      };
    case "dark-red":
      return {
        tags: ["积压感重", "情绪压力", "体能压力"],
        signal: "舌色深红，积压感较重，情绪与体能都有压力感",
        systemTags: ["body_color_dark_red", "energy_pressure", "heat_internal"],
      };
    case "purple":
      return {
        tags: ["气机受阻", "循环偏滞", "情绪易闷"],
        signal: "舌色偏紫，气机受阻、循环偏滞，情绪易闷易累",
        systemTags: ["body_color_purple", "energy_stagnant", "circulation_slow"],
      };
    default:
      return {
        tags: [],
        signal: "",
        systemTags: [],
      };
  }
}

/**
 * 映射舌苔颜色标签
 */
function mapCoatingColorTags(color: TongueFeatures["coatingColor"]): {
  tags: string[];
  signal: string;
  systemTags: string[];
} {
  switch (color) {
    case "white":
      return {
        tags: ["胃气尚可", "轻微积滞"],
        signal: "舌苔白色，胃气尚可，偶有轻微积滞",
        systemTags: ["coating_white", "digestive_normal"],
      };
    case "yellow":
      return {
        tags: ["消化负担重", "容易困倦", "偏热"],
        signal: "舌苔黄色，消化负担偏重，容易困倦",
        systemTags: ["coating_yellow", "digestive_heavy", "heat_strong"],
      };
    case "none":
      return {
        tags: ["精力消耗大", "需要补充", "需要恢复"],
        signal: "舌苔缺失，精力消耗较大，需要补充与恢复",
        systemTags: ["coating_none", "energy_low", "need_recovery"],
      };
    default:
      return {
        tags: [],
        signal: "",
        systemTags: [],
      };
  }
}

/**
 * 映射湿润度标签
 */
function mapMoistureTags(moisture: TongueFeatures["moisture"], thickness: TongueFeatures["coatingThickness"]): {
  tags: string[];
  signal: string;
  systemTags: string[];
} {
  const tags: string[] = [];
  const systemTags: string[] = [];
  let signal = "";

  if (moisture === "moist") {
    tags.push("津液尚可", "平衡偏稳");
    systemTags.push("moisture_adequate");
    signal = "湿润度正常，津液尚可，平衡偏稳";
  } else {
    tags.push("偏燥", "需要补水", "需要减压");
    systemTags.push("moisture_dry");
    signal = "湿润度偏燥，需要补水与减压";
  }

  if (thickness === "thin") {
    tags.push("湿度正常或偏轻");
    systemTags.push("coating_thin");
  } else {
    tags.push("湿重偏明显", "容易疲倦", "身体沉滞");
    systemTags.push("coating_thick", "dampness_heavy");
    if (!signal) {
      signal = "舌苔偏厚，湿重偏明显，容易疲倦或身体沉滞";
    }
  }

  return { tags, signal, systemTags };
}

/**
 * 入口函数：将舌象特征 → 状态标签
 * 供 LLM 解读使用
 */
export function inferTongueArchetype(input: TongueFeatures): TongueStateTags {
  let energy_state = "";
  let moisture_pattern = "";
  let heat_pattern = "";
  let digestive_trend = "";
  let special_signs: string[] = [];

  /* -----------------------------
     舌体颜色（bodyColor）
     ----------------------------- */
  const bodyColorRes = mapBodyColorTags(input.bodyColor);
  switch (input.bodyColor) {
    case "light-red":
      energy_state = "气机中等偏稳，属于普通轻疲劳状态";
      break;
    case "red":
      energy_state = "用力偏多，气机外放，精神易偏亢";
      heat_pattern = "偏热";
      break;
    case "dark-red":
      energy_state = "积压感较重，情绪与体能都有压力感";
      heat_pattern = "内热或郁热倾向";
      break;
    case "purple":
      energy_state = "气机受阻、循环偏滞，情绪易闷易累";
      break;
  }

  /* -----------------------------
     舌苔颜色（coatingColor）
     ----------------------------- */
  const coatingColorRes = mapCoatingColorTags(input.coatingColor);
  if (input.coatingColor === "white") {
    digestive_trend = "胃气尚可，偶有轻微积滞";
  }
  if (input.coatingColor === "yellow") {
    digestive_trend = "消化负担偏重，容易困倦";
    heat_pattern = heat_pattern || "偏热";
  }
  if (input.coatingColor === "none") {
    digestive_trend = "精力消耗较大，需要补充与恢复";
  }

  /* -----------------------------
     厚薄（coatingThickness）和湿润度（moisture）
     ----------------------------- */
  const moistureRes = mapMoistureTags(input.moisture, input.coatingThickness);
  if (input.coatingThickness === "thin") {
    moisture_pattern = "湿度正常或偏轻";
  } else {
    moisture_pattern = "湿重偏明显，容易疲倦或身体沉滞";
  }
  if (input.moisture === "moist") {
    moisture_pattern = moisture_pattern || "津液尚可，平衡偏稳";
  } else {
    moisture_pattern = "偏燥，需要补水与减压";
  }

  /* -----------------------------
     齿痕（teethMarks）
     ----------------------------- */
  if (input.teethMarks) {
    special_signs.push("舌边齿痕 → 气虚/水湿偏重，容易无力感或水肿");
  }

  // 合并所有 systemTags
  const systemTags = [
    ...bodyColorRes.systemTags,
    ...coatingColorRes.systemTags,
    ...moistureRes.systemTags,
    ...(input.teethMarks ? ["teeth_marks", "qi_deficiency"] : []),
  ];

  // 生成器官保健向标签（用于 focus_tags 和 suggestion_tags）
  const organCareTags: string[] = [];
  
  // 根据舌色判断需要关注的器官
  if (input.bodyColor === "red" || input.bodyColor === "dark-red") {
    organCareTags.push("注意肝脏", "liver_care");
  }
  if (input.coatingColor === "yellow" || input.coatingThickness === "thick") {
    organCareTags.push("注意脾胃", "spleen_stomach_care");
  }
  if (input.moisture === "dry" || input.coatingColor === "none") {
    organCareTags.push("注意肾部保养", "kidney_care");
  }
  if (input.bodyColor === "purple" || input.teethMarks) {
    organCareTags.push("注意肾气", "kidney_qi_care");
  }

  // 将器官保健标签添加到 special_signs（用于 focus_tags）
  if (organCareTags.length > 0) {
    const organCareText = organCareTags.filter(tag => !tag.includes("_")).join("、");
    if (organCareText) {
      special_signs.push(`需要特别关照：${organCareText}`);
    }
  }

  return {
    energy_state,
    moisture_pattern,
    heat_pattern: heat_pattern || "平",
    digestive_trend,
    special_signs,
    // 新增结构化标签
    body_color_tag: bodyColorRes.tags,
    coating_color_tag: coatingColorRes.tags,
    moisture_tag: moistureRes.tags,
    tongue_color_signal: bodyColorRes.signal,
    tongue_coating_signal: coatingColorRes.signal,
    tongue_moisture_signal: moistureRes.signal,
    systemTags: [...systemTags, ...organCareTags.filter(tag => tag.includes("_"))],
  };
}

