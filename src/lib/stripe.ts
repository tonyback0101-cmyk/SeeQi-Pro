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

  // 验证密钥格式（Stripe 密钥应该以 sk_test_ 或 sk_live_ 开头）
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error(`STRIPE_SECRET_KEY 格式无效。Stripe 密钥应以 sk_test_ 或 sk_live_ 开头，当前值: ${secretKey.substring(0, 10)}...`);
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover" as any,
  });

  return stripeClient;
}
