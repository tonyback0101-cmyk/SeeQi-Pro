export type PlanBillingType = "one_time" | "subscription";

export interface ProPlan {
  id: "single" | "monthly" | "yearly";
  name: string;
  description: string;
  price: number;
  priceText: string;
  billingType: PlanBillingType;
  stripePriceId: string;
}

/**
 * 获取 Stripe 价格 ID（统一使用 V2 标准环境变量）
 */
function getStripePriceId(mode: "single" | "sub_month" | "sub_year"): string {
  const envKey =
    mode === "single"
      ? "STRIPE_FULL_REPORT_PRICE_ID"
      : mode === "sub_month"
      ? "STRIPE_PRICE_SUB_MONTH_USD"
      : "STRIPE_PRICE_SUB_YEAR_USD";
  
  const value = process.env[envKey];
  
  if (!value || value.trim().length === 0) {
    if (typeof window === "undefined") {
      // 服务端：输出错误日志
      console.error(`[lib/billing/plans] 缺少环境变量 ${envKey}，请在 .env.local 或 Vercel 环境变量中配置`);
    }
    return "";
  }
  
  return value.trim();
}

export const PRO_PLANS: ProPlan[] = [
  {
    id: "single",
    name: "一次解锁单份报告",
    description: "一次付费，解锁本账户的完整报告查看权限",
    price: 1.99,
    priceText: "US$1.99",
    billingType: "one_time",
    stripePriceId: getStripePriceId("single"),
  },
  {
    id: "monthly",
    name: "月会员",
    description: "30 天内不限次数生成与查看报告",
    price: 9.99,
    priceText: "US$9.99",
    billingType: "subscription",
    stripePriceId: getStripePriceId("sub_month"),
  },
  {
    id: "yearly",
    name: "年会员",
    description: "一年内不限次数生成与查看报告",
    price: 99,
    priceText: "US$99",
    billingType: "subscription",
    stripePriceId: getStripePriceId("sub_year"),
  },
];

export function getAvailableProPlans(): ProPlan[] {
  return PRO_PLANS.filter((plan) => plan.stripePriceId && plan.stripePriceId.trim().length > 0);
}

export function getDefaultProPlan(): ProPlan {
  return PRO_PLANS[1]; // 默认选中月度
}

export function getProPlanById(id: "single" | "monthly" | "yearly"): ProPlan | null {
  return PRO_PLANS.find((plan) => plan.id === id) ?? null;
}

