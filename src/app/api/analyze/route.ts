import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { analyzeTongueImage, TongueImageError } from "@/lib/analysis/tongueFeatures";
import { analyzePalmImage, PalmImageError } from "@/lib/analysis/palmFeatures";
import { analyzeDreamText } from "@/lib/analysis/dreamFeatures";
import { executeRules, type RuleFacts } from "@/lib/rules";
import { computeQiIndex, computeQiIndexFromRules } from "@/lib/analysis/qiIndex";
import { resolveImageExtension } from "@/lib/palmprints/validation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { resolveSolarTermCode } from "@/lib/solar/resolve";
import { getSolarTermInsight } from "@/data/solarTerms";
import { saveTemporaryReport } from "@/lib/tempReportStore";
import { ensureSession, verifyOrCreateSession } from "@/lib/supabase/sessionUtils";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro plan allows up to 60s, Hobby plan is 10s

const STORAGE_BUCKET = process.env.SUPABASE_ANALYSIS_BUCKET ?? "analysis-temp";
const SUPABASE_ANALYZE_ENABLED = process.env.ENABLE_SUPABASE_ANALYZE === "true";

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient> | null;

const LOCAL_CONSTITUTION_FALLBACK: Record<
  string,
  {
    name: { zh: string; en: string };
    feature: string;
    advice: { diet: string[]; activity: string[]; acupoint?: string[] };
  }
> = {
  平和: {
    name: { zh: "平和体质", en: "Balanced Constitution" },
    feature: "气血充盈、五脏调和，精神充沛、对环境适应力强。",
    advice: {
      diet: ["三餐定时定量，荤素搭配，保持清淡。", "多食时令果蔬，避免油腻辛辣。"],
      activity: ["坚持有氧运动，如快走、太极、游泳。", "保持规律作息，劳逸结合。"],
      acupoint: ["每日按揉足三里、关元穴，扶正固本。"],
    },
  },
};

function hasSupabase(client: SupabaseAdminClient): client is Exclude<SupabaseAdminClient, null> {
  return SUPABASE_ANALYZE_ENABLED && Boolean(client);
}

type AnalyzeErrorCode = "BAD_REQUEST" | "PROCESSING_FAILED";

function errorResponse(message: string, status = 400, code: AnalyzeErrorCode = "BAD_REQUEST") {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status },
  );
}

function normalizeSupabaseError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (error && typeof error === "object" && "message" in error) {
    const raw = (error as { message?: unknown }).message;
    return new Error(typeof raw === "string" ? raw : JSON.stringify(raw));
  }
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("UNKNOWN_SUPABASE_ERROR");
  }
}

// ensureSession 已移至 @/lib/supabase/sessionUtils

