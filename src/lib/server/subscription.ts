import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type SubscriptionStatus = {
  active: boolean;
  productId: string | null;
  productType: string | null;
  currency: string | null;
  amount: number | null;
  updatedAt: string | null;
};

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
