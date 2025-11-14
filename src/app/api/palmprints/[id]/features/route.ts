import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  createPalmprintMetadata,
  FeaturePayload,
  normalizeFeaturePayloads,
  parseQualityRatingValue,
} from "@/lib/palmprints/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const palmprintId = params.id;
  if (!palmprintId) {
    return NextResponse.json({ error: "缺少掌纹记录 ID" }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        features?: FeaturePayload[];
        qualityRating?: unknown;
      }
    | null;

  if (!payload || !Array.isArray(payload.features)) {
    return NextResponse.json({ error: "缺少掌纹特征数据" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("palm_prints")
    .select("id, user_id, metadata")
    .eq("id", palmprintId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "掌纹记录不存在" }, { status: 404 });
  }

  if (existing.user_id !== session.user.id) {
    return NextResponse.json({ error: "无权访问该掌纹记录" }, { status: 403 });
  }

  const normalized = normalizeFeaturePayloads(palmprintId, payload.features);
  if (normalized.error) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const qualityRating = parseQualityRatingValue(payload.qualityRating);

  const { error: deleteError } = await supabase.from("palm_features").delete().eq("palmprint_id", palmprintId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (normalized.data.length > 0) {
    const { error: insertError } = await supabase.from("palm_features").insert(normalized.data);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase
    .from("palm_prints")
    .update({
      quality_rating: qualityRating,
      metadata: createPalmprintMetadata(existing.metadata, {
        featuresCount: normalized.data.length,
        qualityRating,
      }),
    })
    .eq("id", palmprintId)
    .eq("user_id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    featuresCount: normalized.data.length,
    qualityRating,
  });
}