async function uploadImage(
  client: SupabaseAdminClient,
  sessionId: string,
  type: "palm" | "tongue",
  file: File,
  quality: number,
  features: Record<string, unknown>,
  locale: string = "zh",
  tz: string = "Asia/Shanghai",
) {
  // 只有在 hasSupabase 为 true 时才会调用此函数，但为了安全起见，仍然检查
  if (!hasSupabase(client)) {
    throw new Error("Supabase client is not available for image upload");
  }
  
  // 在插入 uploads 之前，确保 session 存在
  await verifyOrCreateSession(client, sessionId, locale, tz);
  
  // 验证 session 真的存在
  const { data: sessionVerify, error: sessionVerifyError } = await client
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();
  
  if (sessionVerifyError) {
    console.error("[uploadImage] Session verification error:", sessionVerifyError);
    throw new Error(`无法验证 session: ${sessionVerifyError.message}`);
  }
  
  if (!sessionVerify) {
    console.error("[uploadImage] Session does not exist after verifyOrCreateSession:", sessionId);
    throw new Error(`Session ${sessionId} 不存在，无法上传图片`);
  }
  
  const uploadId = randomUUID();
  const imageInfo = resolveImageExtension({ type: file.type, name: file.name });
  const path = `${type}/${sessionId}/${uploadId}.${imageInfo.ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await client.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: imageInfo.mime,
    upsert: true,
    cacheControl: "180",
  });
  if (uploadErr) throw uploadErr;

  const { error: insertErr } = await client.from("uploads").insert({
    id: uploadId,
    session_id: sessionId,
    type,
    storage_path: `${STORAGE_BUCKET}/${path}`,
    mime_type: imageInfo.mime,
    quality_score: quality,
    features,
  });
  if (insertErr) {
    console.error("[uploadImage] Insert upload error:", insertErr);
    throw insertErr;
  }
  return uploadId;
}

async function fetchSolarTerm(client: SupabaseAdminClient, code: string, locale: "zh" | "en") {
  if (!hasSupabase(client)) {
    const insight = getSolarTermInsight(locale, code as any);
    return {
      code,
      name: insight.name,
      do: insight.favorable,
      avoid: insight.avoid,
      element: null,
      health_tip: insight.qiWarning,
    };
  }
  const { data, error } = await client
    .from("dict_solar_term")
    .select("code,name_zh,name_en,do_zh,avoid_zh,do_en,avoid_en,element,health_tip")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const insight = getSolarTermInsight(locale, code as any);
    return {
      code,
      name: insight.name,
      do: insight.favorable,
      avoid: insight.avoid,
      element: null,
      health_tip: insight.qiWarning,
    };
  }
  return {
    code: data.code,
    name: locale === "en" ? data.name_en : data.name_zh,
    do: locale === "en" ? data.do_en ?? [] : data.do_zh ?? [],
    avoid: locale === "en" ? data.avoid_en ?? [] : data.avoid_zh ?? [],
    element: data.element,
    health_tip: data.health_tip,
  };
}

async function fetchConstitutionDetail(
  client: SupabaseAdminClient,
  constitution: string,
  locale: "zh" | "en",
) {
  if (!hasSupabase(client)) {
    const key = constitution.replace(/体质$/, "");
    const fallback = LOCAL_CONSTITUTION_FALLBACK[key] ?? LOCAL_CONSTITUTION_FALLBACK["平和"];
    if (!fallback) return null;
    return {
      name: locale === "en" ? fallback.name.en : fallback.name.zh,
      feature: fallback.feature,
      advice: {
        diet: fallback.advice.diet,
        activity: fallback.advice.activity,
        acupoint: fallback.advice.acupoint ?? [],
      },
    };
  }
  const nameZh = constitution.endsWith("体质") ? constitution : `${constitution}体质`;
  const { data, error } = await client
    .from("dict_constitution")
    .select("name_zh,name_en,feature,advice_diet,advice_activity,advice_acupoint")
    .ilike("name_zh", nameZh)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return {
    name: locale === "en" ? data.name_en : data.name_zh,
    feature: data.feature,
    advice: {
      diet: data.advice_diet,
      activity: data.advice_activity,
      acupoint: data.advice_acupoint,
    },
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tongueFile = formData.get("tongue_image");
    const palmFile = formData.get("palm_image");
    const dreamText = formData.get("dream_text")?.toString()?.trim() ?? "";
    const dreamType = formData.get("dream_type")?.toString()?.trim() ?? "";
    const dreamEmotionValue = formData.get("emotion")?.toString()?.trim() ?? "";
    const dreamTagsRaw = formData.get("dream_tags");
    const dreamTags: string[] = [];
    if (typeof dreamTagsRaw === "string") {
      try {
        const parsed = JSON.parse(dreamTagsRaw);
        if (Array.isArray(parsed)) {
          parsed
            .slice(0, 8)
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag) => tag.length > 0)
            .forEach((tag) => {
              if (!dreamTags.includes(tag)) {
                dreamTags.push(tag);
              }
            });
        }
      } catch {
        dreamTagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .slice(0, 8)
          .forEach((tag) => {
            if (!dreamTags.includes(tag)) {
              dreamTags.push(tag);
            }
          });
      }
    }
    const locale = formData.get("locale")?.toString() === "en" ? "en" : "zh";
    const tz = formData.get("tz")?.toString() ?? "Asia/Shanghai";
    const privacyAccepted = formData.get("privacy_accepted")?.toString() === "true";
    const sessionIdParam = formData.get("session_id")?.toString();
    const sessionId = sessionIdParam && sessionIdParam.length > 0 ? sessionIdParam : randomUUID();
    const ipCandidate =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      request.headers.get("cf-connecting-ip") ??
      "";
    const ipAddress = ipCandidate.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent") ?? null;

    if (!(tongueFile instanceof File) && !(palmFile instanceof File) && !dreamText) {
      return errorResponse("至少上传手相、舌相或填写梦境内容之一");
  }

    let client: SupabaseAdminClient = null;
    if (SUPABASE_ANALYZE_ENABLED) {
      try {
        client = getSupabaseAdminClient();
      } catch (supabaseError) {
        console.warn("[POST /api/analyze] Supabase admin client unavailable", supabaseError);
      }
    }

    // 确保 session 存在（如果启用 Supabase）
    if (SUPABASE_ANALYZE_ENABLED && client) {
      try {
        await ensureSession(client, sessionId, locale, tz);
      } catch (sessionError) {
        console.error("[POST /api/analyze] ensureSession failed:", sessionError);
        return NextResponse.json(
          { error: "无法创建会话，请稍后重试" },
          { status: 500 }
        );
      }
    }

    if (privacyAccepted) {
      if (hasSupabase(client)) {
        try {
          // 验证 session 存在
          const { data: sessionCheck } = await client
            .from("sessions")
            .select("id")
            .eq("id", sessionId)
            .maybeSingle();
          
          if (!sessionCheck) {
            console.warn("[POST /api/analyze] Session does not exist for privacy_consents:", sessionId);
          } else {
            await client.from("privacy_consents").insert({
              session_id: sessionId,
              locale,
              tz,
              ip_address: ipAddress,
              user_agent: userAgent,
            });
          }
        } catch (consentError) {
          console.warn("[POST /api/analyze] privacy consent insert failed", consentError);
        }
      }
    }

    let palmResult: Awaited<ReturnType<typeof analyzePalmImage>> | null = null;
    let tongueResult: Awaited<ReturnType<typeof analyzeTongueImage>> | null = null;
    let dreamResult: Awaited<ReturnType<typeof analyzeDreamText>> | null = null;

    let supabaseUploadError: Error | null = null;
    let palmUploadId: string | null = null;
    let tongueUploadId: string | null = null;

    if (palmFile instanceof File) {
      palmResult = await analyzePalmImage(await palmFile.arrayBuffer().then((buf) => Buffer.from(buf)), {
        mimeType: palmFile.type,
        fileSize: palmFile.size,
      });
      if (hasSupabase(client)) {
        try {
          palmUploadId = await uploadImage(client, sessionId, "palm", palmFile, palmResult.qualityScore, {
            color: palmResult.color,
            texture: palmResult.texture,
            lines: palmResult.lines,
          }, locale, tz);
        } catch (uploadErr) {
          supabaseUploadError = normalizeSupabaseError(uploadErr);
          console.warn("[POST /api/analyze] palm upload failed, falling back to local", uploadErr);
          palmUploadId = null;
        }
      }
    }

    if (tongueFile instanceof File) {
      tongueResult = await analyzeTongueImage(await tongueFile.arrayBuffer().then((buf) => Buffer.from(buf)), {
        mimeType: tongueFile.type,
        fileSize: tongueFile.size,
      });
      if (hasSupabase(client)) {
        try {
          tongueUploadId = await uploadImage(client, sessionId, "tongue", tongueFile, tongueResult.qualityScore, {
            color: tongueResult.color,
            coating: tongueResult.coating,
            texture: tongueResult.texture,
          }, locale, tz);
        } catch (uploadErr) {
          supabaseUploadError = normalizeSupabaseError(uploadErr);
          console.warn("[POST /api/analyze] tongue upload failed, falling back to local", uploadErr);
          tongueUploadId = null;
        }
      }
    }

    const normalizedMood = dreamEmotionValue || "unknown";
    const normalizedCategory = dreamType || null;

    if (dreamText) {
      dreamResult = await analyzeDreamText({
        text: dreamText,
        locale,
        emotion: normalizedMood,
        category: normalizedCategory,
        tags: dreamTags,
      });
    }

    const now = new Date();
    const solarCode = resolveSolarTermCode(now);
    let solarInfo;
    try {
      solarInfo = await fetchSolarTerm(client, solarCode, locale);
    } catch (solarError) {
      console.error("[POST /api/analyze] Failed to fetch solar term:", solarError);
      // 使用默认值，不中断流程
      solarInfo = {
        code: solarCode,
        name: "未知节气",
        do: [],
        avoid: [],
        element: null,
        health_tip: null,
      };
    }

    const dreamFacts =
      dreamResult || dreamText
        ? {
            keywords: dreamResult?.keywords ?? [],
            emotion: (dreamResult?.mood ?? normalizedMood) || undefined,
            category: (dreamResult?.category ?? normalizedCategory) || undefined,
            tags:
              (dreamResult?.tags ?? dreamTags).length > 0
                ? (dreamResult?.tags ?? dreamTags)
                : undefined,
          }
        : undefined;

    const normalizedPalmLines =
      palmResult?.lines && typeof palmResult.lines === "object"
        ? Object.fromEntries(
            Object.entries(palmResult.lines).map(([key, value]) => [key, value ?? "unknown"]),
          )
        : undefined;

    // 构建规则事实，包含所有需要的字段
    // 手相字段映射：palm.color -> palm_color, palm.lines.life -> life_line 等
    const facts: RuleFacts = {
      locale,
      palm: palmResult
        ? {
            color: palmResult.color,
            texture: palmResult.texture,
            lines: normalizedPalmLines,
            // 扁平化字段，方便规则匹配
            palm_color: palmResult.color, // 顶层字段
            line_depth: (palmResult as any).lineDepth || (palmResult as any).line_depth,
            life_line: normalizedPalmLines?.life,
            head_line: normalizedPalmLines?.head,
            emotion_line: normalizedPalmLines?.heart,
            mount_tags: (palmResult as any).mountTags || (palmResult as any).mount_tags,
          }
        : undefined,
      tongue: tongueResult
        ? {
            color: tongueResult.color,
            coating: tongueResult.coating,
            texture: tongueResult.texture,
            qualityScore: tongueResult.qualityScore,
            // 扁平化字段，方便规则匹配
            tongue_color: tongueResult.color, // 顶层字段
          }
        : undefined,
      dream: {
        ...dreamFacts,
        // 扁平化字段，方便规则匹配
        dream_keywords: dreamFacts?.keywords || dreamTags, // 顶层字段
      } as any,
      solar: {
        code: solarCode,
        name: solarInfo.name,
        // 扁平化字段，方便规则匹配
        solar_term: solarCode, // 顶层字段
      } as any,
    };

    const { result: ruleResult, matchedRules } = await executeRules(facts);
    const constitutionName = ruleResult.constitution ?? "平和";
    let constitutionDetail;
    try {
      constitutionDetail = await fetchConstitutionDetail(client, constitutionName, locale);
    } catch (constitutionError) {
      console.error("[POST /api/analyze] Failed to fetch constitution detail:", constitutionError);
      // 使用默认值，不中断流程
      constitutionDetail = null;
    }
    
    // 合并 advice：规则引擎的 advice + 规则引擎的 advice_append + 体质详情
    const ruleAdvice = ruleResult.advice || {};
    const ruleAdviceAppend = (ruleResult as any).advice_append || {};
    const mergedAdvice = {
      ...ruleAdvice,
      ...ruleAdviceAppend,
      constitution: constitutionDetail ?? undefined,
    };

    // 构建 dream 记录：优先使用规则引擎的结果，否则使用分析结果
    const ruleDream = ruleResult.dream;
    const dreamRecord = ruleDream
      ? {
          summary: (ruleDream as any).summary ?? dreamResult?.summary ?? null,
          keywords: dreamResult?.keywords ?? [],
          interpretation: dreamResult?.interpretation ?? "",
          advice: dreamResult?.advice ?? [],
          tip: (ruleDream as any).tip ?? null,
          emotion: (ruleDream as any).emotion ?? dreamResult?.mood ?? normalizedMood,
          health_hint: (ruleDream as any).health_hint ?? null,
          mood: dreamResult?.mood ?? normalizedMood,
          category: dreamResult?.category ?? normalizedCategory,
          tags: dreamResult?.tags ?? dreamTags,
          raw_text: dreamResult?.rawText ?? (dreamText || null),
        }
      : dreamResult
      ? {
          summary: dreamResult.summary,
          keywords: dreamResult.keywords,
          interpretation: dreamResult.interpretation,
          advice: dreamResult.advice,
          tip: null,
          mood: dreamResult.mood ?? normalizedMood,
          category: dreamResult.category ?? normalizedCategory,
          tags: dreamResult.tags ?? dreamTags,
          raw_text: dreamResult.rawText ?? (dreamText || null),
        }
      : dreamText
      ? {
          summary: null,
          keywords: [],
          interpretation: "",
          advice: [],
          tip: null,
          mood: normalizedMood,
          category: normalizedCategory,
          tags: dreamTags,
          raw_text: dreamText,
        }
      : null;
    
    // 提取 tags（从规则结果中）
    const tags = (ruleResult as any).tags || [];

    // 使用规则引擎结果计算 qi_index
    const qiIndexTotal = computeQiIndexFromRules(ruleResult);
    
    // 为了兼容性，保留旧的 computeQiIndex 调用（如果需要详细分解）
    const qiIndexBreakdown = computeQiIndex({
      constitution: constitutionDetail?.name ?? constitutionName,
      palm: palmResult
        ? {
            qualityScore: palmResult.qualityScore,
            color: palmResult.color,
            texture: palmResult.texture,
            lines: normalizedPalmLines ?? null,
          }
        : undefined,
      tongue: tongueResult
        ? {
            qualityScore: tongueResult.qualityScore,
            color: tongueResult.color,
            coating: tongueResult.coating,
            texture: tongueResult.texture,
          }
        : undefined,
      dream: dreamFacts,
      solar: {
        code: solarCode,
        name: solarInfo.name,
        element: solarInfo.element ?? undefined,
      },
      matchedRules,
    });
    
    // 使用规则引擎计算的结果作为主要 qi_index
    const qiIndex = {
      ...qiIndexBreakdown,
      total: qiIndexTotal,
    };

    const reportId = randomUUID();
    const createdAtIso = new Date().toISOString();

    // 构建 solar 对象（从规则结果中提取，或使用默认值）
    const ruleSolar = (ruleResult as any).solar || {};
    const solarData = {
      title: ruleSolar.title ?? solarInfo.name,
      advice: ruleSolar.advice ?? (solarInfo as any).advice ?? "",
      warning: ruleSolar.warning ?? "",
      code: solarCode,
      name: solarInfo.name,
    };

    saveTemporaryReport({
      report: {
        id: reportId,
        constitution: constitutionName,
        palm_result: palmResult ?? null,
        tongue_result: tongueResult ?? null,
        dream: dreamRecord ?? null,
        advice: mergedAdvice,
        solar_term: solarInfo.name,
        solar: solarData, // 添加完整的 solar 对象
        tags: tags, // 添加 tags
        quote: ruleResult.quote ?? null,
        created_at: createdAtIso,
        unlocked: false,
        locale,
        qi_index: qiIndex,
        matched_rules: matchedRules,
        session_id: sessionId,
      },
      constitution_detail: constitutionDetail ?? undefined,
    });

    // 如果启用了 Supabase，必须成功保存到数据库才能返回 reportId
    if (SUPABASE_ANALYZE_ENABLED) {
      if (!client) {
        console.error("[POST /api/analyze] Supabase client is null but ENABLE_SUPABASE_ANALYZE=true");
        return NextResponse.json(
          { error: "数据库连接失败，请稍后重试" },
          { status: 500 }
        );
      }
      
      try {
        // 在插入 reports 之前，再次验证 session 存在（双重保险）
        await verifyOrCreateSession(client, sessionId, locale, tz);
        
        // 最后一次验证：确保 session 真的存在，如果不存在则抛出错误
        const { data: finalSessionCheck, error: finalSessionError } = await client
          .from("sessions")
          .select("id")
          .eq("id", sessionId)
          .maybeSingle();
        
        if (finalSessionError) {
          console.error("[POST /api/analyze] Final session check error:", finalSessionError);
          throw new Error(`无法验证 session 存在: ${finalSessionError.message}`);
        }
        
        if (!finalSessionCheck) {
          console.error("[POST /api/analyze] Session does not exist after verifyOrCreateSession:", sessionId);
          throw new Error(`Session ${sessionId} 不存在，无法插入报告`);
        }
        
        console.log("[POST /api/analyze] Session verified before report insert:", finalSessionCheck.id);
        
        // 准备插入数据，确保所有字段类型正确
        const reportData: any = {
          id: reportId,
          session_id: sessionId,
          constitution: constitutionName || null,
          palm_result: palmResult
            ? {
                ...palmResult,
                upload_id: palmUploadId,
              }
            : null,
          tongue_result: tongueResult
            ? {
                ...tongueResult,
                upload_id: tongueUploadId,
              }
            : null,
          dream: dreamRecord || null,
          solar_term: solarInfo.name || null,
          solar: solarData || null,
          tags: Array.isArray(tags) ? tags : null,
          advice: mergedAdvice || null,
          quote: ruleResult.quote ?? null,
          locale: locale || 'zh',
          tz: tz || 'Asia/Shanghai',
          unlocked: false,
          matched_rules: Array.isArray(matchedRules) ? matchedRules : null,
          qi_index: qiIndex || null,
          created_at: createdAtIso,
        };

        console.log("[POST /api/analyze] Inserting report with data:", {
          id: reportData.id,
          session_id: reportData.session_id,
          has_palm: !!reportData.palm_result,
          has_tongue: !!reportData.tongue_result,
          has_dream: !!reportData.dream,
          solar_term: reportData.solar_term,
          locale: reportData.locale,
          tz: reportData.tz,
        });

        const { error: reportError, data: reportDataResult } = await client.from("reports").insert(reportData).select("id");
        
        if (reportError) {
          console.error("[POST /api/analyze] Report insert error details:", {
            code: reportError.code,
            message: reportError.message,
            details: reportError.details,
            hint: reportError.hint,
          });
          throw reportError;
        }

        console.log("[POST /api/analyze] Report inserted successfully:", reportDataResult);
        
        // 报告保存成功后，记录访问权限
        try {
          // 再次验证 session 存在（虽然之前已经验证过，但为了保险起见）
          const { data: sessionFinalCheck } = await client
            .from("sessions")
            .select("id")
            .eq("id", sessionId)
            .maybeSingle();
          
          if (!sessionFinalCheck) {
            console.warn("[POST /api/analyze] Session does not exist for report_access:", sessionId);
            // 不插入 report_access，但不影响主流程
          } else {
            const { error: accessError } = await client.from("report_access").upsert(
              {
                report_id: reportId,
                session_id: sessionId,
                tier: "lite",
              },
              {
                onConflict: "report_id,session_id",
              },
            );
            if (accessError) {
              console.warn("[POST /api/analyze] report_access upsert error:", {
                code: accessError.code,
                message: accessError.message,
                details: accessError.details,
                hint: accessError.hint,
              });
              // report_access 失败不影响主流程，继续执行
            } else {
              console.log("[POST /api/analyze] report_access recorded successfully");
            }
          }
        } catch (accessError) {
          console.warn("[POST /api/analyze] record report_access failed", accessError);
          // report_access 失败不影响主流程，继续执行
        }
      } catch (reportInsertError) {
        const normalizedError = normalizeSupabaseError(reportInsertError);
        console.error("[POST /api/analyze] insert report error", reportInsertError);
        // 如果启用了 Supabase 但保存失败，返回错误，不返回 reportId
        return NextResponse.json(
          { 
            error: "报告保存失败，请稍后重试",
            details: normalizedError?.message || String(reportInsertError),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        report_id: reportId,
        session_id: sessionId,
        constitution: constitutionName,
        advice: ruleResult.advice ?? {},
        quote: ruleResult.quote ?? null,
        solar: solarInfo,
        palm: palmResult ?? undefined,
        tongue: tongueResult ?? undefined,
        dream: dreamRecord ?? undefined,
        constitution_detail: constitutionDetail ?? undefined,
        qi_index: qiIndex,
        matched_rules: matchedRules,
        created_at: createdAtIso,
        storage: supabaseUploadError ? "local" : hasSupabase(client) ? "supabase" : "local",
        supabase_error: SUPABASE_ANALYZE_ENABLED && supabaseUploadError ? supabaseUploadError.message : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TongueImageError || error instanceof PalmImageError) {
      const status = error.code === "INVALID_IMAGE" ? 400 : 422;
      return errorResponse(error.message, status, "BAD_REQUEST");
    }
    const message = error instanceof Error ? error.message : String(error);
    
    // 详细记录错误信息，包括错误类型、消息和堆栈
    console.error("[POST /api/analyze] Error occurred:", {
      message,
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      SUPABASE_ANALYZE_ENABLED,
      hasClient: !!client,
      sessionId,
      locale,
      tz,
    });
    
    if (error instanceof Error && error.stack) {
      console.error("[POST /api/analyze] Full stack trace:", error.stack);
    }
    
    // 检查是否是超时错误
    const isTimeout = 
      message.includes("timeout") || 
      message.includes("TIMEOUT") ||
      message.includes("ETIMEDOUT") ||
      (error instanceof Error && error.name === "TimeoutError");
    
    // 检查是否是Supabase连接错误
    const isSupabaseError = 
      message.includes("Supabase") ||
      message.includes("connection") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("无法创建 session") ||
      message.includes("无法查询 session") ||
      message.includes("无法验证 session") ||
      message.includes("Foreign key violation") ||
      message.includes("23503") ||
      message.includes("23505");
    
    // 检查是否是数据库约束错误
    const isDatabaseConstraintError =
      message.includes("23505") || // Unique constraint violation
      message.includes("23503") || // Foreign key violation
      message.includes("23502") || // Not null violation
      message.includes("constraint") ||
      message.includes("violation");
    
    let hint: string;
    if (process.env.NODE_ENV !== "production") {
      hint = `内部错误: ${message}`;
    } else if (isTimeout) {
      hint = "请求处理超时，请稍后重试";
    } else if (isSupabaseError || isDatabaseConstraintError) {
      hint = "数据库连接异常，请稍后重试";
    } else {
      hint = "服务器处理分析请求时出错，请稍后重试";
    }
    
    return errorResponse(hint, 500, "PROCESSING_FAILED");
  }
}
