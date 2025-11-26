import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { analyzeTongueImage, TongueImageError } from "@/lib/analysis/tongueFeatures";
import { analyzePalmImage, PalmImageError } from "@/lib/analysis/palmFeatures";
import { analyzeDreamText } from "@/lib/analysis/dreamFeatures";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { saveReport } from "@/lib/analysis/v2/reportStore";
import {
  interpretPalmWithLLM,
  interpretTongueWithLLM,
  interpretDreamWithLLM,
  interpretConstitutionWithLLM,
} from "@/lib/llm/service";
import { CONSTITUTION_DATA, inferConstitutionV2 } from "@/lib/analysis/constitution";
import { inferQiRhythmV2 } from "@/lib/analysis/qiRulesV2";
import type { QiRhythmV2, QiTag } from "@/lib/analysis/qi/types";
import { generateAdviceV2 } from "@/lib/analysis/advice/adviceEngineV2";
import { inferTongueArchetype, TongueFeatures } from "@/lib/analysis/tongueRulesV2";
import { buildPalmArchetype, buildPalmResultV2, type PalmArchetype, type PalmResultV2 } from "@/lib/analysis/palmRulesV2";
import { interpretPalmWealthWithLLM } from "@/lib/llm/service";
import { buildDreamArchetypeFromText } from "@/lib/analysis/dreamRulesV2";
import { resolveImageExtension } from "@/lib/palmprints/validation";
import { PALM_BUCKET } from "@/lib/palmprints/validation";
import { validatePalmShape, validateTongueShape } from "@/lib/analysis/basicShapeFallback";

type Locale = "zh" | "en";

// 存储桶配置
const PALM_STORAGE_BUCKET = PALM_BUCKET; // "palmprints"
const TONGUE_STORAGE_BUCKET = "tongue"; // 舌苔存储桶

export const runtime = "nodejs";
export const maxDuration = 60;

// V2 必须使用 Supabase，不再检查 ENABLE_SUPABASE_ANALYZE
type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient> | null;

function hasSupabase(client: SupabaseAdminClient): client is Exclude<SupabaseAdminClient, null> {
  // V2 必须使用 Supabase，只要 client 不为 null 就返回 true
  return Boolean(client);
}

function pushWarnings(target: string[], incoming?: string | string[]) {
  if (!incoming) {
    return;
  }
  const items = Array.isArray(incoming) ? incoming : [incoming];
  for (const note of items) {
    if (note && !target.includes(note)) {
      target.push(note);
    }
  }
}

/**
 * 上传图片到 Supabase storage 并获取 publicUrl
 * @param client Supabase 客户端
 * @param file 图片文件
 * @param type 图片类型（"palm" 或 "tongue"）
 * @param reportId 报告 ID
 * @returns publicUrl 或 null（如果上传失败）
 */
async function uploadImageAndGetPublicUrl(
  client: SupabaseAdminClient,
  file: File,
  type: "palm" | "tongue",
  reportId: string,
): Promise<string | null> {
  if (!hasSupabase(client)) {
    console.warn(`[uploadImageAndGetPublicUrl] Supabase not enabled, skipping upload for ${type}`);
    return null;
  }

  try {
    const bucket = type === "palm" ? PALM_STORAGE_BUCKET : TONGUE_STORAGE_BUCKET;
    const imageInfo = resolveImageExtension({ type: file.type, name: file.name });
    const path = `${type}/${reportId}/${randomUUID()}.${imageInfo.ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证存储桶是否存在
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (listError) {
      console.warn(`[uploadImageAndGetPublicUrl] Failed to list buckets: ${listError.message}`);
    } else {
      const bucketExists = buckets?.some((b) => b.name === bucket);
      if (!bucketExists) {
        const availableBuckets = buckets?.map((b) => b.name).join(", ") || "无";
        console.error(
          `[uploadImageAndGetPublicUrl] Bucket '${bucket}' not found. Available: ${availableBuckets}`,
        );
        console.error(
          `[uploadImageAndGetPublicUrl] Please create bucket '${bucket}' in Supabase Dashboard and set it to public.`,
        );
        // 不抛出错误，返回 null 作为 fallback
        return null;
      }

      // 检查 bucket 是否公开
      const bucketInfo = buckets?.find((b) => b.name === bucket);
      if (bucketInfo) {
        if (!bucketInfo.public) {
          console.warn(
            `[uploadImageAndGetPublicUrl] Bucket '${bucket}' is not public. Please make it public in Supabase dashboard for publicUrl to work.`,
          );
          // 继续尝试上传，如果 bucket 不公开，getPublicUrl 可能返回 URL 但无法直接访问
          // 在这种情况下，可以考虑使用 createSignedUrl 作为 fallback（但这里我们使用 publicUrl）
        } else {
          console.log(`[uploadImageAndGetPublicUrl] Bucket '${bucket}' is public ✓`);
        }
      }
    }

    // 上传文件
    const { error: uploadError } = await client.storage.from(bucket).upload(path, buffer, {
      contentType: imageInfo.mime,
      upsert: false,
      cacheControl: "3600",
    });

    if (uploadError) {
      console.error(`[uploadImageAndGetPublicUrl] Upload failed for ${type}:`, {
        bucket,
        path,
        error: uploadError.message,
        statusCode: (uploadError as any).statusCode,
      });
      return null;
    }

    // 获取 publicUrl
    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(path);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl || publicUrl.trim() === "") {
      console.warn(`[uploadImageAndGetPublicUrl] publicUrl is empty for ${type}, path: ${path}`);
      return null;
    }

    console.log(`[uploadImageAndGetPublicUrl] Successfully uploaded ${type} image, publicUrl: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`[uploadImageAndGetPublicUrl] Exception while uploading ${type} image:`, error);
    return null;
  }
}

