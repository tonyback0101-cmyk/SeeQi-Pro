/**
 * 掌纹象意（长期底盘）→ 气运轻量偏移
 * 只影响 10% 权重，范围控制在 45-60
 */

// ---------------------------------------------
// 掌纹象意词库（专业版，不涉医疗）
// ---------------------------------------------
export const palmQiRuleMap: Record<string, number> = {
  // 生命线
  "生命线深长清晰": +2,
  "生命线浅短断续": -2,
  "生命线分叉多": -1,
  "生命线岛纹多": -2,
  // 感情线
  "感情线深长清晰": +1,
  "感情线浅短断续": -1,
  "感情线分叉多": -1,
  "感情线岛纹多": -1,
  // 智慧线
  "智慧线深长清晰": +1,
  "智慧线浅短断续": -1,
  "智慧线分叉多": -1,
  "智慧线岛纹多": -1,
  // 财富线
  "财富线深长清晰": +2,
  "财富线浅短断续": -1,
  "财富线分叉多": -1,
  "财富线岛纹多": -1,
  // 通用关键词（兼容旧格式）
  深长清晰: +1,
  浅短断续: -1,
  分叉多: -1,
  岛纹多: -1,
  // 其他
  横切多: -3,
  竖纹多: +1,
};

// ---------------------------------------------
// scorePalmForQiV2：掌纹象意加权
// ---------------------------------------------
export function scorePalmForQiV2(summaryText: string): number {
  if (!summaryText) return 50;

  let score = 50;
  const keywords = Object.keys(palmQiRuleMap);

  for (const keyword of keywords) {
    if (summaryText.includes(keyword)) {
      score += palmQiRuleMap[keyword];
    }
  }

  // 掌纹影响仅作底盘微调，锁定 45-60
  return Math.max(45, Math.min(60, score));
}
