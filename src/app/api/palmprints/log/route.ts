import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { canUseInDatabase } from "@/lib/auth/testAccount";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 检查是否是测试账号，如果是则跳过数据库操作
  if (!canUseInDatabase(session.user.id)) {
    console.log("[POST /api/palmprints/log] Test account detected, skipping log:", session.user.id);
    return NextResponse.json({ success: true, skipped: "test_account" });
  }

  const payload = await request.json();
  const action = payload?.action;
  if (!["upload", "offline_queue", "sync_success", "sync_failure"].includes(action)) {
    return NextResponse.json({ error: "无效的日志类型" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("palm_upload_logs").insert({
    user_id: session.user.id,
    palmprint_id: payload?.palmprintId ?? null,
    action,
    details: payload?.details ?? {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
