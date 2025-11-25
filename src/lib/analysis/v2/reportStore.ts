/**
 * V2 报告存储统一接口
 * 提供统一的 getReportById 和 saveReport 函数
 */

import { randomUUID } from "crypto";
import { getTemporaryReport, saveTemporaryReport } from "@/lib/tempReportStore";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * V2 报告数据类型
 */
export type AnalysisV2Result = {
  id: string;
  created_at: string;
  user_id?: string | null; // 用户 ID（可选，支持匿名用户）
  normalized: {
    palm_insight?: any;
    palm_result?: any;
    body_tongue?: any;
    constitution?: any;
    dream_insight?: any;
    qi_rhythm?: any;
    advice?: any;
  };
  palm_insight?: any;
  palm_result?: any;
  body_tongue?: any;
  constitution?: any;
  dream_insight?: any;
  qi_rhythm?: any;
  advice?: any;
  raw_data?: any;
  raw_features?: any;
  image_urls?: any;
  locale?: "zh" | "en";
};

/**
 * 从临时存储构建 V2 响应格式
 */
function buildV2ResponseFromLocal(entry: ReturnType<typeof getTemporaryReport>) {
  if (!entry) {
    console.warn("[buildV2ResponseFromLocal] Entry is null");
    return null;
  }
  
  const report = entry.report;
  if (!report) {
    console.warn("[buildV2ResponseFromLocal] Entry.report is null");
    return null;
  }
  
  console.log(`[buildV2ResponseFromLocal] Processing report: ${report.id}, has v2_data: ${!!(report as any).v2_data}`);
  const payload = (report as any).v2_data ?? report;
  
  // 优先使用 normalized 对象（最终格式）
  const normalized = payload.normalized;
  if (normalized && typeof normalized === "object") {
    console.log("[buildV2ResponseFromLocal] Using normalized object from payload");
    return {
      id: payload.id ?? report.id,
      created_at: payload.created_at ?? report.created_at,
      normalized,
      // 保留顶层字段以兼容现有代码
      palm_insight: normalized.palm_insight ?? null,
      palm_result: normalized.palm_result ?? payload.palm_result ?? report.palm_result ?? null,
      body_tongue: normalized.body_tongue ?? null,
      constitution: normalized.constitution ?? null,
      dream_insight: normalized.dream_insight ?? null,
      qi_rhythm: normalized.qi_rhythm ?? null,
      advice: normalized.advice ?? payload.advice ?? null,
    };
  }
  
  // Fallback：从顶层字段构建
  console.log("[buildV2ResponseFromLocal] Building from fallback fields");
  return {
    id: payload.id ?? report.id,
    created_at: payload.created_at ?? report.created_at,
    normalized: {
      palm_insight: (payload as any).palm_insight ?? (report as any).palm_insight ?? null,
      palm_result: (payload as any).palm_result ?? (report as any).palm_result ?? null,
      body_tongue: (payload as any).body_tongue ?? null,
      constitution: (payload as any).constitution ?? null,
      dream_insight: (payload as any).dream_insight ?? null,
      qi_rhythm: (payload as any).qi_rhythm ?? (report as any).qi_rhythm ?? null,
      advice: (payload as any).advice ?? null,
    },
    // 保留顶层字段以兼容现有代码
    palm_insight: (payload as any).palm_insight ?? (report as any).palm_insight ?? null,
    palm_result: (payload as any).palm_result ?? (report as any).palm_result ?? null,
    body_tongue: (payload as any).body_tongue ?? null,
    constitution: (payload as any).constitution ?? null,
    dream_insight: (payload as any).dream_insight ?? null,
    qi_rhythm: (payload as any).qi_rhythm ?? (report as any).qi_rhythm ?? null,
    advice: (payload as any).advice ?? null,
  };
}

/**
 * 从 Supabase 读取报告
 */
