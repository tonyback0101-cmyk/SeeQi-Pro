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
import { ensureSession, verifyOrCreateSession } from "@/lib/supabase/sessionUtils";

export const runtime = "nodejs";

// 确保存储桶名称正确，如果环境变量设置错误则使用默认值
const getStorageBucket = () => {
  const envValue = process.env.SUPABASE_ANALYSIS_BUCKET;
  
  // 如果环境变量无效，使用默认值
  if (!envValue || 
      envValue.trim() === "" || 
      envValue === "analysis" || 
      envValue === "SUPABASE_ANALYSIS_BUCKET" || 
      envValue.toLowerCase() === "analysis") {
    const defaultBucket = "analysis-temp";
    if (envValue && envValue !== defaultBucket) {
      console.warn(`[Storage Bucket Config] Invalid bucket name '${envValue}', using default '${defaultBucket}'`);
    }
    return defaultBucket;
  }
  
  return envValue.trim();
};

const STORAGE_BUCKET = getStorageBucket();

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

    let client;
    try {
      client = getSupabaseAdminClient();
    } catch (supabaseError) {
      console.error("[POST /api/tongue/analyze] Supabase client unavailable", supabaseError);
      return errorResponse("BAD_REQUEST", "数据库连接失败", 500);
    }

    // 确保 session 存在
    try {
      await ensureSession(client, sessionId, locale, tz);
    } catch (sessionError) {
      console.error("[POST /api/tongue/analyze] ensureSession failed:", sessionError);
      return errorResponse("BAD_REQUEST", "会话创建失败", 500);
    }

    const uploadId = randomUUID();
    const { ext: extension } = resolveImageExtension({ type: file.type, name: file.name });
    const storagePath = `tongue/${sessionId}/${uploadId}.${extension}`;

    // 验证存储桶是否存在
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      console.warn(`[POST /api/tongue/analyze] Failed to list buckets: ${listError.message}`);
    } else {
      // 记录当前使用的存储桶名称和环境变量值
      console.log(`[POST /api/tongue/analyze] Using storage bucket: '${STORAGE_BUCKET}' (env: '${process.env.SUPABASE_ANALYSIS_BUCKET || "not set"}')`);
      
      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
      if (!bucketExists) {
        const availableBuckets = buckets?.map(b => b.name).join(", ") || "无";
        console.error(`[POST /api/tongue/analyze] Bucket '${STORAGE_BUCKET}' not found. Available: ${availableBuckets}`);
        console.error(`[POST /api/tongue/analyze] Environment variable SUPABASE_ANALYSIS_BUCKET: '${process.env.SUPABASE_ANALYSIS_BUCKET || "not set"}'`);
        return errorResponse("BAD_REQUEST", `存储桶 '${STORAGE_BUCKET}' 不存在。可用存储桶: ${availableBuckets}`, 500);
      }
    }

    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "180",
    });

    if (uploadError) {
      console.error("[POST /api/tongue/analyze] storage upload error", {
        bucket: STORAGE_BUCKET,
        path: storagePath,
        error: uploadError.message,
        statusCode: (uploadError as any).statusCode,
      });
      return errorResponse("BAD_REQUEST", `舌象图片暂存失败: ${uploadError.message}`, 500);
    }

    // 在插入 uploads 之前，再次验证 session 存在
    try {
      await verifyOrCreateSession(client, sessionId, locale, tz);
    } catch (verifyError) {
      console.error("[POST /api/tongue/analyze] verifyOrCreateSession failed:", verifyError);
      return errorResponse("BAD_REQUEST", "会话验证失败", 500);
    }

    // 最终验证：确保 session 真的存在
    const { data: sessionVerify, error: sessionVerifyError } = await client
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();
    
    if (sessionVerifyError) {
      console.error("[POST /api/tongue/analyze] Session verification error:", sessionVerifyError);
      return errorResponse("BAD_REQUEST", `无法验证 session: ${sessionVerifyError.message}`, 500);
    }
    
    if (!sessionVerify) {
      console.error("[POST /api/tongue/analyze] Session does not exist after verifyOrCreateSession:", sessionId);
      return errorResponse("BAD_REQUEST", `Session ${sessionId} 不存在，无法上传图片`, 500);
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
      console.error("[POST /api/tongue/analyze] insert upload error:", {
        code: insertUploadError.code,
        message: insertUploadError.message,
        details: insertUploadError.details,
        hint: insertUploadError.hint,
      });
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

