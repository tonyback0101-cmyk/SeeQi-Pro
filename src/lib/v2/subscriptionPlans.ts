/**
 * V2 订阅方案配置
 * 统一收费模型：单次解锁 $1.99 / 月订阅 $9.99 / 年订阅 $99
 * 统一使用 V2 标准环境变量：STRIPE_FULL_REPORT_PRICE_ID, STRIPE_PRICE_SUB_MONTH_USD, STRIPE_PRICE_SUB_YEAR_USD
 */

export type V2PlanKey = "one_time" | "monthly" | "yearly";

export interface V2PlanConfig {
  key: V2PlanKey;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  amountCents: number; // 以分为单位
  currency: string;
  interval?: "month" | "year" | null; // null 表示一次性支付
  envKey: string; // 环境变量中的 Stripe Price ID（V2 标准）
}

export const V2_SUBSCRIPTION_PLANS: V2PlanConfig[] = [
  {
    key: "one_time",
    name: {
      zh: "单次解锁",
      en: "One-time Unlock",
    },
    description: {
      zh: "一次性支付，永久解锁当前报告",
      en: "One-time payment to permanently unlock this report",
    },
    amountCents: 199, // $1.99
    currency: "USD",
    interval: null,
    envKey: "STRIPE_FULL_REPORT_PRICE_ID",
  },
  {
    key: "monthly",
    name: {
      zh: "月度会员",
      en: "Monthly Pro",
    },
    description: {
      zh: "月订阅，随时可取消",
      en: "Monthly subscription, cancel anytime",
    },
    amountCents: 999, // $9.99
    currency: "USD",
    interval: "month",
    envKey: "STRIPE_PRICE_SUB_MONTH_USD",
  },
  {
    key: "yearly",
    name: {
      zh: "年度会员",
      en: "Yearly Pro",
    },
    description: {
      zh: "年订阅，包含年度独家礼遇",
      en: "Yearly subscription with annual perks",
    },
    amountCents: 9900, // $99.00
    currency: "USD",
    interval: "year",
    envKey: "STRIPE_PRICE_SUB_YEAR_USD",
  },
];

/**
 * 获取可用的订阅方案（从环境变量读取 Stripe Price ID）
 * 统一使用 V2 标准环境变量
 */
export function getAvailableV2Plans(): Array<V2PlanConfig & { priceId: string }> {
  const plans: Array<V2PlanConfig & { priceId: string }> = [];

  for (const plan of V2_SUBSCRIPTION_PLANS) {
    const priceId = process.env[plan.envKey];
    
    if (priceId && priceId.trim().length > 0) {
      plans.push({
        ...plan,
        priceId: priceId.trim(),
      });
    } else {
      // 构建时输出警告
      if (typeof window === "undefined") {
        console.warn(`[lib/v2/subscriptionPlans] 缺少环境变量 ${plan.envKey}，请在 .env.local 或 Vercel 环境变量中配置`);
      }
    }
  }

  return plans;
}

/**
 * 根据 key 获取方案
 */
export function getV2PlanByKey(key: V2PlanKey): (V2PlanConfig & { priceId: string }) | null {
  const plans = getAvailableV2Plans();
  return plans.find((p) => p.key === key) ?? null;
}

/**
 * 获取默认方案（优先月订阅，其次年订阅，最后单次）
 */
export function getDefaultV2Plan(): (V2PlanConfig & { priceId: string }) | null {
  const plans = getAvailableV2Plans();
  return plans.find((p) => p.key === "monthly") ?? plans.find((p) => p.key === "yearly") ?? plans[0] ?? null;
}