type AnalyzeErrorCode = "BAD_REQUEST" | "PROCESSING_FAILED" | "ANALYSIS_ERROR";

function errorResponse(message: string, status = 400, code: AnalyzeErrorCode = "ANALYSIS_ERROR") {
  return NextResponse.json(
    {
      ok: false,
      code,
      message,
    },
    { status },
  );
}

// LLM 解读函数在 @/lib/llm/service 中提供规则化实现

// 注意：determineConstitution 函数已迁移到 @/lib/analysis/constitutionV2
// 请使用 inferConstitutionV2 函数替代



export async function POST(request: Request) {
  // 环境变量检查（仅开发环境输出完整信息）
  const isProduction = process.env.NODE_ENV === "production";
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  if (process.env.NODE_ENV === "development") {
    console.log("[V2 Analyze] Environment check", {
      hasOpenAIKey,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || "NOT_SET",
      nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
      nextAuthUrlInternal: process.env.NEXTAUTH_URL_INTERNAL || "NOT_SET",
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "NOT_SET",
    });
  } else {
    // 生产环境：OPENAI_API_KEY 是必需的，缺失时直接返回错误
    if (!hasOpenAIKey) {
      console.error("[ANALYZE_V2][LLM] CRITICAL: OPENAI_API_KEY not configured in production!");
      return errorResponse(
        "LLM服务未配置，无法生成分析报告。请联系管理员。",
        500,
        "PROCESSING_FAILED"
      );
    }
    
    // 生产环境：检查 URL 配置（用于构建 LLM 代理 URL）
    const hasUrlConfig = !!(process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL);
    if (!hasUrlConfig) {
      console.error("[ANALYZE_V2][LLM] CRITICAL: URL configuration missing in production! Need NEXTAUTH_URL_INTERNAL, NEXTAUTH_URL, or NEXT_PUBLIC_APP_URL");
      return errorResponse(
        "服务器配置错误：缺少URL配置。请联系管理员。",
        500,
        "PROCESSING_FAILED"
      );
    }
  }
  
  // 开发环境：允许通过环境变量 USE_MOCK_ANALYSIS='1' 启用mock模式（默认关闭）
  const useMockAnalysis = process.env.USE_MOCK_ANALYSIS === "1" && !isProduction;
  if (useMockAnalysis) {
    console.warn("[ANALYZE_V2] WARNING: USE_MOCK_ANALYSIS is enabled (development only)");
  }
  
  // 生产环境：严禁使用mock模式
  if (isProduction && useMockAnalysis) {
    console.error("[ANALYZE_V2] ERROR: USE_MOCK_ANALYSIS cannot be enabled in production!");
    return errorResponse(
      "配置错误：生产环境不允许使用mock模式",
      500,
      "PROCESSING_FAILED"
    );
  }
  
  try {
    const formData = await request.formData();

    const palmFile = formData.get("palm_image");
    const tongueFile = formData.get("tongue_image");
    const dreamText = formData.get("dream_text")?.toString()?.trim() ?? "";
    const dreamType = formData.get("dream_type")?.toString()?.trim() ?? null;
    const dreamEmotion = formData.get("dream_emotion")?.toString()?.trim() ?? null;
    const dreamTagsRaw = formData.get("dream_tags");
    const locale = formData.get("locale")?.toString() === "en" ? "en" : "zh";
    const tz = formData.get("tz")?.toString() || "Asia/Shanghai";

    // 解析梦境标签
    const dreamTags: string[] = [];
    if (typeof dreamTagsRaw === "string") {
      try {
        const parsed = JSON.parse(dreamTagsRaw);
        if (Array.isArray(parsed)) {
          parsed
            .slice(0, 5)
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag) => tag.length > 0)
            .forEach((tag) => {
              if (!dreamTags.includes(tag)) {
                dreamTags.push(tag);
              }
            });
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 验证必填字段
    if (!(palmFile instanceof File) || !(tongueFile instanceof File) || !dreamText.trim()) {
      return errorResponse(
        locale === "zh" ? "请上传掌纹、舌苔图片并填写梦境内容" : "Please upload palm and tongue images and fill in dream content",
      );
    }

    // 验证梦境内容：至少 5 个字符，且不能只是单个词或标点
    const trimmedDream = dreamText.trim();
    if (trimmedDream.length < 5) {
      return errorResponse(
        locale === "zh" ? "为了让您的测评更真实准确，建议您上传真实图片和梦境" : "For a more accurate assessment, please upload real images and dream content",
      );
    }
    // 检查是否包含至少一个中文字符或英文单词（排除纯标点符号）
    const hasValidContent = /[\u4e00-\u9fa5]/.test(trimmedDream) || /\b\w+\b/.test(trimmedDream);
    if (!hasValidContent) {
      return errorResponse(
        locale === "zh" ? "为了让您的测评更真实准确，建议您上传真实图片和梦境" : "For a more accurate assessment, please upload real images and dream content",
      );
    }

    // 获取用户 session（支持匿名用户）
    const session = await getServerSession(authOptions).catch(() => null);
    let userId = session?.user?.id ?? null;
    
    // 验证 userId 是否为有效的 UUID 格式
    // 如果不是有效的 UUID（例如测试账户的 base64 编码 ID），则设置为 null
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.warn(`[POST /api/v2/analyze] Invalid UUID format for userId: ${userId}, setting to null`);
        userId = null;
      }
    }

    // 初始化 Supabase 客户端
    // V2 必须使用 Supabase，不再检查 SUPABASE_ANALYZE_ENABLED
    let client: SupabaseAdminClient = null;
    try {
      client = getSupabaseAdminClient();
      console.log("[POST /api/v2/analyze] Supabase client created successfully");
    } catch (clientError) {
      console.error("[POST /api/v2/analyze] Failed to create Supabase client:", clientError);
      // V2 必须使用 Supabase，如果无法创建客户端，返回错误
      return errorResponse(
        locale === "zh" ? "数据库连接失败，请稍后重试" : "Database connection failed, please try again",
        500,
        "PROCESSING_FAILED",
      );
    }

    // 生成报告 ID
    const reportId = randomUUID();
    const createdAt = new Date();
    const createdAtIso = createdAt.toISOString();

    const fallbackWarnings = {
      palm: [] as string[],
      tongue: [] as string[],
    };

    // 分析掌纹
    let palmResult: Awaited<ReturnType<typeof analyzePalmImage>> | null = null;
    try {
      palmResult = await analyzePalmImage(await palmFile.arrayBuffer().then((buf) => Buffer.from(buf)), {
        mimeType: palmFile.type,
        fileSize: palmFile.size,
      });
    } catch (palmError) {
      if (palmError instanceof PalmImageError) {
        const fallback = validatePalmShape(null, {
          locale,
          reasonCode: palmError.code,
          message: palmError.message,
        });
        palmResult = fallback.result;
        pushWarnings(fallbackWarnings.palm, fallback.warnings);
      } else {
        console.error("[POST /api/v2/analyze] Palm analysis failed:", palmError);
        return errorResponse(
          locale === "zh" ? "掌纹分析失败，请重试" : "Palm analysis failed, please try again",
          500,
          "PROCESSING_FAILED",
        );
      }
    }
    const palmValidation = validatePalmShape(palmResult, { locale });
    palmResult = palmValidation.result;
    pushWarnings(fallbackWarnings.palm, palmValidation.warnings);
    if (!palmResult) {
      return errorResponse(
        locale === "zh" ? "掌纹基础判断缺失" : "Palm fallback missing",
        500,
        "PROCESSING_FAILED",
      );
    }
    // 严格验证：如果检测不到手掌或图片质量太低，拒绝请求
    if (!palmValidation.ok) {
      const reason = palmValidation.reason;
      // 如果明确检测到不是手掌，直接拒绝
      if (reason === "NOT_PALM") {
        return errorResponse(
          locale === "zh" 
            ? "为了让您的测评更真实准确，建议您上传真实图片和梦境" 
            : "For a more accurate assessment, please upload real images and dream content",
          400,
          "BAD_REQUEST",
        );
      }
      console.warn("[V2 ANALYZE] Palm feature extraction failed, fallback applied:", {
        reportId,
        reason,
        level: palmValidation.level,
        warnings: palmValidation.warnings,
      });
    }
    
    // 严格验证：只拒绝明显无效的图片
    // qualityScore 20 是 isLikelyPalm 失败时的 fallback 值，必须拒绝
    // qualityScore < 15 已经在 analyzePalmImage 内部检查并抛出错误，这里只检查 fallback 情况
    if (palmResult && palmResult.qualityScore === 20) {
      return errorResponse(
        locale === "zh" 
          ? "为了让您的测评更真实准确，建议您上传真实图片和梦境" 
          : "For a more accurate assessment, please upload real images and dream content",
        400,
        "BAD_REQUEST",
      );
    }

    // 分析舌苔
    let tongueResult: Awaited<ReturnType<typeof analyzeTongueImage>> | null = null;
    try {
      tongueResult = await analyzeTongueImage(await tongueFile.arrayBuffer().then((buf) => Buffer.from(buf)), {
        mimeType: tongueFile.type,
        fileSize: tongueFile.size,
      });
    } catch (tongueError) {
      if (tongueError instanceof TongueImageError) {
        const fallback = validateTongueShape(null, {
          locale,
          reasonCode: tongueError.code,
          message: tongueError.message,
        });
        tongueResult = fallback.result;
        pushWarnings(fallbackWarnings.tongue, fallback.warnings);
      } else {
        console.error("[POST /api/v2/analyze] Tongue analysis failed:", tongueError);
        return errorResponse(
          locale === "zh" ? "舌苔分析失败，请重试" : "Tongue analysis failed, please try again",
          500,
          "PROCESSING_FAILED",
        );
      }
    }
    const tongueValidation = validateTongueShape(tongueResult, { locale });
    tongueResult = tongueValidation.result;
    pushWarnings(fallbackWarnings.tongue, tongueValidation.warnings);
    if (!tongueResult) {
      return errorResponse(
        locale === "zh" ? "舌苔基础判断缺失" : "Tongue fallback missing",
        500,
        "PROCESSING_FAILED",
      );
    }
    // 严格验证：如果检测不到舌苔或图片质量太低，拒绝请求
    if (!tongueValidation.ok) {
      const reason = tongueValidation.reason;
      // 如果明确检测到不是舌苔，直接拒绝
      if (reason === "NOT_TONGUE") {
        return errorResponse(
          locale === "zh" 
            ? "为了让您的测评更真实准确，建议您上传真实图片和梦境" 
            : "For a more accurate assessment, please upload real images and dream content",
          400,
          "BAD_REQUEST",
        );
      }
      console.warn("[V2 ANALYZE] Tongue feature extraction failed, fallback applied:", {
        reportId,
        reason,
        level: tongueValidation.level,
        warnings: tongueValidation.warnings,
      });
    }
    
    // 严格验证：只拒绝明显无效的图片
    // qualityScore < 12 已经在 analyzeTongueImage 内部检查并抛出错误
    // 这里只检查 NOT_TONGUE 的情况（已在上面处理）

    // 上传图片到 Supabase storage 并获取 publicUrl
    let palmImageUrl: string | null = null;
    let tongueImageUrl: string | null = null;
    if (hasSupabase(client)) {
      try {
        // 并行上传两张图片
        const [palmUrl, tongueUrl] = await Promise.all([
          uploadImageAndGetPublicUrl(client, palmFile, "palm", reportId),
          uploadImageAndGetPublicUrl(client, tongueFile, "tongue", reportId),
        ]);
        palmImageUrl = palmUrl;
        tongueImageUrl = tongueUrl;
      } catch (uploadError) {
        console.error("[POST /api/v2/analyze] Image upload failed:", uploadError);
        // 上传失败不影响报告生成，继续处理
      }
    }

    // 分析梦境
    let dreamResult: Awaited<ReturnType<typeof analyzeDreamText>> | null = null;
    try {
      dreamResult = await analyzeDreamText({
        text: dreamText,
        locale,
        emotion: dreamEmotion || undefined,
        category: dreamType || undefined,
        tags: dreamTags,
      });
    } catch (dreamError) {
      console.error("[POST /api/v2/analyze] Dream analysis failed:", dreamError);
      // 梦境分析失败不影响整体流程，继续处理
    }

    // LLM 解读（所有调用都通过封装函数，失败时回退到 rules-only 兜底）
    // 先构建 archetype（用于后续 derivePalmFeatureTags 和兜底逻辑）
    const palmFeaturesForArchetype = mapPalmResultToFeatures(palmResult);
    // 将 PalmFeaturesV2 转换为 PalmInput 格式
    const palmInput = {
      ...palmFeaturesForArchetype,
      lines: {
        ...palmFeaturesForArchetype.lines,
        fate: undefined,
        money: undefined,
      },
      qualityScore: palmResult?.qualityScore ?? 0,
    };
    const palmArchetype = buildPalmArchetype(palmInput as any);
    
    // 掌纹 LLM 解读（带错误处理和兜底）
    let palmInsight;
    let palmLLMCalled = false;
    let palmLLMSuccess = false;
    try {
      console.log("[V2 Analyze] Calling LLM for palm interpretation...", { reportId, locale, hasOpenAIKey: !!process.env.OPENAI_API_KEY });
      palmInsight = await interpretPalmWithLLM(
        locale,
        palmResult ?? {
          color: "pink",
          texture: "smooth",
          lines: {},
          qualityScore: 0,
        },
      );
      // 只有在LLM真正成功返回有效数据后才标记为成功
      if (palmInsight && (palmInsight.summary?.length > 0 || palmInsight.bullets?.length > 0)) {
        palmLLMCalled = true;
        palmLLMSuccess = true;
        console.log("[V2 Analyze] LLM palm interpretation successful", { reportId, hasSummary: !!palmInsight.summary, bulletsCount: palmInsight.bullets?.length, usedLLM: true });
      } else {
        throw new Error("LLM returned empty or invalid response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ANALYZE_V2][LLM] Palm LLM call failed", { 
        reportId, 
        errorMessage,
        isProduction,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasUrlConfig: !!(process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
      });
      
      // 生产环境：LLM调用失败时返回错误，不允许fallback
      if (isProduction) {
        console.error("[ANALYZE_V2][LLM] Production environment: LLM call failed, cannot fallback to rules-only");
        const detailedError = errorMessage.includes("LLM proxy URL") 
          ? "LLM服务配置错误：无法构建代理URL。请检查NEXTAUTH_URL_INTERNAL等环境变量。"
          : errorMessage.includes("OPENAI_API_KEY")
          ? "LLM服务配置错误：API密钥未配置或无效。"
          : `掌纹分析失败：${errorMessage}`;
        throw new Error(detailedError);
      }
      
      // 开发环境：允许fallback到规则引擎
      console.warn("[V2 Analyze] Falling back to rule-based palm insight (development only)", { reportId });
      palmInsight = {
        summary: [
          locale === "zh"
            ? `你的生命力整体${palmArchetype.vitality}，情绪上${palmArchetype.emotion_pattern}，思维上${palmArchetype.thinking_pattern}。`
            : `Your vitality is ${palmArchetype.vitality}, emotionally ${palmArchetype.emotion_pattern}, thinking-wise ${palmArchetype.thinking_pattern}.`,
        ],
        bullets: buildPalmAdviceFromArchetype(palmArchetype, locale),
      };
    }
    
    // 为了后续 deriveTongueFeatureTags，需要构建 archetype
    const tongueFeaturesForArchetype = mapTongueSummaryToTongueFeatures(tongueResult);
    const tongueArchetype = inferTongueArchetype(tongueFeaturesForArchetype);
    
    // 舌象 LLM 解读（带错误处理和兜底）
    let tongueInsight;
    let tongueLLMCalled = false;
    let tongueLLMSuccess = false;
    try {
      console.log("[V2 Analyze] Calling LLM for tongue interpretation...", { reportId, locale, hasOpenAIKey: !!process.env.OPENAI_API_KEY });
      tongueInsight = await interpretTongueWithLLM(locale, tongueResult);
      // 只有在LLM真正成功返回有效数据后才标记为成功
      if (tongueInsight && (tongueInsight.summary || tongueInsight.bullets?.length > 0)) {
        tongueLLMCalled = true;
        tongueLLMSuccess = true;
        console.log("[V2 Analyze] LLM tongue interpretation successful", { reportId, hasSummary: !!tongueInsight.summary, bulletsCount: tongueInsight.bullets?.length, usedLLM: true });
      } else {
        throw new Error("LLM returned empty or invalid response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ANALYZE_V2][LLM] Tongue LLM call failed", { 
        reportId, 
        errorMessage,
        isProduction,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasUrlConfig: !!(process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
      });
      
      // 生产环境：LLM调用失败时返回错误，不允许fallback
      if (isProduction) {
        console.error("[ANALYZE_V2][LLM] Production environment: LLM call failed, cannot fallback to rules-only");
        const detailedError = errorMessage.includes("LLM proxy URL") 
          ? "LLM服务配置错误：无法构建代理URL。请检查NEXTAUTH_URL_INTERNAL等环境变量。"
          : errorMessage.includes("OPENAI_API_KEY")
          ? "LLM服务配置错误：API密钥未配置或无效。"
          : `舌象分析失败：${errorMessage}`;
        throw new Error(detailedError);
      }
      
      // 开发环境：允许fallback到规则引擎
      console.warn("[V2 Analyze] Falling back to rule-based tongue insight (development only)", { reportId });
      tongueInsight = {
        summary: locale === "zh"
          ? `整体气机：${tongueArchetype.energy_state}；湿度：${tongueArchetype.moisture_pattern}；寒热：${tongueArchetype.heat_pattern}；胃气：${tongueArchetype.digestive_trend}。`
          : `Overall qi: ${tongueArchetype.energy_state}; Moisture: ${tongueArchetype.moisture_pattern}; Heat: ${tongueArchetype.heat_pattern}; Digestion: ${tongueArchetype.digestive_trend}.`,
        bullets: locale === "zh"
          ? ["喝温水或淡茶", "清淡饮食，少油炸", "早点休息，别熬夜"]
          : ["Sip warm water or mild tea", "Keep meals light", "Wind down early tonight"],
      };
    }
    
    const bodyTongue = buildBodyTongueRecord(tongueInsight, tongueArchetype);
    
    // 先构建 dreamArchetype（用于后续 deriveDreamFeatureTags 和兜底逻辑）
    const dreamArchetype = buildDreamArchetypeFromText({
      text: dreamText,
      emotionHint: dreamEmotion ?? undefined,
    });
    
    // 梦境 LLM 解读（带错误处理和兜底）
    let dreamInsightLLM;
    let dreamLLMCalled = false;
    let dreamLLMSuccess = false;
    try {
      console.log("[V2 Analyze] Calling LLM for dream interpretation...", { reportId, locale, dreamTextLength: dreamText.length, hasOpenAIKey: !!process.env.OPENAI_API_KEY });
      dreamInsightLLM = await interpretDreamWithLLM(locale, dreamText);
      // 只有在LLM真正成功返回有效数据后才标记为成功
      if (dreamInsightLLM && (dreamInsightLLM.symbol || dreamInsightLLM.suggestions?.length > 0)) {
        dreamLLMCalled = true;
        dreamLLMSuccess = true;
        console.log("[V2 Analyze] LLM dream interpretation successful", { reportId, hasSymbol: !!dreamInsightLLM.symbol, suggestionsCount: dreamInsightLLM.suggestions?.length, usedLLM: true });
      } else {
        throw new Error("LLM returned empty or invalid response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ANALYZE_V2][LLM] Dream LLM call failed", { 
        reportId, 
        errorMessage,
        isProduction,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasUrlConfig: !!(process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
        dreamTextLength: dreamText.length,
      });
      
      // 生产环境：LLM调用失败时返回错误，不允许fallback
      if (isProduction) {
        console.error("[ANALYZE_V2][LLM] Production environment: LLM call failed, cannot fallback to rules-only");
        const detailedError = errorMessage.includes("LLM proxy URL") 
          ? "LLM服务配置错误：无法构建代理URL。请检查NEXTAUTH_URL_INTERNAL等环境变量。"
          : errorMessage.includes("OPENAI_API_KEY")
          ? "LLM服务配置错误：API密钥未配置或无效。"
          : `梦境分析失败：${errorMessage}`;
        throw new Error(detailedError);
      }
      
      // 开发环境：允许fallback到规则引擎
      console.warn("[V2 Analyze] Falling back to rule-based dream insight (development only)", { reportId });
      dreamInsightLLM = {
        symbol: dreamArchetype.symbol_meaning || (locale === "zh" ? "梦境提醒你放慢节奏、留意内心。" : "Dream nudges you to slow down and listen inward."),
        mood: dreamArchetype.mood_pattern || (locale === "zh" ? "心绪需要被理解与安放。" : "Mood craves understanding and gentle pacing."),
        trend: dreamArchetype.trend_hint || (locale === "zh" ? "适合整理思绪、温柔推进。" : "Good for gentle sorting and paced progress."),
        suggestions: dreamArchetype.suggestion_tags.length > 0
          ? dreamArchetype.suggestion_tags.slice(0, 3)
          : locale === "zh"
            ? ["写下梦境片段", "和信任的人分享感受", "早点休息补充能量"]
            : ["Write down fragments", "Share with someone you trust", "Rest a little earlier tonight"],
      };
    }
    
    const dreamInsight = {
      archetype: dreamArchetype,
      llm: dreamInsightLLM,
    };

    // 确定体质（使用规则推断，interpretConstitutionWithLLM 是同步函数，基于规则）
    // 注意：interpretConstitutionWithLLM 不是真正的 LLM 调用，而是基于规则的推断
    const constitutionInsight = interpretConstitutionWithLLM(
      palmInsight,
      tongueInsight,
      dreamInsightLLM,
      locale,
    );

    // 从 LLM 结果或 fallback 中获取体质类型，并补充元数据
    const constitutionType = constitutionInsight.constitution_type as any;
    const constitutionProfile = CONSTITUTION_DATA[constitutionType] ?? CONSTITUTION_DATA.steady_build;
    const constitution = {
      type: constitutionType,
      name: constitutionProfile.name,
      name_en: constitutionProfile.en,
      // 优先使用 LLM 生成的描述和建议，否则使用预设数据
      description_paragraphs: constitutionInsight.description_paragraphs ?? constitutionProfile.feature,
      constitution_advice: constitutionInsight.constitution_advice ?? constitutionProfile.advice,
      // 兼容旧字段
      brief: constitutionProfile.brief,
      feature: constitutionInsight.description_paragraphs ?? constitutionProfile.feature,
      adviceSummary:
        constitutionProfile.adviceSummary ||
        "建议你多关注自己的状态变化，学会用温和的方式调节。",
      advice: constitutionInsight.constitution_advice ?? constitutionProfile.advice,
      qiEffect: constitutionProfile.qiEffect ?? 0,
    };

    // 构建 V2 掌纹结果（包含 wealth 字段）
    // 先基于规则生成基础结果
    let palmResultV2 = buildPalmResultV2(
      palmInput as any,
      palmResult?.lines?.wealth ?? undefined, // 如果有财富线文本，传入
      locale,
    );

    // 使用 LLM 增强财富线分析（模板 + 插值方式）
    try {
      const wealthLLMInsight = await interpretPalmWealthWithLLM(locale, {
        level: palmResultV2.wealth.level,
        pattern: palmResultV2.wealth.pattern,
        money: (palmInput as any).lines?.money,
        fate: (palmInput as any).lines?.fate,
        wealth_trend: palmArchetype.wealth_trend,
      });
      
      // 验证LLM返回的数据是否有效
      if (!wealthLLMInsight || (!wealthLLMInsight.summary && (!wealthLLMInsight.risk?.length && !wealthLLMInsight.potential?.length))) {
        throw new Error("LLM returned empty or invalid wealth insight");
      }
      
      // 合并 LLM 生成的财富洞察（如果 LLM 成功生成，则使用 LLM 结果）
      palmResultV2 = {
        ...palmResultV2,
        wealth: {
          ...palmResultV2.wealth,
          risk: wealthLLMInsight.risk.length > 0 ? wealthLLMInsight.risk : palmResultV2.wealth.risk,
          potential: wealthLLMInsight.potential.length > 0 ? wealthLLMInsight.potential : palmResultV2.wealth.potential,
          summary: wealthLLMInsight.summary || palmResultV2.wealth.summary,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[ANALYZE_V2][LLM] Wealth LLM call failed", { 
        reportId, 
        errorMessage,
        isProduction,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasUrlConfig: !!(process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
      });
      
      // 生产环境：LLM调用失败时返回错误，不允许fallback
      if (isProduction) {
        console.error("[ANALYZE_V2][LLM] Production environment: Wealth LLM call failed, cannot fallback to rules-only");
        const detailedError = errorMessage.includes("LLM proxy URL") 
          ? "LLM服务配置错误：无法构建代理URL。请检查NEXTAUTH_URL_INTERNAL等环境变量。"
          : errorMessage.includes("OPENAI_API_KEY")
          ? "LLM服务配置错误：API密钥未配置或无效。"
          : `财富线分析失败：${errorMessage}`;
        throw new Error(detailedError);
      }
      
      // 开发环境：允许fallback到规则生成的结果
      console.warn("[V2 Analyze] Failed to enhance wealth insight with LLM, using rule-based result (development only):", error);
      // LLM 失败时使用规则生成的结果，不中断流程
    }

    // 将新的 palmInsight 格式转换为原有的 normalized 格式
    // 新格式：{ summary: string[], bullets: string[] }
    // 旧格式：{ life_rhythm, emotion_pattern, thought_style, palm_overview_summary, palm_advice, wealth }
    // 注意：palm_insight 需要包含财富相关的完整信息（分段：生命 / 情感 / 智慧 / 财富）
    const normalizedPalmInsight = {
      life_rhythm: palmInsight.summary[0] || palmResultV2.life.interpretation || palmArchetype.vitality || "中等",
      emotion_pattern: palmInsight.summary[1] || palmResultV2.emotion.interpretation || palmArchetype.emotion_pattern || "平和稳定",
      thought_style: palmInsight.summary[2] || palmResultV2.wisdom.interpretation || palmArchetype.thinking_pattern || "中庸思考",
      palm_overview_summary: palmInsight.summary.join(" ") || `${palmArchetype.vitality}；${palmArchetype.emotion_pattern}；${palmArchetype.thinking_pattern}`,
      palm_advice: palmInsight.bullets,
      // 财富线完整信息（包含 LLM 生成的详细内容）
      wealth: {
        summary: palmResultV2.wealth.summary, // 预览版显示：一句话总结
        level: palmResultV2.wealth.level, // 完整版显示：强弱等级
        pattern: palmResultV2.wealth.pattern, // 完整版显示：纹理特征
        risk: palmResultV2.wealth.risk, // 完整版显示：破财风险点
        potential: palmResultV2.wealth.potential, // 完整版显示：聚财途径
      },
    };

    // 计算气运节奏（在生成 palm_insight / body_tongue / dream_insight / constitution 之后）
    const palmFeatureTags = derivePalmFeatureTags(palmArchetype, palmResult);
    const tongueFeatureTags = deriveTongueFeatureTags(bodyTongue);
    const dreamFeatureTags = deriveDreamFeatureTags(dreamArchetype);
    const qiRhythmResult = inferQiRhythmV2(palmFeatureTags, tongueFeatureTags, dreamFeatureTags, new Date());
    
    // 将 QiRhythmResult 转换为 QiRhythmV2 格式
    const qiRhythm: QiRhythmV2 = {
      index: qiRhythmResult.index,
      trend: qiRhythmResult.trend,
      tag: qiRhythmResult.tag as QiTag, // 类型断言：tag 应该是 "升" | "稳" | "中" | "低"
      summary: qiRhythmResult.summary,
      trendText: qiRhythmResult.trendText,
      advice: qiRhythmResult.advice,
    };

    const palmSuggestions = normalizedPalmInsight.palm_advice;
    // 使用 LLM 生成的体质建议，否则使用预设数据
    const constitutionAdviceForMerge = constitution.constitution_advice ?? constitutionProfile.advice;
    const advice = generateAdviceV2({
      constitution: {
        ...constitutionProfile,
        advice: constitutionAdviceForMerge,
      },
      palmSuggestions,
      tongueSuggestions: bodyTongue?.health_care_advice ?? [],
      dreamSuggestions: dreamInsightLLM?.suggestions ?? [],
      qi: qiRhythm,
      maxItems: 5,
    }).items;

    // 构建 normalized 对象（统一管理所有标准化数据）
    // 最终格式：{ palm_insight, palm_result, body_tongue, constitution, dream_insight, qi_rhythm, advice }
    // palm_result 现在包含 wealth 子字段（PalmResultV2 结构）
    const normalized = {
      palm_insight: normalizedPalmInsight,
      palm_result: palmResultV2, // 使用包含 wealth 的 PalmResultV2 结构
      body_tongue: bodyTongue,
      constitution,
      dream_insight: dreamInsight,
      qi_rhythm: qiRhythm,
      advice: {
        actions: advice,
      },
      runtime_warnings:
        fallbackWarnings.palm.length > 0 || fallbackWarnings.tongue.length > 0
          ? fallbackWarnings
          : undefined,
      // 记录 LLM 使用情况（用于调试）
      // 只有在LLM真正成功调用后才标记为true
      _llm_usage: {
        palm: palmLLMSuccess,
        tongue: tongueLLMSuccess,
        dream: dreamLLMSuccess,
      },
    };

    // 构建 V2 报告数据
    // 确保字段名与数据库完全一致（snake_case，NOT NULL 字段必须有值）
    const v2Report = {
      id: reportId,
      created_at: createdAtIso,
      // user_id：如果有 session 则使用 userId，否则为 null（支持匿名用户）
      user_id: userId,
      // normalized 字段是 NOT NULL，必须提供（至少是空对象）
      normalized: normalized,
      // 顶层字段（用于兼容和快速查询）
      palm_insight: normalized?.palm_insight ?? null,
      palm_result: normalized?.palm_result ?? null,
      body_tongue: normalized?.body_tongue ?? null, // 使用 body_tongue，不是 tongue_result
      constitution: normalized?.constitution ?? null,
      dream_insight: normalized?.dream_insight ?? null,
      qi_rhythm: normalized?.qi_rhythm ?? null,
      advice: normalized?.advice ?? null,
      // 原始数据（raw_data 和 raw_features）
      raw_data: {
        palm: palmResult ?? null,
        tongue: tongueResult ?? null,
        dream: dreamResult ?? null,
      },
      raw_features: {
        palm: palmResult ?? null,
        tongue: tongueResult ?? null,
        dream: dreamResult ?? null,
      },
      // 图片 URL（image_urls）
      image_urls: {
        palm: palmImageUrl ?? null,
        tongue: tongueImageUrl ?? null,
      },
      locale: (locale ?? "zh") as "zh" | "en",
    };

    // 使用统一的 saveReport 函数保存报告
    // 确保 reportId 已生成（应该在前面已经生成）
    let finalReportId = reportId;
    if (!finalReportId || !v2Report.id) {
      finalReportId = randomUUID();
      v2Report.id = finalReportId;
      console.log(`[ANALYZE] Generated new reportId: ${finalReportId}`);
    }
    
    // 确保 v2Report 的 id 与 finalReportId 一致
    v2Report.id = finalReportId;
    
    // 调用 saveReport 前的日志
    console.log("[ANALYZE] about to save report", finalReportId);
    console.log("[ANALYZE] v2Report structure before save:", {
      id: v2Report.id,
      hasNormalized: !!v2Report.normalized,
      normalizedType: typeof v2Report.normalized,
      hasPalmInsight: !!v2Report.normalized?.palm_insight,
      hasBodyTongue: !!v2Report.normalized?.body_tongue,
      hasConstitution: !!v2Report.normalized?.constitution,
      hasDreamInsight: !!v2Report.normalized?.dream_insight,
      hasQiRhythm: !!v2Report.normalized?.qi_rhythm,
      hasAdvice: !!v2Report.normalized?.advice,
      hasRawData: !!v2Report.raw_data,
      hasRawFeatures: !!v2Report.raw_features,
      hasImageUrls: !!v2Report.image_urls,
    });
    
    try {
      // 将完整的 result 结构写入 Supabase 表 report_v2
      // 使用 serviceRoleKey 创建的 supabaseAdmin 插入数据库
      const savedReportId = await saveReport(v2Report);
      
      // 调用 saveReport 后的日志
      console.log("[ANALYZE] saveReport completed", savedReportId);
      console.log(`[ANALYZE] Original reportId: ${finalReportId}, Saved reportId: ${savedReportId}`);
      
      // 确保返回的 reportId 与保存的一致
      const returnReportId = savedReportId || finalReportId;
      
      // 验证保存是否成功：立即尝试从数据库读取
      const { getReportById } = await import("@/lib/analysis/v2/reportStore");
      const verifyReport = await getReportById(returnReportId);
      if (verifyReport) {
        console.log(`[ANALYZE] Verification: Report can be retrieved from Supabase immediately, id: ${verifyReport.id}`);
      } else {
        console.error(`[ANALYZE] Verification FAILED: Report cannot be retrieved from Supabase immediately after save! reportId: ${returnReportId}`);
        // 保存成功但查询失败，这可能是时序问题，记录警告但不抛出错误
      }
      
      // 返回统一格式：{ ok: true, reportId, data: { ... } }
      // 使用保存时返回的 reportId，确保一致性
      return NextResponse.json(
        {
          ok: true,
          reportId: returnReportId,
          data: v2Report,
        },
        { status: 200 },
      );
    } catch (saveError) {
      // 插入失败时必须输出 console.error
      console.error(`[ANALYZE] Failed to save report to Supabase:`, saveError);
      console.error(`[ANALYZE] Save error details:`, {
        message: saveError instanceof Error ? saveError.message : String(saveError),
        stack: saveError instanceof Error ? saveError.stack : undefined,
        reportId: v2Report.id || finalReportId,
        v2ReportStructure: {
          hasId: !!v2Report.id,
          hasNormalized: !!v2Report.normalized,
          normalizedType: typeof v2Report.normalized,
        },
      });
      // 返回错误响应，而不是抛出异常
      return NextResponse.json(
        {
          ok: false,
          code: "SAVE_FAILED",
          message: saveError instanceof Error ? saveError.message : "Failed to save report to database",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[POST /api/v2/analyze] Unhandled exception:", error);
    console.error("[POST /api/v2/analyze] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      "PROCESSING_FAILED",
    );
  }
}

function mapTongueSummaryToTongueFeatures(
  summary: Awaited<ReturnType<typeof analyzeTongueImage>>,
): TongueFeatures {
  const bodyColor: TongueFeatures["bodyColor"] =
    summary.color === "pale"
      ? "light-red"
      : summary.color === "purple"
        ? "purple"
        : summary.color === "red"
          ? "red"
          : "light-red";

  const coatingColor: TongueFeatures["coatingColor"] =
    summary.coating === "yellow"
      ? "yellow"
      : summary.coating === "none"
        ? "none"
        : "white";

  const coatingThickness: TongueFeatures["coatingThickness"] =
    summary.coating === "thick" ? "thick" : "thin";

  const moisture: TongueFeatures["moisture"] =
    summary.texture === "cracked" ? "dry" : "moist";

  return {
    bodyColor,
    coatingColor,
    coatingThickness,
    moisture,
    teethMarks: false,
  };
}

function mapPalmResultToFeatures(
  palmResult: Awaited<ReturnType<typeof analyzePalmImage>> | null,
) {
  const lines = palmResult?.lines ?? {};
  return {
    color: (palmResult?.color ?? "pink") as "pale" | "pink" | "red" | "dark",
    texture: (palmResult?.texture ?? "smooth") as "smooth" | "dry" | "rough",
    lines: {
      life: lines.life,
      heart: lines.heart,
      wisdom: lines.wisdom,
      career: undefined,
      wealth: lines.wealth,
      marriage: undefined,
    },
  };
}

function buildBodyTongueRecord(
  insight: Awaited<ReturnType<typeof interpretTongueWithLLM>>,
  archetype: ReturnType<typeof inferTongueArchetype>,
) {
  // summary 现在是单个字符串
  const summaryText = typeof insight.summary === "string"
    ? insight.summary
    : Array.isArray(insight.summary)
      ? (insight.summary as string[]).join(" ")
      : "";
  // bullets 替代了原来的 advice
  const advice = Array.isArray(insight.bullets) ? (insight.bullets as string[]) : [];
  return {
    summary: summaryText,
    advice,
    qi_pattern: summaryText,
    energy_state: archetype.energy_state,
    body_trend: archetype.digestive_trend,
    moisture_pattern: archetype.moisture_pattern,
    heat_pattern: archetype.heat_pattern,
    digestive_trend: archetype.digestive_trend,
    special_signs: archetype.special_signs,
    health_care_advice: advice,
    archetype,
  };
}

function derivePalmFeatureTags(
  archetype: PalmArchetype,
  palmResult: Awaited<ReturnType<typeof analyzePalmImage>> | null,
): string[] {
  const tags: string[] = [];
  const vitalityText = `${archetype.vitality ?? ""}${archetype.palm_color_signal ?? ""}`;
  if (palmResult?.lines?.life === "deep" || /旺|充|强|饱|活/.test(vitalityText)) {
    tags.push("vitality_strong");
  } else if (
    palmResult?.lines?.life === "broken" ||
    /弱|虚|低|疲|慢/.test(vitalityText)
  ) {
    tags.push("vitality_low");
  }
  return tags;
}

function deriveTongueFeatureTags(bodyTongue: ReturnType<typeof buildBodyTongueRecord>): string[] {
  const tags: string[] = [];
  const energyText = bodyTongue.energy_state ?? "";
  const heatText = bodyTongue.heat_pattern ?? "";
  if (/虚|低|疲|弱|乏/.test(energyText)) {
    tags.push("energy_low");
  }
  if (/热|火|亢/.test(heatText)) {
    tags.push("fire_strong");
  }
  return tags;
}

function deriveDreamFeatureTags(archetype: ReturnType<typeof buildDreamArchetypeFromText>): string[] {
  const tags: string[] = [];
  const moodText = archetype.mood_pattern ?? "";
  const trendText = archetype.trend_hint ?? "";
  const symbolText = archetype.symbol_meaning ?? "";
  if (/焦|压|急|紧|追|赶|忙/.test(moodText)) {
    tags.push("stress");
  }
  if (/突破|飞|跃|探索|打开|焕新/.test(trendText + symbolText)) {
    tags.push("breakthrough");
  }
  return tags;
}

/**
 * 从 PalmArchetype 构建掌纹建议（rules-only 兜底逻辑）
 */
function buildPalmAdviceFromArchetype(archetype: PalmArchetype, locale: Locale): string[] {
  if (locale === "zh") {
    return [
      archetype.career_trend ? `事业：${archetype.career_trend}` : "处理任务先聚焦主线",
      archetype.relationship_trend ? `关系：${archetype.relationship_trend}` : "与亲近的人分享近况",
      archetype.palm_color_signal ? `气色：${archetype.palm_color_signal}` : "喝温水，别一次性冲太久",
    ];
  }
  return [
    archetype.career_trend ? `Career: ${archetype.career_trend}` : "Lead with the top task",
    archetype.relationship_trend ? `Relationships: ${archetype.relationship_trend}` : "Share your state with someone close",
    archetype.palm_color_signal ? `Color hint: ${archetype.palm_color_signal}` : "Sip something warm before sprinting",
  ];
}

