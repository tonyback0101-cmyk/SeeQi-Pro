import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { logPalmEvent } from "@/lib/palmprints/logging";
import {
  ensureString,
  MAX_FILE_SIZE,
  PALM_BUCKET,
  parseHandType,
  parsePalmRegion,
  parseQualityRatingEntry,
  resolveImageExtension,
} from "@/lib/palmprints/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "请求数据无效" }, { status: 400 });
  }

  const imageEntry = formData.get("image");
  if (!(imageEntry instanceof File)) {
    return NextResponse.json({ error: "缺少掌纹图片文件" }, { status: 400 });
  }

  if (imageEntry.size <= 0 || imageEntry.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "图片文件大小超出限制（最大10MB）" }, { status: 400 });
  }

  const handType = parseHandType(formData.get("handType"));
  if (!handType) {
    return NextResponse.json({ error: "手掌类型 handType 无效" }, { status: 400 });
  }

  const palmRegion = parsePalmRegion(formData.get("palmRegion"));
  if (!palmRegion) {
    return NextResponse.json({ error: "掌纹区域 palmRegion 无效" }, { status: 400 });
  }

  const captureMethod = ensureString(formData.get("captureMethod")) ?? "camera";
  const qualityRating = parseQualityRatingEntry(formData.get("qualityRating"));

  const { ext, mime } = resolveImageExtension(imageEntry);
  const fileBuffer = Buffer.from(await imageEntry.arrayBuffer());
  const supabase = getSupabaseAdminClient();

  const objectPath = `${session.user.id}/${Date.now()}-${randomUUID()}.${ext}`;

  const uploadResult = await supabase.storage
    .from(PALM_BUCKET)
    .upload(objectPath, fileBuffer, {
      upsert: false,
      contentType: mime,
      cacheControl: "3600",
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: `图片上传失败: ${uploadResult.error.message}` }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("palm_prints")
    .insert({
      user_id: session.user.id,
      image_path: objectPath,
      hand_type: handType,
      palm_region: palmRegion,
      quality_rating: qualityRating,
      metadata: {
        captureMethod,
        sourceName: imageEntry.name ?? null,
        contentType: mime,
        size: imageEntry.size,
      },
    })
    .select("id, image_path, created_at, updated_at")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(PALM_BUCKET).remove([objectPath]);
    return NextResponse.json({ error: insertError?.message ?? "掌纹记录保存失败" }, { status: 500 });
  }

  await logPalmEvent({
    action: "upload",
    palmprintId: inserted.id,
    details: { handType, palmRegion, captureMethod, size: imageEntry.size },
  });

  return NextResponse.json({
    success: true,
    palmprintId: inserted.id,
    imagePath: inserted.image_path,
    captureMethod,
    createdAt: inserted.created_at,
  });
}


