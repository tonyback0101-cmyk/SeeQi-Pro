import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY 未配置，目前无法创建支付会话");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey, {
      apiVersion: "2025-10-29.clover" as any,
    });
  }
  return stripeSingleton;
}
