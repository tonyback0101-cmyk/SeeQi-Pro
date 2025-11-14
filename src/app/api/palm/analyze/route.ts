import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { analyzePalmImage, PalmImageError, type PalmColor, type PalmTexture } from "@/lib/analysis/palmFeatures";
import { executeRules } from "@/lib/rules";
import { resolveImageExtension } from "@/lib/palmprints/validation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const STORAGE_BUCKET = process.env.SUPABASE_ANALYSIS_BUCKET ?? "analysis-temp";

function errorResponse(code: PalmImageError["code"] | "BAD_REQUEST", message: string, status = 422) {
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
    const file = formData.get("palm_image");
    if (!(file instanceof File)) {
      return errorResponse("BAD_REQUEST", "缺少手掌图片", 400);
    }

    const locale = formData.get("locale")?.toString() === "en" ? "en" : "zh";
    const tz = formData.get("tz")?.toString() ?? "Asia/Shanghai";
    const sessionIdParam = formData.get("session_id")?.toString();
    const sessionId = sessionIdParam && sessionIdParam.length > 0 ? sessionIdParam : randomUUID();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const analysis = await analyzePalmImage(buffer, {
      mimeType: file.type,
      fileSize: file.size,
    });

    const { result: ruleResult } = await executeRules({
      locale,
      palm: {
        color: analysis.color,
        texture: analysis.texture,
        lines: analysis.lines,
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
        console.error("[POST /api/palm/analyze] insert session error", insertSessionError);
        return errorResponse("BAD_REQUEST", "会话创建失败", 500);
      }
    } else {
      const { data: existingSession, error: fetchSessionError } = await client
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle();
      if (fetchSessionError) {
        console.error("[POST /api/palm/analyze] fetch session error", fetchSessionError);
        return errorResponse("BAD_REQUEST", "会话查询失败", 500);
      }
      if (!existingSession) {
        const { error: insertMissingSessionError } = await client.from("sessions").insert({
          id: sessionId,
          locale,
          tz,
        });
        if (insertMissingSessionError) {
          console.error("[POST /api/palm/analyze] insert missing session error", insertMissingSessionError);
          return errorResponse("BAD_REQUEST", "会话创建失败", 500);
        }
      }
    }

    const uploadId = randomUUID();
    const { ext: extension } = resolveImageExtension({ type: file.type, name: file.name });
    const storagePath = `palm/${sessionId}/${uploadId}.${extension}`;

    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "180",
    });
    if (uploadError) {
      console.error("[POST /api/palm/analyze] storage error", uploadError);
      return errorResponse("BAD_REQUEST", "手掌图片暂存失败", 500);
    }

    const { error: insertUploadError } = await client.from("uploads").insert({
      id: uploadId,
      session_id: sessionId,
      type: "palm",
      storage_path: `${STORAGE_BUCKET}/${storagePath}`,
      mime_type: file.type,
      quality_score: analysis.qualityScore,
      features: {
        color: analysis.color,
        texture: analysis.texture,
        lines: analysis.lines,
      },
    });
    if (insertUploadError) {
      console.error("[POST /api/palm/analyze] insert upload error", insertUploadError);
      return errorResponse("BAD_REQUEST", "手掌特征写入失败", 500);
    }

    return NextResponse.json(
      {
        success: true,
        session_id: sessionId,
        upload_id: uploadId,
        color: analysis.color satisfies PalmColor,
        texture: analysis.texture satisfies PalmTexture,
        lines: analysis.lines,
        quality_score: analysis.qualityScore,
        constitution: ruleResult.constitution ?? "平和",
        advice: ruleResult.advice ?? {},
        dream: ruleResult.dream ?? undefined,
        quote: ruleResult.quote ?? undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof PalmImageError) {
      const status = error.code === "INVALID_IMAGE" ? 400 : 422;
      return errorResponse(error.code, error.message, status);
    }

    console.error("[POST /api/palm/analyze]", error);
    return errorResponse("BAD_REQUEST", "服务器处理手掌图片时出错", 500);
  }
}

