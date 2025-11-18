import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim().length === 0) {
    throw new Error("STRIPE_SECRET_KEY 环境变量未配置。请在 Vercel 环境变量中设置有效的 Stripe 密钥");
  }

  // 检查是否是占位值
  const trimmedKey = secretKey.trim();
  if (
    trimmedKey === "sk_test_xxx" ||
    trimmedKey === "sk_live_xxx" ||
    trimmedKey.includes("placeholder") ||
    trimmedKey.length < 20 // Stripe 密钥通常至少 32 个字符
  ) {
    throw new Error(
      `STRIPE_SECRET_KEY 似乎是占位值或无效。请在 Vercel 环境变量中设置真实的 Stripe 密钥（从 Stripe Dashboard 获取）。当前值: ${trimmedKey.substring(0, 15)}...`
    );
  }

  // 验证密钥格式（Stripe 密钥应该以 sk_test_ 或 sk_live_ 开头）
  if (!trimmedKey.startsWith("sk_test_") && !trimmedKey.startsWith("sk_live_")) {
    throw new Error(`STRIPE_SECRET_KEY 格式无效。Stripe 密钥应以 sk_test_ 或 sk_live_ 开头，当前值: ${trimmedKey.substring(0, 15)}...`);
  }

  stripeClient = new Stripe(trimmedKey, {
    apiVersion: "2025-10-29.clover" as any,
  });

  return stripeClient;
}
