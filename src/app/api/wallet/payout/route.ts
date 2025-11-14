import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_WITHDRAWAL = 20;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const body = await request.json().catch(() => null);

  if (!body || typeof body?.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "提现金额无效" }, { status: 400 });
  }

  const amount = Math.round(body.amount * 100) / 100;
  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json({ error: `最低提现金额为 $${MIN_WITHDRAWAL}` }, { status: 400 });
  }

  const method = typeof body?.method === "string" ? body.method : "unknown";
  const details = (body?.details as Record<string, unknown>) ?? {};

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("wallet_balance, wallet_pending")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const balance = Number(profile?.wallet_balance ?? 0);
  if (balance < amount) {
    return NextResponse.json({ error: "余额不足" }, { status: 400 });
  }

  const { data: payout, error: payoutError } = await supabase
    .from("payout_requests")
    .insert({
      user_id: session.user.id,
      amount,
      currency: "USD",
      fee_amount: Math.round(amount * 0.029 * 100) / 100,
      payout_method: method,
      payout_details: details,
    })
    .select("id")
    .single();

  if (payoutError || !payout?.id) {
    return NextResponse.json({ error: payoutError?.message ?? "提现申请创建失败" }, { status: 500 });
  }

  const { error: balanceError } = await supabase.rpc("fn_increment_wallet_balance", {
    p_user_id: session.user.id,
    p_delta: -amount,
  });

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 });
  }

  await supabase.rpc("fn_adjust_wallet_pending", {
    p_user_id: session.user.id,
    p_delta: amount,
  });

  await supabase
    .from("wallet_transactions")
    .insert({
      user_id: session.user.id,
      type: "payout_request",
      amount: -amount,
      currency: "USD",
      fee_amount: 0,
      running_balance: balance - amount,
      reference_id: payout.id,
      reference_type: "payout",
      metadata: { method },
    });

  return NextResponse.json({ success: true, payoutId: payout.id });
}