async function fetchReportFromSupabase(reportId: string): Promise<AnalysisV2Result | null> {
  let client;
  try {
    client = getSupabaseAdminClient();
    console.log(`[reportStore] Supabase admin client created for fetch`);
  } catch (error) {
    console.error("[reportStore] Failed to create Supabase admin client for fetch:", error);
    console.error("[reportStore] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      reportId,
    });
    return null;
  }

  if (!client) {
    console.error("[reportStore] Supabase client is null after creation");
    return null;
  }

  try {
    console.log(`[reportStore] Querying Supabase report_v2 table for reportId: ${reportId}`);
    console.log(`[reportStore] Using Supabase client:`, {
      url: client.supabaseUrl,
      hasServiceRole: !!getSupabaseServiceRoleKey(),
    });
    const { data, error } = await client
      .from("report_v2")
      .select("normalized, id, created_at, palm_insight, palm_result, body_tongue, constitution, dream_insight, qi_rhythm, advice, raw_data, raw_features, image_urls, locale")
      .eq("id", reportId)
      .maybeSingle();
    
    console.log(`[reportStore] Query result:`, {
      reportId,
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code,
    });

    if (error) {
      console.error("[reportStore] Supabase query failed:", error);
      console.error("[reportStore] Query error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        reportId,
      });
      // 不抛出异常，返回 null
      return null;
    }

    if (!data) {
      console.log("[reportStore] No data returned from Supabase for reportId:", reportId);
      return null;
    }

    // 优先使用 normalized 字段，如果没有则从顶层字段构建
    let normalized = data.normalized;
    if (!normalized || typeof normalized !== "object") {
      console.warn("[reportStore] normalized field is missing or invalid, building from top-level fields");
      normalized = {
        palm_insight: data.palm_insight ?? null,
        palm_result: data.palm_result ?? null,
        body_tongue: data.body_tongue ?? null,
        constitution: data.constitution ?? null,
        dream_insight: data.dream_insight ?? null,
        qi_rhythm: data.qi_rhythm ?? null,
        advice: data.advice ?? null,
      };
    }

    // 构建响应格式
    const result: AnalysisV2Result = {
      id: data.id,
      created_at: data.created_at,
      normalized: {
        palm_insight: normalized.palm_insight ?? data.palm_insight ?? null,
        palm_result: normalized.palm_result ?? data.palm_result ?? null,
        body_tongue: normalized.body_tongue ?? data.body_tongue ?? null,
        constitution: normalized.constitution ?? data.constitution ?? null,
        dream_insight: normalized.dream_insight ?? data.dream_insight ?? null,
        qi_rhythm: normalized.qi_rhythm ?? data.qi_rhythm ?? null,
        advice: normalized.advice ?? data.advice ?? null,
      },
      // 保留顶层字段以兼容现有代码
      palm_insight: normalized.palm_insight ?? data.palm_insight ?? null,
      palm_result: normalized.palm_result ?? data.palm_result ?? null,
      body_tongue: normalized.body_tongue ?? data.body_tongue ?? null,
      constitution: normalized.constitution ?? data.constitution ?? null,
      dream_insight: normalized.dream_insight ?? data.dream_insight ?? null,
      qi_rhythm: normalized.qi_rhythm ?? data.qi_rhythm ?? null,
      advice: normalized.advice ?? data.advice ?? null,
      raw_data: data.raw_data ?? null,
      raw_features: data.raw_features ?? null,
      image_urls: data.image_urls ?? null,
      locale: data.locale ?? "zh",
    };
    
    console.log("[reportStore] Successfully built response from Supabase:", {
      reportId: result.id,
      hasNormalized: !!result.normalized,
      hasPalmInsight: !!result.normalized?.palm_insight,
      hasBodyTongue: !!result.normalized?.body_tongue,
      hasConstitution: !!result.normalized?.constitution,
    });
    return result;
  } catch (error) {
    // 捕获所有异常，不要抛出
    console.error("[reportStore] Exception in fetchReportFromSupabase:", error);
    console.error("[reportStore] Exception details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reportId,
    });
    return null;
  }
}

/**
 * 根据 reportId 获取报告
 * V2 版本只从 Supabase 读取（已废弃 tempReportStore）
 * 
 * @param reportId 报告 ID
 * @returns 报告数据，如果不存在则返回 null
 */
