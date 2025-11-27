import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { distributeAffiliateCommissions, reverseCommissionsForOrder } from "@/lib/affiliate/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

const stripe = getStripeClient();
// 在构建时，如果环境变量不存在，使用占位值以避免构建失败
// 实际运行时会在 POST 函数中检查并抛出错误
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "placeholder-webhook-secret";

async function getSupabase() {
  return getSupabaseAdminClient();
}

async function upsertOrderFromSession(session: Stripe.Checkout.Session) {
  const supabase = await getSupabase();

  if (!session.metadata?.userId) {
    throw new Error("Checkout session 缺少 userId 元数据");
  }

  if (!session.amount_total || !session.currency) {
    throw new Error("Checkout session 缺少金额或币种信息");
  }

  // V2 统一 metadata 格式：user_id, mode, report_id
  const purchaserId = session.metadata?.user_id ?? session.metadata?.userId; // 兼容旧格式
  const mode = session.metadata?.mode as "single" | "sub_month" | "sub_year" | undefined;
  const reportId = session.metadata?.report_id ?? session.metadata?.reportId ?? null; // 兼容旧格式
  
  if (!purchaserId) {
    throw new Error("Checkout session 缺少 user_id 元数据");
  }

  const amountCents = session.amount_total ?? 0; // 金额（分）
  const currency = session.currency.toLowerCase(); // 'usd'
  
  // 根据 mode 确定 kind
  const kind = mode === "single" ? "single" 
    : mode === "sub_month" ? "sub_month" 
    : mode === "sub_year" ? "sub_year"
    : (session.mode === "subscription" ? "sub_month" : "single"); // 默认值
  
  // 获取 payment_intent_id
  const paymentIntentId = typeof session.payment_intent === "string" 
    ? session.payment_intent 
    : session.payment_intent?.id ?? null;

  // 检查是否已存在订单（使用新的字段名）
  // 优先查找 pending 状态的订单（由 checkout 接口创建）
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  // 如果订单已存在且状态为 paid，直接返回（避免重复处理）
  if (existingOrder?.id && existingOrder.status === "paid") {
    return existingOrder.id as string;
  }

  // 如果订单已存在且状态为 pending，更新为 paid
  if (existingOrder?.id && existingOrder.status === "pending") {
    const paymentIntentId = typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : session.payment_intent?.id ?? null;

    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingOrder.id);
    
    console.log(`[upsertOrderFromSession] Updated pending order ${existingOrder.id} to paid`);
    return existingOrder.id as string;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("inviter_id")
    .eq("user_id", purchaserId)
    .maybeSingle();

  const referrerId = session.metadata.referrerId ?? profile?.inviter_id ?? null;

  // 构建订单数据（使用新字段结构）
  const orderData: Record<string, any> = {
    user_id: purchaserId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    amount: amountCents, // 金额（分）
    currency: currency,
    kind: kind, // 'single' | 'sub_month' | 'sub_year'
    report_id: reportId, // kind='single' 时必填
    status: "paid",
    updated_at: new Date().toISOString(),
  };

  if (existingOrder?.id) {
    // 更新现有订单
    await supabase
      .from("orders")
      .update(orderData)
      .eq("id", existingOrder.id);
    return existingOrder.id as string;
  }

  // 插入新订单
  orderData.created_at = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from("orders")
    .insert(orderData)
    .select("id")
    .single();

  if (error || !inserted?.id) {
    throw new Error(error?.message ?? "订单写入失败");
  }

  return inserted.id as string;
}

/**
 * 标记用户为 Pro 用户
 * V2 规范：pro_plan 值为 'none' | 'sub_month' | 'sub_year'
 */
async function markUserAsPro(userId: string, planId: string | undefined) {
  const supabase = await getSupabase();
  
  // 映射 planId 到 pro_plan 值
  let proPlan: "none" | "sub_month" | "sub_year" = "none";
  if (planId === "monthly") {
    proPlan = "sub_month";
  } else if (planId === "yearly") {
    proPlan = "sub_year";
  } else if (planId === "single") {
    // 单次购买不改变 pro_plan，只标记 is_pro（如果需要）
    proPlan = "none";
  }

  const updateData: Record<string, any> = {
    is_pro: true,
    pro_plan: proPlan,
    updated_at: new Date().toISOString(),
  };

  // 如果存在 stripe_customer_id，也更新
  // 注意：这里需要从 session 获取 customer_id，但函数签名中没有，需要在调用处处理

  const { error } = await supabase
    .from("user_profiles")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error("stripe-webhook:mark-user-pro-error", { userId, planId, proPlan, error });
  } else {
    console.log("stripe-webhook:user-marked-pro", { userId, planId, proPlan });
  }
}

