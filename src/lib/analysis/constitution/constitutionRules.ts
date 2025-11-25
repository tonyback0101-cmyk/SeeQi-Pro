const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const PALM_RULES: Record<string, number> = {
  生命线深: 8,
  生命线浅: -6,
  感情线敏感: -4,
  智慧线清晰: 6,
  智慧线断续: -6,
  掌色偏红: 4,
  掌色偏暗: -6,
  纹理细密: 3,
  纹理粗糙: -3,
};

export function scoreConstitutionPalm(text: string): number {
  let score = 50;
  const source = text || "";
  for (const key of Object.keys(PALM_RULES)) {
    if (source.includes(key)) {
      score += PALM_RULES[key];
    }
  }
  return clamp(score, 20, 80);
}

export const TONGUE_RULES: Record<string, number> = {
  湿滞: -8,
  虚寒: -6,
  火旺: 5,
  气虚: -6,
  偏干: -5,
  偏湿: -5,
  舌尖红: -3,
  薄白: 2,
  黄腻: -6,
  厚白: -4,
};

export function scoreConstitutionTongue(text: string): number {
  let score = 50;
  const source = text || "";
  for (const key of Object.keys(TONGUE_RULES)) {
    if (source.includes(key)) {
      score += TONGUE_RULES[key];
    }
  }
  return clamp(score, 20, 85);
}

export const DREAM_RULES: Record<string, number> = {
  飞行: 10,
  被追: -8,
  掉牙: -7,
  坠落: -6,
  考试: -5,
  乘车: 3,
  遇贵人: 8,
  动物温顺: 4,
  动物攻击: -5,
};

export function scoreConstitutionDream(text: string): number {
  let score = 50;
  const source = text || "";
  for (const key of Object.keys(DREAM_RULES)) {
    if (source.includes(key)) {
      score += DREAM_RULES[key];
    }
  }
  return clamp(score, 20, 90);
}


