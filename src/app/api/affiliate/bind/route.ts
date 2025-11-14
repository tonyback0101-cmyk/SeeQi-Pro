import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const REF_COOKIE = "seeqi_ref";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const refFromBody = typeof body?.ref === "string" ? body.ref.trim() : "";
  const refFromCookie = cookies().get(REF_COOKIE)?.value?.trim() ?? "";
  const refCode = refFromBody || refFromCookie;

  if (!refCode) {
    return NextResponse.json({ success: true, message: "无邀请码" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("inviter_id, ref_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "用户档案不存在" }, { status: 404 });
  }

  if (profile.inviter_id) {
    return NextResponse.json({ success: true, message: "已绑定推荐人" });
  }

  const { data: inviterProfile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("ref_code", refCode)
    .maybeSingle();

  if (!inviterProfile?.user_id || inviterProfile.user_id === userId) {
    return NextResponse.json({ success: false, message: "推荐码无效" }, { status: 200 });
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ inviter_id: inviterProfile.user_id })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inviterId: inviterProfile.user_id });
}
