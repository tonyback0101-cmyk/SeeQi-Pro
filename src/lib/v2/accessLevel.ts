/**
 * V2 访问级别计算
 * 用于判断用户对报告的访问权限
 */

import type { UserProStatus } from "@/lib/server/subscription";

export type AccessLevel = 
  | "guest_free"      // 未登录
  | "user_free"       // 已登录但既没有当前 report 的单次权限，也没有有效订阅
  | "single_paid"     // 已登录 + 当前 report 单次已解锁
  | "sub_month"       // 已登录 + 有有效月订阅
  | "sub_year";       // 已登录 + 有有效年订阅

/**
 * 检查用户是否有单次报告访问权限
 * 使用 v2Access 模块的实现
 */
export async function hasSingleReportAccess(
  userId: string | null,
  reportId: string
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { hasSingleReportAccess: checkAccess } = await import("@/lib/access/v2Access");
  return checkAccess(userId, reportId);
}

/**
 * 计算用户的访问级别
 * 优先级：年订阅 > 月订阅 > 单次购买 > 免费用户
 */
export async function calculateAccessLevel(
  isLoggedIn: boolean,
  userId: string | null,
  reportId: string,
  proStatus: UserProStatus
): Promise<AccessLevel> {
  // 未登录
  if (!isLoggedIn || !userId) {
    return "guest_free";
  }

  try {
    // 1. 检查订阅状态（使用 v2Access 模块）
    const { hasActiveSubscription } = await import("@/lib/access/v2Access");
    const subscriptionStatus = await hasActiveSubscription(userId);
    
    // 映射 plan 值：'sub_month' → 'monthly', 'sub_year' → 'yearly'
    let planId: "monthly" | "yearly" | undefined;
    if (subscriptionStatus.hasSubscription && subscriptionStatus.plan) {
      planId = subscriptionStatus.plan === "sub_year" ? "yearly" : "monthly";
    } else {
      // 如果没有从 subscriptions 表查到有效订阅，使用 user_profiles 的 pro_plan（兼容）
      if (proStatus.planId) {
        // 兼容旧数据：如果 pro_plan 是 'monthly'/'yearly'，直接使用
        if (proStatus.planId === "monthly" || proStatus.planId === "yearly") {
          planId = proStatus.planId;
        }
      } else {
        // 从 user_profiles 读取 pro_plan（新格式：'sub_month' | 'sub_year'）
        const { getSupabaseAdminClient } = await import("@/lib/supabaseAdmin");
        const supabase = getSupabaseAdminClient();
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("pro_plan")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (profile?.pro_plan === "sub_year") {
          planId = "yearly";
        } else if (profile?.pro_plan === "sub_month") {
          planId = "monthly";
        }
      }
    }

    if (planId === "yearly" && proStatus.isPro) {
      return "sub_year";
    }
    if (planId === "monthly" && proStatus.isPro) {
      return "sub_month";
    }

    // 2. 检查单次购买
    const hasSingleAccess = await hasSingleReportAccess(userId, reportId);
    if (hasSingleAccess) {
      return "single_paid";
    }

    // 3. 已登录但没有付费权限
    return "user_free";
  } catch (error) {
    console.error("[calculateAccessLevel] Error:", error);
    // 出错时降级处理：只检查 proStatus
    if (proStatus.isPro) {
      if (proStatus.planId === "yearly") return "sub_year";
      if (proStatus.planId === "monthly") return "sub_month";
    }
    return "user_free";
  }
}

/**
 * 判断访问级别是否可以查看完整内容
 */
export function canViewFullContent(accessLevel: AccessLevel): boolean {
  return accessLevel === "single_paid" || accessLevel === "sub_month" || accessLevel === "sub_year";
}

