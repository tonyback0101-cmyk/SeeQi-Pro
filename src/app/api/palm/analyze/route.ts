import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { analyzePalmImage, PalmImageError, type PalmColor, type PalmTexture } from "@/lib/analysis/palmFeatures";
import { executeRules } from "@/lib/rules";
import { resolveImageExtension } from "@/lib/palmprints/validation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureSession, verifyOrCreateSession } from "@/lib/supabase/sessionUtils";

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

    let client;
    try {
      client = getSupabaseAdminClient();
    } catch (supabaseError) {
      console.error("[POST /api/palm/analyze] Supabase client unavailable", supabaseError);
      return errorResponse("BAD_REQUEST", "数据库连接失败", 500);
    }

    // 确保 session 存在
    try {
      await ensureSession(client, sessionId, locale, tz);
    } catch (sessionError) {
      console.error("[POST /api/palm/analyze] ensureSession failed:", sessionError);
      return errorResponse("BAD_REQUEST", "会话创建失败", 500);
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

    // 在插入 uploads 之前，再次验证 session 存在
    try {
      await verifyOrCreateSession(client, sessionId, locale, tz);
    } catch (verifyError) {
      console.error("[POST /api/palm/analyze] verifyOrCreateSession failed:", verifyError);
      return errorResponse("BAD_REQUEST", "会话验证失败", 500);
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
      console.error("[POST /api/palm/analyze] insert upload error:", {
        code: insertUploadError.code,
        message: insertUploadError.message,
        details: insertUploadError.details,
        hint: insertUploadError.hint,
      });
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

