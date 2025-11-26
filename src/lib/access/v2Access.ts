/**
 * V2 访问控制实现
 * 正式替换之前的 stub
 */

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * 检查用户是否有单次报告访问权限
 * 优先查询 report_access 表（webhook 写入），其次查询 orders 表
 */
export async function hasSingleReportAccess(
  userId: string,
  reportId: string
): Promise<boolean> {
  if (!userId || !reportId) {
    return false;
  }

  try {
    const supabase = getSupabaseAdminClient();
    
    // 优先检查 report_access 表（webhook 写入的权限记录）
    const { data: accessData, error: accessError } = await supabase
      .from("report_access")
      .select("id")
      .eq("user_id", userId)
      .eq("report_id", reportId)
      .eq("tier", "full")
      .maybeSingle();

    if (!accessError && accessData) {
      console.log("[access] Found report_access record", { userId, reportId, accessId: accessData.id });
      return true;
    }

    if (accessError) {
      console.warn("[access] report_access query error", accessError);
    }

    // 如果没有 report_access 记录，检查 orders 表
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, status, kind, report_id")
      .eq("user_id", userId)
      .eq("kind", "single")
      .eq("status", "paid")
      .eq("report_id", reportId)
      .maybeSingle();

    if (orderError) {
      console.error("[access] hasSingleReportAccess error", orderError);
      return false;
    }

    if (orderData) {
      console.log("[access] Found paid order", { userId, reportId, orderId: orderData.id });
      return true;
    }

    // 调试：检查是否有其他状态的订单
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, status, kind, report_id, user_id")
      .eq("user_id", userId)
      .eq("report_id", reportId)
      .limit(5);
    
    if (allOrders && allOrders.length > 0) {
      console.log("[access] Found orders but not paid", { userId, reportId, orders: allOrders });
    }

    return false;
  } catch (error) {
    console.error("[access] hasSingleReportAccess exception", error);
    return false;
  }
}

/**
 * 获取用户的有效订阅
 * 查询 subscriptions 表：status='active' 且 current_period_end >= now
 */
export async function getActiveSubscription(userId: string): Promise<{
  plan: "sub_month" | "sub_year";
  status: string;
  current_period_end: string;
} | null> {
  if (!userId) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", now)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[access] getActiveSubscription error", error);
      return null;
    }

    if (!data) {
      return null;
    }

    // 验证 plan 值
    if (data.plan !== "sub_month" && data.plan !== "sub_year") {
      return null;
    }

    return {
      plan: data.plan,
      status: data.status,
      current_period_end: data.current_period_end || "",
    };
  } catch (error) {
    console.error("[access] getActiveSubscription exception", error);
    return null;
  }
}

/**
 * 检查用户是否有有效订阅
 * 基于 getActiveSubscription 实现
 */
export async function hasActiveSubscription(userId: string): Promise<{
  hasSubscription: boolean;
  plan: "sub_month" | "sub_year" | null;
}> {
  const subscription = await getActiveSubscription(userId);
  
  if (!subscription) {
    return { hasSubscription: false, plan: null };
  }

  return {
    hasSubscription: true,
    plan: subscription.plan,
  };
}

/**
 * V2 访问控制上下文
 */
export interface V2AccessContext {
  userId: string | null;
  reportId: string;
}

/**
 * V2 访问控制结果
 */
export interface V2AccessResult {
  level: "guest_free" | "user_free" | "single_paid" | "sub_month" | "sub_year";
  isFree: boolean;
  hasFullAccess: boolean;
}

/**
 * 计算 V2 访问级别
 * 正式替换之前的 stub
 * 优先级：年订阅 > 月订阅 > 单次购买 > 免费用户
 */
export async function computeV2Access(
  ctx: V2AccessContext
): Promise<V2AccessResult> {
  const { userId, reportId } = ctx;

  if (!userId) {
    return { level: "guest_free", isFree: true, hasFullAccess: false };
  }

  // 并行查询单次购买和订阅状态
  const [single, sub] = await Promise.all([
    hasSingleReportAccess(userId, reportId),
    getActiveSubscription(userId),
  ]);

  // 检查订阅（优先级最高）
  if (sub && sub.status === "active" && sub.current_period_end > new Date().toISOString()) {
    if (sub.plan === "sub_year") {
      return { level: "sub_year", isFree: false, hasFullAccess: true };
    }
    if (sub.plan === "sub_month") {
      return { level: "sub_month", isFree: false, hasFullAccess: true };
    }
  }

  // 检查单次购买
  if (single) {
    return { level: "single_paid", isFree: false, hasFullAccess: true };
  }

  // 已登录但没有付费权限
  return { level: "user_free", isFree: true, hasFullAccess: false };
}