/**
 * 处理 checkout.session.completed 事件
 * 核心逻辑：更新 orders 表，根据 mode 分流处理权限
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = await getSupabase();
  const metadata = session.metadata || {};
  
  const userId = metadata.user_id;
  const mode = metadata.mode as "single" | "sub_month" | "sub_year" | undefined;
  const reportId = metadata.report_id || null;
  
  if (!userId) {
    console.error("stripe-webhook:checkout-completed-missing-user-id", { sessionId: session.id });
    return;
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;

  // 1. 更新 orders 表：标记为 paid
  try {
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (existingOrder?.id) {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingOrder.id);
      console.log(`[handleCheckoutCompleted] Updated order ${existingOrder.id} to paid`);
    } else {
      // 如果没有找到 pending 订单，创建新订单（兼容旧流程）
      const amountCents = session.amount_total ?? 0;
      const kind = mode === "single" ? "single" 
        : mode === "sub_month" ? "sub_month" 
        : mode === "sub_year" ? "sub_year"
        : "single";
      
      await supabase.from("orders").insert({
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount: amountCents,
        currency: session.currency?.toLowerCase() ?? "usd",
        kind,
        report_id: mode === "single" ? reportId : null,
        status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`[handleCheckoutCompleted] Created new order for session ${session.id}`);
    }
  } catch (error) {
    console.error("stripe-webhook:update-order-error", { sessionId: session.id, error });
    // 不阻止流程继续
  }

  // 2. 更新 user_profiles.stripe_customer_id
  if (customerId) {
    try {
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    } catch (error) {
      console.error("stripe-webhook:update-customer-id-error", { userId, customerId, error });
    }
  }

  // 3. 根据 mode 分流处理
  if (mode === "single" && reportId) {
    // 单次报告权限：写入 report_access
    try {
      await supabase
        .from("report_access")
        .upsert(
          {
            user_id: userId,
            report_id: reportId,
            tier: "full",
          },
          {
            onConflict: "report_id,user_id",
          }
        );
      console.log("stripe-webhook:single-access-granted", { userId, reportId });
    } catch (error) {
      console.error("stripe-webhook:single-access-error", { userId, reportId, error });
    }
  } else if (mode === "sub_month" || mode === "sub_year") {
    if (!subscriptionId || !customerId) {
      console.error("stripe-webhook:subscription-missing-ids", { userId, subscriptionId, customerId });
      return;
    }

    const plan = mode; // 'sub_month' | 'sub_year'

    // 获取订阅详情以获取 current_period_end
    let currentPeriodEnd: string | null = null;
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription && typeof subscription === 'object' && 'current_period_end' in subscription && subscription.current_period_end) {
        currentPeriodEnd = new Date((subscription.current_period_end as number) * 1000).toISOString();
      }
    } catch (error) {
      console.warn("stripe-webhook:subscription-retrieve-error", { subscriptionId, error });
    }

    // 写 subscriptions 表
    try {
      await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: "active",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "stripe_subscription_id",
          }
        );
      console.log("stripe-webhook:subscription-recorded", { userId, subscriptionId, plan });
    } catch (error) {
      console.error("stripe-webhook:subscription-error", { userId, subscriptionId, error });
    }

    // 更新 user_profiles.is_pro / pro_plan
    try {
      await supabase
        .from("user_profiles")
        .update({
          is_pro: true,
          pro_plan: plan, // 'sub_month' or 'sub_year'
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      console.log("stripe-webhook:user-pro-updated", { userId, plan });
    } catch (error) {
      console.error("stripe-webhook:user-pro-update-error", { userId, plan, error });
    }
  } else {
    console.warn("stripe-webhook:unknown-mode", { mode, sessionId: session.id });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscription = (invoice as any).subscription;
  const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
  const amountPaid = invoice.amount_paid ?? invoice.amount_due ?? 0;
  if (!subscriptionId || amountPaid <= 0) {
    return;
  }

  const supabase = await getSupabase();

  const mergedMetadata: Record<string, any> = {
    ...(invoice.metadata ?? {}),
  };

  if (!mergedMetadata.userId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    Object.assign(mergedMetadata, subscription.metadata ?? {});
  }

  if (!mergedMetadata.userId) {
    console.warn("stripe-webhook:invoice-missing-user", { invoiceId: invoice.id });
    return;
  }

  const purchaserId = mergedMetadata.userId as string;
  const amountCents = amountPaid; // 金额（分）
  const currency = invoice.currency?.toLowerCase() ?? "usd";
  
  // V2: 从 metadata 获取 kind 和 planId
  const planId = mergedMetadata.planId as "single" | "monthly" | "yearly" | undefined;
  const kind = planId === "monthly" ? "sub_month" 
    : planId === "yearly" ? "sub_year"
    : "sub_month"; // 订阅续费默认是月订阅

  // 获取 payment_intent_id
  const paymentIntentId = typeof invoice === 'object' && invoice !== null && 'payment_intent' in invoice
    ? typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : (invoice.payment_intent as any)?.id ?? null
    : null;

  // 查询是否已存在订单（通过 payment_intent_id）
  // 注意：续费订单可能没有 checkout_session_id，只有 payment_intent_id
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId ?? "")
    .maybeSingle();
  
  // 如果通过 payment_intent_id 没找到，尝试通过 invoice.id 查找（兼容旧数据）
  let existingOrderId = existing?.id;
  if (!existingOrderId && invoice.id) {
    const { data: existingByInvoice } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_checkout_session_id", invoice.id)
      .maybeSingle();
    existingOrderId = existingByInvoice?.id;
  }

  if (existingOrderId) {
    await distributeAffiliateCommissions(supabase, {
      orderId: existingOrderId as string,
      purchaserId,
      amount: amountCents / 100, // 转换为元
      currency: currency.toUpperCase(), // 转换为大写
      metadata: {
        invoiceId: invoice.id,
        subscriptionId,
      },
    });
    // 订阅续费时保持 Pro 状态（使用上面已定义的 planId）
    await markUserAsPro(purchaserId, planId);
    
    // V2: 更新 subscriptions 表状态为 active
    try {
      // 获取订阅详情以更新 current_period_end
      let currentPeriodEnd: string | null = null;
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription && typeof subscription === 'object' && 'current_period_end' in subscription && subscription.current_period_end) {
          currentPeriodEnd = new Date((subscription.current_period_end as number) * 1000).toISOString();
        }
      } catch (error) {
        console.warn("stripe-webhook:v2-subscription-retrieve-error", { subscriptionId, error });
      }

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      }
    } catch (error) {
      console.error("stripe-webhook:v2-subscription-renewal-update-error", { subscriptionId, error });
    }
    return;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("inviter_id")
    .eq("user_id", purchaserId)
    .maybeSingle();

  const referrerId = mergedMetadata.referrerId ?? profile?.inviter_id ?? null;

  // V2: 使用新的 orders 表字段结构
  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      user_id: purchaserId,
      stripe_checkout_session_id: null, // 续费没有 checkout session
      stripe_payment_intent_id: paymentIntentId,
      amount: amountCents, // 金额（分）
      currency: currency,
      kind: kind, // 'sub_month' | 'sub_year'
      report_id: null, // 订阅续费没有 report_id
      status: "paid",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.error("stripe-webhook:invoice-insert-error", error);
    return;
  }

  await distributeAffiliateCommissions(supabase, {
    orderId: inserted.id as string,
    purchaserId,
    amount: amountCents / 100, // 转换为元
    currency: currency.toUpperCase(), // 转换为大写
    metadata: {
      invoiceId: invoice.id,
      subscriptionId,
    },
  });

  // 订阅续费时保持 Pro 状态（使用上面已定义的 planId）
  await markUserAsPro(purchaserId, planId);
  
  // V2: 更新 subscriptions 表状态为 active
  try {
    // 获取订阅详情以更新 current_period_end
      let currentPeriodEnd: string | null = null;
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription && typeof subscription === 'object' && 'current_period_end' in subscription && subscription.current_period_end) {
          currentPeriodEnd = new Date((subscription.current_period_end as number) * 1000).toISOString();
        }
      } catch (error) {
        console.warn("stripe-webhook:v2-subscription-retrieve-error", { subscriptionId, error });
      }

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id);
    } else {
      // 如果 subscriptions 表中不存在，尝试创建（从 subscription metadata 获取 planId）
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subPlanId = (subscription.metadata?.planId ?? mergedMetadata.planId) as "monthly" | "yearly" | undefined;
        const plan = subPlanId === "monthly" ? "sub_month" : subPlanId === "yearly" ? "sub_year" : "sub_month";
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? "";
        
        if (customerId) {
          await supabase.from("subscriptions").insert({
            user_id: purchaserId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: plan as "sub_month" | "sub_year",
            status: "active",
            current_period_end: currentPeriodEnd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("stripe-webhook:v2-subscription-create-error", { subscriptionId, error });
      }
    }
  } catch (error) {
    console.error("stripe-webhook:v2-subscription-renewal-update-error", { subscriptionId, error });
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const supabase = await getSupabase();
  // 使用新的字段名查询订单
  const paymentIntentId = typeof invoice === 'object' && invoice !== null && 'payment_intent' in invoice
    ? typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : (invoice.payment_intent as any)?.id ?? null
    : null;
  
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId ?? "")
    .maybeSingle();

  if (!order?.id) {
    return;
  }

  await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
  await reverseCommissionsForOrder(supabase, { orderId: order.id as string, reason: "payment_failed" });
}

/**
 * 处理 customer.subscription.updated / deleted 事件
 * 简化版：更新 subscriptions.status 与 current_period_end
 * 若不再有任何 active 订阅，则把 user_profiles.is_pro=false, pro_plan='none'
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await getSupabase();
  const subscriptionId = subscription.id;
  const status = subscription.status; // 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' 等

  // 查找对应的订阅记录
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!subData?.user_id) {
    console.warn("stripe-webhook:subscription-not-found", { subscriptionId });
    return;
  }

  const userId = subData.user_id;
  const currentPeriodEnd = subscription && typeof subscription === 'object' && 'current_period_end' in subscription && subscription.current_period_end
    ? new Date((subscription.current_period_end as number) * 1000).toISOString()
    : null;

  // 更新 subscriptions.status 与 current_period_end
  try {
    await supabase
      .from("subscriptions")
      .update({
        status: status,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
        ...(status === "canceled" ? { cancelled_at: new Date().toISOString() } : {}),
      })
      .eq("stripe_subscription_id", subscriptionId);
    console.log("stripe-webhook:subscription-updated", { userId, subscriptionId, status });
  } catch (error) {
    console.error("stripe-webhook:subscription-update-error", { userId, subscriptionId, error });
  }

  // 若不再有任何 active 订阅，则把 user_profiles.is_pro=false, pro_plan='none'
  if (status === "canceled" || status === "past_due" || status === "unpaid") {
    try {
      // 检查用户是否还有其他 active 订阅
      const { data: otherSubscriptions } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("stripe_subscription_id", subscriptionId)
        .limit(1);

      if (!otherSubscriptions || otherSubscriptions.length === 0) {
        // 没有其他有效订阅，取消 Pro 状态
        await supabase
          .from("user_profiles")
          .update({
            is_pro: false,
            pro_plan: "none",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        console.log("stripe-webhook:user-pro-cancelled", { userId });
      }
    } catch (error) {
      console.error("stripe-webhook:user-pro-cancel-error", { userId, error });
    }
  }
}


export async function POST(req: Request) {
  // 运行时检查：如果使用占位值，说明环境变量未配置
  if (webhookSecret === "placeholder-webhook-secret") {
    return new Response("STRIPE_WEBHOOK_SECRET 未配置", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("缺少 Stripe 签名", { status: 400 });
  }

  const buf = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        // 单次/订阅首付成功
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // 订阅状态变更
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        // 订阅续费成功（可选）
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        // 支付失败（可选）
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`stripe-webhook:unhandled-event-type`, { type: event.type });
        break;
    }
  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response("Webhook error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
