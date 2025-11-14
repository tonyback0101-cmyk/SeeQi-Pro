import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("缺少 Stripe 密钥 STRIPE_SECRET_KEY，请在环境变量中配置。");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover" as any,
  });

  return stripeClient;
}
