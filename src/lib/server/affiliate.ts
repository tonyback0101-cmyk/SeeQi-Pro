import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function sumCommissionAmounts(records: Array<{ amount: number; status: string }>) {
  return records.reduce((total, record) => {
    if (record.status === "reversed") {
      return total;
    }
    return total + Number(record.amount ?? 0);
  }, 0);
}

function aggregateByDate(records: Array<{ created_at: string; status: string; amount: number }>, threshold: Date) {
  return records.reduce(
    (acc, record) => {
      if (record.status === "reversed") {
        return acc;
      }
      if (new Date(record.created_at) >= threshold) {
        acc.count += 1;
        acc.amount += Number(record.amount ?? 0);
      }
      return acc;
    },
    { count: 0, amount: 0 }
  );
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function startOfMonth(date: Date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export async function fetchAffiliateDashboard(userId: string) {
  const supabase = getSupabaseAdminClient();

  const [{ data: profile }, { data: commissionRecords }, directCountResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("wallet_balance, wallet_pending, ref_code, default_currency, payout_method")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("commission_records")
      .select("amount, status, created_at")
      .eq("beneficiary_user_id", userId),
    supabase
      .from("user_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("inviter_id", userId),
  ]);

  const directCount = directCountResult?.count ?? 0;

  let level2Count = 0;
  if (directCount > 0) {
    const { data: directMembers } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("inviter_id", userId);
    const directIds = directMembers?.map((item) => item.user_id) ?? [];
    if (directIds.length) {
      const { count } = await supabase
        .from("user_profiles")
        .select("user_id", { count: "exact", head: true })
        .in("inviter_id", directIds);
      level2Count = count ?? 0;
    }
  }

  const now = new Date();
  const commissions = commissionRecords ?? [];
  const lifetime = sumCommissionAmounts(commissions);
  const dayStats = aggregateByDate(commissions, startOfDay(now));
  const weekStats = aggregateByDate(commissions, startOfWeek(now));
  const monthStats = aggregateByDate(commissions, startOfMonth(now));

  return {
    balance: Number(profile?.wallet_balance ?? 0),
    pending: Number(profile?.wallet_pending ?? 0),
    lifetime,
    currency: profile?.default_currency ?? "USD",
    refCode: profile?.ref_code ?? "",
    payoutMethod: profile?.payout_method ?? {},
    referrals: {
      direct: directCount,
      team: directCount + level2Count,
    },
    performance: {
      day: dayStats,
      week: weekStats,
      month: monthStats,
    },
  };
}

export async function fetchWalletTransactions(userId: string, limit = 10) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, currency, fee_amount, running_balance, reference_type, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 50)));

  return data ?? [];
}

export async function fetchPayoutRequests(userId: string, limit = 20) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("payout_requests")
    .select("id, amount, currency, fee_amount, status, payout_method, submitted_at, processed_at")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 50)));

  return data ?? [];
}
