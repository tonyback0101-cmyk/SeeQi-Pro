import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set(["paypal", "stripe_connect", "bank"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.method !== "string") {
    return NextResponse.json({ error: "缺少到账方式" }, { status: 400 });
  }

  const method = payload.method.toLowerCase();
  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "不支持的到账方式" }, { status: 400 });
  }

  const details = payload.details;
  if (!details || typeof details !== "object") {
    return NextResponse.json({ error: "到账信息无效" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("payout_method")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const existing = (profile?.payout_method as Record<string, unknown>) ?? {};
  const nextPayoutMethod = {
    ...existing,
    [method]: {
      ...details,
      updated_at: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ payout_method: nextPayoutMethod })
    .eq("user_id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payoutMethod: nextPayoutMethod }, { status: 200 });
}






