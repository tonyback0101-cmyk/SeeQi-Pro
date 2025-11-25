import { getStripeClient } from "./stripe";

export type ProPlanKey = "monthly" | "yearly" | "lifetime";

type PlanConfig = {
  key: ProPlanKey;
  envKeys: string[];
};

type PlanInterval = "day" | "week" | "month" | "year";

export type ProPlanInfo = {
  key: ProPlanKey;
  priceId: string;
  amount: number;
  currency: string;
  type: "recurring" | "one_time";
  interval?: PlanInterval;
};

/**
 * 统一使用 V2 标准环境变量获取价格 ID
 */
function resolvePriceId(config: PlanConfig): string | null {
  // 统一映射到 V2 标准环境变量
  const envKeyMap: Record<ProPlanKey, string> = {
    monthly: "STRIPE_PRICE_SUB_MONTH_USD",
    yearly: "STRIPE_PRICE_SUB_YEAR_USD",
    lifetime: "STRIPE_FULL_REPORT_PRICE_ID", // lifetime 使用单次报告价格
  };
  
  const envKey = envKeyMap[config.key];
  if (!envKey) {
    return null;
  }
  
  const value = process.env[envKey];
  if (!value || value.trim().length === 0) {
    console.error(`[lib/proPlans] 缺少环境变量 ${envKey}，请在 .env.local 或 Vercel 环境变量中配置`);
    return null;
  }
  
  return value.trim();
}

const PLAN_CONFIG: PlanConfig[] = [
  {
    key: "monthly",
    envKeys: [], // 不再使用，统一通过 resolvePriceId 处理
  },
  {
    key: "yearly",
    envKeys: [], // 不再使用，统一通过 resolvePriceId 处理
  },
  {
    key: "lifetime",
    envKeys: [], // 不再使用，统一通过 resolvePriceId 处理
  },
];

const planCache = new Map<string, ProPlanInfo>();

export async function getProPlanInfo(plan: ProPlanKey): Promise<ProPlanInfo | null> {
  const config = PLAN_CONFIG.find((item) => item.key === plan);
  if (!config) {
    return null;
  }

  const priceId = resolvePriceId(config);
  if (!priceId) {
    return null;
  }

  const cacheKey = `${plan}:${priceId}`;
  const cached = planCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.warn("proPlans:getStripeClient", error);
    return null;
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price || !price.currency || typeof price.unit_amount !== "number") {
      return null;
    }

    const planInfo: ProPlanInfo = {
      key: plan,
      priceId,
      amount: price.unit_amount,
      currency: price.currency.toUpperCase(),
      type: price.type === "recurring" ? "recurring" : "one_time",
      interval: price.recurring?.interval as PlanInterval | undefined,
    };

    planCache.set(cacheKey, planInfo);
    return planInfo;
  } catch (error) {
    console.error("proPlans:getProPlanInfo", plan, error);
    return null;
  }
}

export async function getAvailableProPlans(): Promise<ProPlanInfo[]> {
  const results = await Promise.all(PLAN_CONFIG.map((config) => getProPlanInfo(config.key)));
  return results.filter((item): item is ProPlanInfo => Boolean(item));
}

export function getDefaultProPlan(plans: ProPlanInfo[]): ProPlanInfo | null {
  if (plans.length === 0) {
    return null;
  }

  const priority: ProPlanKey[] = ["monthly", "yearly", "lifetime"];
  for (const key of priority) {
    const match = plans.find((plan) => plan.key === key);
    if (match) {
      return match;
    }
  }

  return plans[0] ?? null;
}











