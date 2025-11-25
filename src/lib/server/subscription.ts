import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type SubscriptionStatus = {
  active: boolean;
  productId: string | null;
  productType: string | null;
  currency: string | null;
  amount: number | null;
  updatedAt: string | null;
};

export interface UserProStatus {
  isPro: boolean;
  planId?: "single" | "monthly" | "yearly";
}

export async function getLatestSubscriptionStatus(userId: string | undefined | null): Promise<SubscriptionStatus> {
  if (!userId) {
    return {
      active: false,
      productId: null,
      productType: null,
      currency: null,
      amount: null,
      updatedAt: null,
    };
  }
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("product_id, product_type, status, amount, currency, updated_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return {
        active: false,
        productId: null,
        productType: null,
        currency: null,
        amount: null,
        updatedAt: null,
      };
    }

    const isActive = data.status === "paid" || data.status === "succeeded";

    return {
      active: isActive,
      productId: data.product_id ?? null,
      productType: data.product_type ?? null,
      currency: data.currency ?? null,
      amount: typeof data.amount === "number" ? data.amount : Number(data.amount ?? 0),
      updatedAt: data.updated_at ?? data.created_at ?? null,
    };
  } catch (error) {
    console.error("getLatestSubscriptionStatus error", error);
    return {
      active: false,
      productId: null,
      productType: null,
      currency: null,
      amount: null,
      updatedAt: null,
    };
  }
}

/**
 * 获取用户 Pro 状态（V2 统一使用）
 * 从 user_profiles 表读取 is_pro 和 pro_plan 字段
 * pro_plan 值为 'none' | 'sub_month' | 'sub_year'
 * 返回的 planId 映射为 'monthly' | 'yearly'（兼容旧代码）
 */
export async function getCurrentUserPlan(userId: string | undefined | null): Promise<UserProStatus> {
  if (!userId) {
    return {
      isPro: false,
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("is_pro, pro_plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      return {
        isPro: false,
      };
    }

    const isPro = Boolean(data.is_pro);
    const proPlan = data.pro_plan as "none" | "sub_month" | "sub_year" | null | undefined;

    // 映射 pro_plan 到 planId（兼容旧代码）
    let planId: "monthly" | "yearly" | undefined;
    if (proPlan === "sub_month") {
      planId = "monthly";
    } else if (proPlan === "sub_year") {
      planId = "yearly";
    }
    // pro_plan = 'none' 或 null 时，planId 为 undefined

    return {
      isPro,
      planId,
    };
  } catch (error) {
    console.error("getCurrentUserPlan error", error);
    return {
      isPro: false,
    };
  }
}