export async function getReportById(reportId: string): Promise<AnalysisV2Result | null> {
  console.log(`[reportStore] getReportById called with reportId: ${reportId}`);
  
  if (!reportId) {
    console.warn("[reportStore] Empty reportId provided");
    return null;
  }

  try {
    // V2 只从 Supabase 读取（不再使用 tempReportStore）
    console.log("[reportStore] Fetching from Supabase:", reportId);
    const supabaseEntry = await fetchReportFromSupabase(reportId);
    if (supabaseEntry) {
      console.log("[reportStore] Found in Supabase:", reportId, "has id:", !!supabaseEntry.id, "has normalized:", !!supabaseEntry.normalized);
      return supabaseEntry;
    } else {
      console.warn("[reportStore] Report not found in Supabase:", reportId);
      return null;
    }
  } catch (error) {
    // 捕获所有异常，不要抛出，返回 null 让调用者处理
    console.error("[reportStore] Error in getReportById:", error);
    console.error("[reportStore] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reportId,
    });
    return null;
  }
}

/**
 * 保存 V2 分析报告
 * 保存到临时存储和 Supabase（V2 必须写入数据库）
 * 
 * @param result 分析结果数据
 * @returns 报告 ID
 */
export async function saveReport(result: AnalysisV2Result): Promise<string> {
  const reportId = result.id || randomUUID();
  const createdAtIso = result.created_at || new Date().toISOString();
  const locale = result.locale || "zh";

  // 开头日志
  console.log("[reportStore] saveReport called with id:", reportId);
  console.log("[reportStore] saveReport input result:", {
    hasId: !!result.id,
    hasNormalized: !!result.normalized,
    hasPalmInsight: !!result.palm_insight,
    hasBodyTongue: !!result.body_tongue,
    hasConstitution: !!result.constitution,
    hasDreamInsight: !!result.dream_insight,
    hasQiRhythm: !!result.qi_rhythm,
    hasAdvice: !!result.advice,
    hasRawData: !!result.raw_data,
    hasRawFeatures: !!result.raw_features,
    hasImageUrls: !!result.image_urls,
  });

  // 确保 result 有 id
  const reportWithId = { ...result, id: reportId, created_at: createdAtIso };

  // 1. 保存到临时存储
  try {
    saveTemporaryReport({
      report: {
        id: reportId,
        constitution: result.constitution?.name || result.constitution?.type || null,
        palm_result: result.palm_result || result.normalized?.palm_result || null,
        tongue_result: null, // V2 不使用 tongue_result
        dream: result.dream_insight || null,
        advice: result.advice || { diet: [], lifestyle: [], exercise: [], acupoints: [] },
        solar_term: null,
        quote: null,
        created_at: createdAtIso,
        unlocked: true,
        locale: locale as "zh" | "en",
        qi_index: null,
        matched_rules: [],
        // 保存 V2 格式数据
        v2_data: reportWithId,
        image_urls: result.image_urls || null,
      } as any,
      constitution_detail: undefined,
    });
    console.log(`[reportStore] Saved report to temp store: ${reportId}`);
  } catch (saveError) {
    console.error(`[reportStore] Failed to save to temp store:`, saveError);
    throw saveError;
  }

  // 2. 强制保存到 Supabase（V2 必须写入数据库）
  console.log(`[reportStore] Attempting to save report to Supabase: ${reportId}`);
  let client;
  try {
    client = getSupabaseAdminClient();
    console.log(`[reportStore] Supabase admin client created successfully`);
  } catch (error) {
    console.error("[reportStore] Failed to create Supabase admin client:", error);
    console.error("[reportStore] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // V2 必须写入数据库，如果无法创建客户端，抛出错误
    throw new Error(`Failed to create Supabase admin client: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!client) {
    console.error("[reportStore] Supabase client is null after creation");
    throw new Error("Supabase admin client is null");
  }

  try {
    // 确保字段名与数据库完全一致（蛇形命名），所有 undefined 变成 null
    // 数据库字段结构：
    // id uuid, created_at timestamptz, user_id uuid (可选), locale text
    // palm_result jsonb, palm_insight jsonb, body_tongue jsonb, constitution jsonb
    // dream_insight jsonb, qi_rhythm jsonb, advice jsonb
    // normalized jsonb NOT NULL (必须有值)
    // raw_data jsonb (可选), raw_features jsonb, image_urls jsonb
    
    // 验证 user_id 是否为有效的 UUID 格式
    // 如果不是有效的 UUID（例如测试账户的 base64 编码 ID），则设置为 null
    let userId: string | null = (result as any).user_id ?? null;
    if (userId) {
      // UUID 格式验证：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.warn(`[reportStore] Invalid UUID format for user_id: ${userId}, setting to null`);
        userId = null;
      }
    }
    
    const insertData: Record<string, any> = {
      id: reportId,
      created_at: createdAtIso,
      // user_id：只接受有效的 UUID 格式，否则为 null（支持匿名用户和测试账户）
      user_id: userId,
      locale: result.locale ?? "zh",
      // 顶层字段（从 normalized 或顶层获取）
      palm_result: result.normalized?.palm_result ?? result.palm_result ?? null,
      palm_insight: result.normalized?.palm_insight ?? result.palm_insight ?? null,
      body_tongue: result.normalized?.body_tongue ?? result.body_tongue ?? null,
      constitution: result.normalized?.constitution ?? result.constitution ?? null,
      dream_insight: result.normalized?.dream_insight ?? result.dream_insight ?? null,
      qi_rhythm: result.normalized?.qi_rhythm ?? result.qi_rhythm ?? null,
      advice: result.normalized?.advice ?? result.advice ?? null,
      // normalized 字段是 NOT NULL，必须提供（至少是空对象）
      normalized: result.normalized ?? {},
      // raw_data 和 raw_features（蛇形命名）
      raw_data: result.raw_data ?? null,
      raw_features: result.raw_features ?? null,
      // image_urls（蛇形命名）
      image_urls: result.image_urls ?? null,
    };
    
    // 确保所有 undefined 值都变成 null（Supabase 不接受 undefined）
    Object.keys(insertData).forEach((key) => {
      if (insertData[key] === undefined) {
        insertData[key] = null;
      }
    });
    
    // 确保 normalized 字段不是 null（数据库约束 NOT NULL）
    if (!insertData.normalized || typeof insertData.normalized !== 'object') {
      insertData.normalized = {};
    }
    
    // 输出插入前的完整 payload
    console.log("[reportStore] Supabase insert payload:", JSON.stringify(insertData, null, 2));

    // 执行插入操作（使用 upsert，如果 id 已存在则更新）
    const { data, error: supabaseError } = await client
      .from("report_v2")
      .upsert(insertData, { onConflict: 'id' })
      .select("id")
      .single();

    if (supabaseError) {
      // 插入失败，输出完整错误信息
      console.error("[reportStore] Supabase insert error:", supabaseError);
      console.error("[reportStore] Supabase error details:", {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
        reportId,
      });
      console.error("[reportStore] Failed insertData:", JSON.stringify(insertData, null, 2));
      // V2 必须写入数据库，失败时抛出错误
      throw new Error(`Failed to save report to Supabase: ${supabaseError.message} (code: ${supabaseError.code}, details: ${supabaseError.details || 'N/A'}, hint: ${supabaseError.hint || 'N/A'})`);
    } else {
      // 插入成功
      const savedId = data?.id || reportId;
      console.log(`[reportStore] Successfully saved report to Supabase: ${savedId}`, {
        returnedId: data?.id,
        dataReturned: !!data,
      });
      
      // 立即验证：尝试查询刚保存的报告
      const verifyQuery = await client
        .from("report_v2")
        .select("id")
        .eq("id", savedId)
        .maybeSingle();
      console.log(`[reportStore] Immediate verification query result:`, {
        reportId: savedId,
        found: !!verifyQuery.data,
        error: verifyQuery.error ? verifyQuery.error.message : null,
      });
      
      // 结尾日志
      console.log("[reportStore] saveReport completed successfully, id:", savedId);
      return savedId;
    }
  } catch (supabaseErr) {
    // 捕获所有异常，输出完整错误信息
    console.error("[reportStore] Supabase upsert exception:", supabaseErr);
    console.error("[reportStore] Exception details:", {
      message: supabaseErr instanceof Error ? supabaseErr.message : String(supabaseErr),
      stack: supabaseErr instanceof Error ? supabaseErr.stack : undefined,
      reportId,
    });
    // V2 必须写入数据库，失败时抛出错误
    throw supabaseErr;
  }
}

