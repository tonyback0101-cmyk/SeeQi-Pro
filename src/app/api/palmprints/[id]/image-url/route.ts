import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PALM_BUCKET = "palmprints";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const palmprintId = params.id;
  if (!palmprintId) {
    return NextResponse.json({ error: "缺少掌纹记录 ID" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: record, error: fetchError } = await supabase
    .from("palm_prints")
    .select("id, user_id, image_path")
    .eq("id", palmprintId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!record) {
    return NextResponse.json({ error: "掌纹记录不存在" }, { status: 404 });
  }

  if (record.user_id !== session.user.id) {
    return NextResponse.json({ error: "无权访问该掌纹记录" }, { status: 403 });
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(PALM_BUCKET)
    .createSignedUrl(record.image_path, 60 * 10, { download: false });

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: signedError?.message ?? "获取图片地址失败" }, { status: 500 });
  }

  return NextResponse.json({ url: signedData.signedUrl });
}


