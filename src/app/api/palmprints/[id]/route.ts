import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PALM_BUCKET = "palmprints";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: "无权删除该掌纹记录" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("palm_prints")
    .delete()
    .eq("id", palmprintId)
    .eq("user_id", session.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const storageRemoval = await supabase.storage.from(PALM_BUCKET).remove([record.image_path]);
  const storageError = storageRemoval.error?.message;

  return NextResponse.json({
    success: true,
    storageRemoved: !storageError,
    storageError,
  });
}


