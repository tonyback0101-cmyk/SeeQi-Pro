import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10);

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, currency, fee_amount, running_balance, reference_type, created_at, metadata")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(Number.isNaN(limit) ? 10 : Math.max(1, Math.min(limit, 50)));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}
