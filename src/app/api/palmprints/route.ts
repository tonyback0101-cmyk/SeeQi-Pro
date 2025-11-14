import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("palm_prints")
    .select(
      `
        id,
        image_path,
        hand_type,
        palm_region,
        quality_rating,
        metadata,
        created_at,
        updated_at,
        palm_features (
          id,
          feature_type,
          position_x,
          position_y,
          description,
          metadata,
          created_at
        )
      `
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items:
      data?.map((item) => ({
        id: item.id,
        imagePath: item.image_path,
        handType: item.hand_type,
        palmRegion: item.palm_region,
        qualityRating: item.quality_rating,
        metadata: item.metadata ?? {},
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        features:
          item.palm_features?.map((feature) => ({
            id: feature.id,
            type: feature.feature_type,
            position: { x: Number(feature.position_x), y: Number(feature.position_y) },
            description: feature.description ?? undefined,
            metadata: feature.metadata ?? {},
            createdAt: feature.created_at,
          })) ?? [],
      })) ?? [],
  });
}


