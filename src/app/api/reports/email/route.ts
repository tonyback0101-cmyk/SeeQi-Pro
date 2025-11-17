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

  // 检查是否是测试账号，如果是则返回错误
  if (!canUseInDatabase(session.user.id)) {
    console.log("[POST /api/reports/email] Test account detected, cannot send email:", session.user.id);
    return NextResponse.json(
      { error: "测试账号不支持此功能，请使用真实账号登录" },
      { status: 403 }
    );
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email: string | undefined = payload?.email;
  const shareLink: string | undefined = payload?.shareLink;
  const locale: string = payload?.locale === "en" ? "en" : "zh";
  const reportId: string = payload?.reportId ?? "unknown";
  const summary = payload?.summary ?? {};

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "缺少邮箱地址" }, { status: 400 });
  }
  if (!shareLink || typeof shareLink !== "string") {
    return NextResponse.json({ error: "缺少分享链接" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("report_email_queue").insert({
    user_id: session.user.id,
    email_to: email,
    locale,
    report_id: reportId,
    share_link: shareLink,
    summary,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}






