import type { SupabaseClient } from "@supabase/supabase-js";

const COMMISSION_LEVELS = [
  { level: 1, rate: 0.15 },
  { level: 2, rate: 0.05 },
] as const;

type Database = SupabaseClient<any, "public", any>;

type CommissionContext = {
  orderId: string;
  purchaserId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
};

type UplineInfo = {
  level: number;
  userId: string;
};

async function resolveUplines(client: Database, purchaserId: string): Promise<UplineInfo[]> {
  const uplines: UplineInfo[] = [];
  let currentUserId: string | null = purchaserId;

  for (const config of COMMISSION_LEVELS) {
    if (!currentUserId) {
      break;
    }

    const { data: profile, error } = await client
      .from("user_profiles")
      .select("inviter_id")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error("resolveUplines:error", error);
      break;
    }

    if (profile?.inviter_id) {
      uplines.push({ level: config.level, userId: profile.inviter_id });
      currentUserId = profile.inviter_id;
    } else {
      currentUserId = null;
    }
  }

  return uplines;
}

function calculateCommission(amount: number, rate: number): number {
  const raw = amount * rate;
  return Math.round(raw * 100) / 100;
}

async function insertCommissionRecord(
  client: Database,
  params: {
    orderId: string;
    level: number;
    referrerUserId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { orderId, level, referrerUserId, amount, currency, metadata } = params;

  const { data: commission, error } = await client
    .from("commission_records")
    .insert({
      order_id: orderId,
      referrer_user_id: referrerUserId,
      beneficiary_user_id: referrerUserId,
      level,
      amount,
      currency,
      status: "pending",
      metadata: metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !commission?.id) {
    throw new Error(error?.message ?? "Failed to insert commission record");
  }

  return commission.id as string;
}

async function creditWallet(
  client: Database,
  params: {
    userId: string;
    amount: number;
    currency: string;
    orderId: string;
    commissionId: string;
    level: number;
  }
) {
  const { userId, amount, currency, orderId, commissionId, level } = params;

  const { data: newBalance, error: balanceError } = await client.rpc("fn_increment_wallet_balance", {
    p_user_id: userId,
    p_delta: amount,
  });

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  const runningBalance = Number(newBalance ?? 0);

  const { data: walletTx, error: walletError } = await client
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "commission",
      amount,
      currency,
      fee_amount: 0,
      running_balance: runningBalance,
      reference_id: orderId,
      reference_type: "order",
      metadata: { source: "stripe", level },
    })
    .select("id")
    .single();

  if (walletError || !walletTx?.id) {
    throw new Error(walletError?.message ?? "Failed to create wallet transaction");
  }

  const { error: updateError } = await client
    .from("commission_records")
    .update({ status: "available", wallet_transaction_id: walletTx.id })
    .eq("id", commissionId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function distributeAffiliateCommissions(client: Database, context: CommissionContext) {
  const { orderId, purchaserId, amount, currency, metadata } = context;
  if (amount <= 0) {
    return;
  }

  const uplines = await resolveUplines(client, purchaserId);

  for (const config of COMMISSION_LEVELS) {
    const upline = uplines.find((item) => item.level === config.level);
    if (!upline) {
      continue;
    }

    const commissionAmount = calculateCommission(amount, config.rate);
    if (commissionAmount < 0.01) {
      continue;
    }

    try {
      const commissionId = await insertCommissionRecord(client, {
        orderId,
        level: config.level,
        referrerUserId: upline.userId,
        amount: commissionAmount,
        currency,
        metadata,
      });

      await creditWallet(client, {
        userId: upline.userId,
        amount: commissionAmount,
        currency,
        orderId,
        commissionId,
        level: config.level,
      });
    } catch (error) {
      console.error("distributeAffiliateCommissions:error", {
        level: config.level,
        error,
      });
    }
  }
}

export async function reverseCommissionsForOrder(
  client: Database,
  params: { orderId: string; reason?: string }
) {
  const { orderId, reason } = params;

  const { data: records, error } = await client
    .from("commission_records")
    .select("id, beneficiary_user_id, amount, status, metadata, currency")
    .eq("order_id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  if (!records?.length) {
    return;
  }

  for (const record of records) {
    if (!record || record.status === "reversed") {
      continue;
    }

    const amount = Number(record.amount ?? 0);
    if (amount <= 0) {
      continue;
    }

    const { data: newBalance, error: balanceError } = await client.rpc("fn_increment_wallet_balance", {
      p_user_id: record.beneficiary_user_id,
      p_delta: -amount,
    });

    if (balanceError) {
      console.error("reverseCommissionsForOrder:balance-error", balanceError);
      continue;
    }

    const runningBalance = Number(newBalance ?? 0);

    const { data: walletTx, error: walletError } = await client
      .from("wallet_transactions")
      .insert({
        user_id: record.beneficiary_user_id,
        type: "commission_reversal",
        amount: -amount,
        currency: record.currency ?? "USD",
        fee_amount: 0,
        running_balance,
        reference_id: orderId,
        reference_type: "order",
        metadata: { reason: reason ?? "reversal", original_commission_id: record.id },
      })
      .select("id")
      .single();

    if (walletError) {
      console.error("reverseCommissionsForOrder:wallet-error", walletError);
      continue;
    }

    const mergedMetadata = {
      ...(record.metadata as Record<string, unknown> | null | undefined),
      reversal_transaction_id: walletTx?.id,
      reversal_reason: reason ?? "reversal",
    };

    const { error: updateError } = await client
      .from("commission_records")
      .update({ status: "reversed", metadata: mergedMetadata })
      .eq("id", record.id);

    if (updateError) {
      console.error("reverseCommissionsForOrder:update-error", updateError);
    }
  }
}
