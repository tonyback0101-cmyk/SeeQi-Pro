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

const PLAN_CONFIG: PlanConfig[] = [
  {
    key: "monthly",
    envKeys: ["STRIPE_PRO_PRICE_MONTH", "STRIPE_PRICE_SUB_MONTH_USD", "STRIPE_PRICE_SUP_MONTH_USD"],
  },
  {
    key: "yearly",
    envKeys: ["STRIPE_PRO_PRICE_YEAR", "STRIPE_PRICE_SUB_YEAR_USD", "STRIPE_PRICE_SUP_YEAR_USD"],
  },
  {
    key: "lifetime",
    envKeys: [
      "STRIPE_PRO_PRICE_LIFETIME",
      "STRIPE_PRO_PRICE_ID",
      "STRIPE_PRICE_REPORT_ONE_USD",
      "STRIPE_FULL_REPORT_PRICE_ID",
    ],
  },
];

const planCache = new Map<string, ProPlanInfo>();

function resolvePriceId(config: PlanConfig): string | null {
  for (const key of config.envKeys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

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
