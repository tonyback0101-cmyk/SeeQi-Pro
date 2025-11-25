import type { AlmanacInfo } from "./calendar";

/**
 * 黄历（宜忌 + 节气） → 气运偏移
 * 用作环境层调味，权重较轻
 */

const YI_WEIGHTS: Record<string, number> = {
  开市: 8,
  求财: 6,
  祈福: 6,
  出行: 4,
  赴约: 4,
  见贵: 5,
  会友: 4,
  纳财: 6,
  安床: 2,
  问事: 3,
};

const JI_WEIGHTS: Record<string, number> = {
  动土: -6,
  求医: -8,
  官事: -6,
  签约: -5,
  开仓: -4,
  破土: -6,
  诉讼: -6,
  安葬: -4,
  远行: -4,
};

const SOLAR_TERM_WEIGHTS: Record<string, number> = {
  立春: 6,
  雨水: 2,
  惊蛰: 5,
  春分: 4,
  清明: 3,
  谷雨: 2,
  立夏: 4,
  小满: 3,
  芒种: 1,
  夏至: 2,
  小暑: -2,
  大暑: -4,
  立秋: 3,
  处暑: 1,
  白露: 2,
  秋分: 3,
  寒露: 1,
  霜降: -2,
  立冬: 2,
  小雪: 0,
  大雪: -2,
  冬至: 2,
  小寒: -3,
  大寒: -4,
};

export function scoreAlmanacForQiV2(alm: AlmanacInfo): number {
  let score = 50;

  if (alm.yi?.length) {
    for (const item of alm.yi) {
      score += matchWeight(item, YI_WEIGHTS);
    }
  }

  if (alm.ji?.length) {
    for (const item of alm.ji) {
      score += matchWeight(item, JI_WEIGHTS);
    }
  }

  if (alm.lunarTerm) {
    score += SOLAR_TERM_WEIGHTS[alm.lunarTerm] ?? 0;
  }

  // 环境因素不宜过度摇摆，控制区间
  return Math.max(30, Math.min(70, score));
}

function matchWeight(item: string, weights: Record<string, number>): number {
  for (const key of Object.keys(weights)) {
    if (item.includes(key)) {
      return weights[key];
    }
  }
  return 0;
}

