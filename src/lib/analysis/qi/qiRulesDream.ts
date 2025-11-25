import type { DreamInsight } from "./types";

// ---------------------------------------------
// 梦象 → 气运偏移规则（周公体系 × 东方象义）
// 本规则由 SeeQi V2 使用，用于 scoreDreamForQiV2()
// ---------------------------------------------

export const dreamQiRuleMap: Record<string, number> = {
  // A. 人物 & 自身
  飞行: +10,
  掉牙: -6,
  被追: -8,
  坠落: -10,
  考试: -3,
  怀孕: +8,
  裸体: -3,
  迷路: -5,
  死亡: 0, // 大变动 → 归零，不加不减
  重生: +6,
  被骂: -4,
  被表扬: +6,
  找不到鞋: -4,
  找不到包: -4,
  迟到: -3,
  逃跑: -6,
  躲藏: -5,
  生病: -4,
  流泪: +2,
  大笑: +4,

  // B. 家庭 & 人际
  家人哭: -4,
  家人笑: +4,
  旧人相见: -2,
  陌生人争吵: -4,
  婚礼: +6,
  葬礼: 0, // 结束象，不算坏，不算好
  分手: -4,
  合好: +4,
  邀请别人: +3,
  被拒绝: -3,
  拥抱: +4,
  吵架: -6,
  家里漏水: -5,
  家里进贼: -6,
  家里修缮: +3,

  // C. 动物象
  蛇: +5,
  蛇咬: +8,
  狗: +4,
  狗咬: -4,
  猫: -2,
  猫咬: -4,
  虎: -2, // 大气势，既吉且压，取中性略偏压
  被虎追: -10,
  鸟: +3,
  鸟飞走: -3,
  鱼: +4,
  捉鱼: +8,
  鱼死: -6,
  马: +5,
  马跑: +2,
  牛: +2,
  牛追: -5,
  猪: +3,
  猪跑丢: -4,
  羊: +2,

  // D. 自然象
  大水: -4,
  洪水: -8,
  清水: +4,
  深水: -4,
  浑水: -5,
  火: +2, // 火势不明 → 中性偏动
  火灾: -6,
  风: +2,
  暴风: -6,
  雨: +3,
  大雨: -3,
  雪: +2,
  雷: -4,
  电: +4,
  地震: -10,

  // E. 物象
  钱: +5,
  钱丢: -6,
  房屋: +2,
  房屋塌: -10,
  门打不开: -5,
  手机坏: -4,
  灯不亮: -4,
  书本: +2,
  鞋破: -3,
  钥匙丢: -5,
};

// ---------------------------------------------
// 统一对外暴露的计算函数
// ---------------------------------------------
export function scoreDreamForQiBySymbol(symbol: string): number {
  for (const key in dreamQiRuleMap) {
    if (symbol.includes(key)) {
      return dreamQiRuleMap[key];
    }
  }
  return 0; // 未匹配 → 不加不减
}

export function scoreDreamForQiV2(dream: DreamInsight): number {
  let score = 50;

  const symbolText = dream.symbol ?? dream.symbolic ?? "";
  if (symbolText) {
    score += scoreDreamForQiBySymbol(symbolText);
  }

  if (dream.trend) {
    const trend = dream.trend;
    if (trend.includes("推进") || trend.includes("被推进")) score -= 5;
    if (trend.includes("硬撑") || trend.includes("勉强")) score -= 6;
    if (trend.includes("压力") || trend.includes("紧张")) score -= 4;
    if (trend.includes("调整")) score -= 3;
    if (trend.includes("展开")) score += 5;
    if (trend.includes("上升") || trend.includes("提升")) score += 4;
    if (trend.includes("机会") || trend.includes("机遇")) score += 5;
    if (trend.includes("顺利") || trend.includes("顺畅")) score += 4;
  }

  return Math.max(10, Math.min(90, score));
}


