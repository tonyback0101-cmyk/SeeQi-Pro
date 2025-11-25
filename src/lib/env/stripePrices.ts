/**
 * Stripe 价格环境变量统一管理
 * V2 标准：只使用以下 3 个环境变量
 */

/**
 * 检查 Stripe 价格环境变量是否配置
 * 在构建时或应用启动时调用，如果缺失会输出错误日志
 */
export function validateStripePriceEnvVars(): void {
  // 只在服务端检查（构建时或运行时）
  if (typeof window !== "undefined") {
    return;
  }

  const requiredVars = [
    { key: "STRIPE_FULL_REPORT_PRICE_ID", name: "单次报告解锁" },
    { key: "STRIPE_PRICE_SUB_MONTH_USD", name: "月订阅" },
    { key: "STRIPE_PRICE_SUB_YEAR_USD", name: "年订阅" },
  ];

  const missing: string[] = [];

  for (const { key, name } of requiredVars) {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
      missing.push(`${key} (${name})`);
      console.error(`[env/stripePrices] ❌ 缺少环境变量 ${key} (${name})，请在 .env.local 或 Vercel 环境变量中配置`);
    } else {
      console.log(`[env/stripePrices] ✅ ${key} (${name}) 已配置`);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[env/stripePrices] ⚠️  缺少 ${missing.length} 个必需的环境变量：\n${missing.map((m) => `  - ${m}`).join("\n")}\n` +
        `请在 .env.local 或 Vercel 环境变量中配置这些变量。`
    );
  }
}

// 在模块加载时自动检查（仅服务端）
if (typeof window === "undefined") {
  validateStripePriceEnvVars();
}

/**
 * 获取 Stripe 价格 ID（统一使用 V2 标准环境变量）
 */
export function getStripePriceId(mode: "single" | "sub_month" | "sub_year"): string {
  const envKey =
    mode === "single"
      ? "STRIPE_FULL_REPORT_PRICE_ID"
      : mode === "sub_month"
      ? "STRIPE_PRICE_SUB_MONTH_USD"
      : "STRIPE_PRICE_SUB_YEAR_USD";

  const value = process.env[envKey];

  if (!value || value.trim().length === 0) {
    console.error(`[env/stripePrices] 缺少环境变量 ${envKey}，请在 .env.local 或 Vercel 环境变量中配置`);
    return "";
  }

  return value.trim();
}

