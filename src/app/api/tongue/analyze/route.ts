import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { executeRules } from "@/lib/rules";
import {
  analyzeTongueImage,
  TongueImageError,
  type TongueColor,
  type TongueCoating,
  type TongueTexture,
} from "@/lib/analysis/tongueFeatures";
import { resolveImageExtension } from "@/lib/palmprints/validation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const STORAGE_BUCKET = process.env.SUPABASE_ANALYSIS_BUCKET ?? "analysis-temp";

function errorResponse(code: TongueImageError["code"] | "BAD_REQUEST", message: string, status = 422) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("tongue_image");

    if (!(file instanceof File)) {
      return errorResponse("BAD_REQUEST", "缺少舌象图片", 400);
    }

    const locale = formData.get("locale")?.toString() === "en" ? "en" : "zh";
    const tz = formData.get("tz")?.toString() ?? "Asia/Shanghai";
    const sessionIdParam = formData.get("session_id")?.toString();
    const sessionId = sessionIdParam && sessionIdParam.length > 0 ? sessionIdParam : randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const analysis = await analyzeTongueImage(buffer, {
      mimeType: file.type,
      fileSize: file.size,
    });

    const { result: ruleResult } = await executeRules({
      locale,
      tongue: {
        color: analysis.color,
        coating: analysis.coating,
        texture: analysis.texture,
      },
    });

    const client = getSupabaseAdminClient();

    if (!sessionIdParam) {
      const { error: insertSessionError } = await client.from("sessions").insert({
        id: sessionId,
        locale,
        tz,
      });
      if (insertSessionError && insertSessionError.code !== "23505") {
        console.error("[POST /api/tongue/analyze] insert session error", insertSessionError);
        return errorResponse("BAD_REQUEST", "会话创建失败", 500);
      }
    } else {
      const { data: existingSession, error: fetchSessionError } = await client
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle();

      if (fetchSessionError) {
        console.error("[POST /api/tongue/analyze] fetch session error", fetchSessionError);
        return errorResponse("BAD_REQUEST", "会话查询失败", 500);
      }

      if (!existingSession) {
        const { error: createMissingSessionError } = await client.from("sessions").insert({
          id: sessionId,
          locale,
          tz,
        });
        if (createMissingSessionError) {
          console.error("[POST /api/tongue/analyze] create missing session error", createMissingSessionError);
          return errorResponse("BAD_REQUEST", "会话创建失败", 500);
        }
      }
    }

    const uploadId = randomUUID();
    const extension = resolveImageExtension(file.type);
    const storagePath = `tongue/${sessionId}/${uploadId}.${extension}`;

    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "180",
    });

    if (uploadError) {
      console.error("[POST /api/tongue/analyze] storage upload error", uploadError);
      return errorResponse("BAD_REQUEST", "舌象图片暂存失败", 500);
    }

    const { error: insertUploadError } = await client.from("uploads").insert({
      id: uploadId,
      session_id: sessionId,
      type: "tongue",
      storage_path: `${STORAGE_BUCKET}/${storagePath}`,
      mime_type: file.type,
      quality_score: analysis.qualityScore,
      features: {
        color: analysis.color,
        coating: analysis.coating,
        texture: analysis.texture,
      },
    });

    if (insertUploadError) {
      console.error("[POST /api/tongue/analyze] insert upload error", insertUploadError);
      return errorResponse("BAD_REQUEST", "舌象特征写入失败", 500);
    }

    return NextResponse.json(
      {
        success: true,
        session_id: sessionId,
        upload_id: uploadId,
        color: analysis.color satisfies TongueColor,
        coating: analysis.coating satisfies TongueCoating,
        texture: analysis.texture satisfies TongueTexture,
        quality_score: analysis.qualityScore,
        constitution: ruleResult.constitution ?? "平和",
        advice: ruleResult.advice ?? {},
        dream: ruleResult.dream ?? undefined,
        quote: ruleResult.quote ?? undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TongueImageError) {
      const status = error.code === "INVALID_IMAGE" ? 400 : 422;
      return errorResponse(error.code, error.message, status);
    }

    console.error("[POST /api/tongue/analyze]", error);
    return errorResponse("BAD_REQUEST", "服务器处理舌象图片时出错", 500);
  }
}

