import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // 在构建时，如果环境变量不存在，使用占位值以避免构建失败
    // 实际运行时会在第一次使用时检查并抛出错误
    const placeholderKey = "sk_test_placeholder_key_for_build_time";
    stripeClient = new Stripe(placeholderKey, {
      apiVersion: "2025-10-29.clover" as any,
    });
    console.warn("[stripe] 警告：STRIPE_SECRET_KEY 未配置，使用占位值。生产环境必须配置正确的密钥");
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover" as any,
  });

  return stripeClient;
}
