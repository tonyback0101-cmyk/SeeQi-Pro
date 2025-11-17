import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getTemporaryReport } from "@/lib/tempReportStore";

export const runtime = "nodejs";

const SUPABASE_ANALYZE_ENABLED = process.env.ENABLE_SUPABASE_ANALYZE === "true";

async function fetchConstitutionDetail(
  client: ReturnType<typeof getSupabaseAdminClient>,
  constitution: string,
  locale: "zh" | "en",
) {
  const nameZh = constitution.endsWith("体质") ? constitution : `${constitution}体质`;
  const { data, error } = await client
    .from("dict_constitution")
    .select("name_zh,name_en,feature,advice_diet,advice_activity,advice_acupoint")
    .ilike("name_zh", nameZh)
    .maybeSingle();
  if (error) throw error;
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

function getAdviceCounts(advice: any | null | undefined) {
  return {
    diet: Array.isArray(advice?.diet) ? advice.diet.length : 0,
    lifestyle: Array.isArray(advice?.lifestyle) ? advice.lifestyle.length : 0,
    exercise: Array.isArray(advice?.exercise) ? advice.exercise.length : 0,
    acupoints: Array.isArray(advice?.acupoints) ? advice.acupoints.length : 0,
  };
}

function sanitizeAdvice(advice: any | null | undefined, unlocked: boolean) {
  if (!advice) {
    return null;
  }
  if (unlocked) {
    return advice;
  }
  const clone = JSON.parse(JSON.stringify(advice));
  for (const key of ["diet", "lifestyle", "exercise", "acupoints"]) {
    if (Array.isArray(clone[key])) {
      clone[key] = clone[key].slice(0, 1);
    }
  }
  return clone;
}

function sanitizeDream(dream: any | null | undefined, unlocked: boolean) {
  if (!dream) return null;
  if (unlocked) {
    return dream;
  }
  const summary = dream.summary ?? null;
  const tip = dream.tip ?? null;
  const mood = dream.mood ?? null;
  const category = dream.category ?? null;
  const tags = Array.isArray(dream.tags) ? dream.tags.slice(0, 3) : [];
  const keywords = Array.isArray(dream.keywords) ? dream.keywords.slice(0, 2) : [];
  return {
    summary,
    tip,
    mood,
    category,
    tags,
    keywords,
  };
}

function buildResponseFromLocal(entry: ReturnType<typeof getTemporaryReport>) {
  if (!entry) return null;
  const report = entry.report;
  const unlocked = Boolean(report.unlocked);
  const adviceCounts = getAdviceCounts(report.advice);
  const adviceForResponse = sanitizeAdvice(report.advice, unlocked);
  const qiIndex = report.qi_index ?? null;
  let qiIndexResponse = qiIndex;
  if (qiIndex && !unlocked) {
    const qi = qiIndex as { total?: number; level?: string; trend?: string; advice?: unknown[] };
    qiIndexResponse = {
      total: qi.total,
      level: qi.level,
      trend: qi.trend,
      advice: Array.isArray(qi.advice) ? qi.advice.slice(0, 1) : [],
    };
  }

  return {
    body: {
      id: report.id,
      constitution: report.constitution,
      palm_result: unlocked ? report.palm_result : null,
      tongue_result: unlocked ? report.tongue_result : null,
      dream: sanitizeDream(report.dream, unlocked),
      advice: adviceForResponse,
      advice_counts: adviceCounts,
      solar_term: report.solar_term,
      quote: report.quote,
      created_at: report.created_at,
      unlocked,
      locale: report.locale,
      constitution_detail: entry.constitution_detail ?? undefined,
      qi_index: qiIndexResponse,
      matched_rules: report.matched_rules ?? [],
      access: unlocked ? "full" : "lite",
    },
    init: {
      status: 200 as const,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  };
}

// 检查是否是有效的 UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const reportId = params.id;
  if (!reportId) {
    return NextResponse.json({ error: "报告 ID 缺失" }, { status: 400 });
  }

  const respondWithLocal = () => {
    const localEntry = buildResponseFromLocal(getTemporaryReport(reportId));
    if (!localEntry) {
      return NextResponse.json({ error: "报告不存在或已过期" }, { status: 404 });
    }
    return NextResponse.json(localEntry.body, localEntry.init);
  };

  // 如果 reportId 是 "local" 或不是有效的 UUID，直接使用临时存储
  if (reportId === "local" || !isValidUUID(reportId)) {
    console.log("[GET /api/result/:id] Invalid UUID or 'local' ID, using local storage:", reportId);
    return respondWithLocal();
  }

  try {
    if (!SUPABASE_ANALYZE_ENABLED) {
      console.log("[GET /api/result/:id] SUPABASE_ANALYZE_ENABLED is false, using local storage");
      return respondWithLocal();
    }
    console.log("[GET /api/result/:id] Querying report from Supabase:", reportId);
    
    let client;
    try {
      client = getSupabaseAdminClient();
    } catch (clientError) {
      console.error("[GET /api/result/:id] Failed to get Supabase client:", clientError);
      // 如果无法获取 Supabase client，回退到本地存储
      const localFallback = buildResponseFromLocal(getTemporaryReport(reportId));
      if (localFallback) {
        console.log("[GET /api/result/:id] Using temporary storage fallback (client unavailable)");
        return NextResponse.json(localFallback.body, localFallback.init);
      }
      return NextResponse.json({ error: "数据库连接失败，请稍后重试" }, { status: 500 });
    }
    
    const { data, error } = await client
      .from("reports")
      .select(
        "id,constitution,palm_result,tongue_result,dream,advice,solar_term,quote,created_at,unlocked,session_id,locale,qi_index,matched_rules",
      )
      .eq("id", reportId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/result/:id] Supabase query error:", error);
      throw error;
    }

    if (!data) {
      console.warn("[GET /api/result/:id] Report not found in database:", reportId);
      // 尝试从临时存储读取（作为 fallback）
      const localFallback = buildResponseFromLocal(getTemporaryReport(reportId));
      if (localFallback) {
        console.log("[GET /api/result/:id] Using temporary storage fallback");
        return NextResponse.json(localFallback.body, localFallback.init);
      }
      return NextResponse.json({ error: "报告不存在或已过期" }, { status: 404 });
    }
    
    console.log("[GET /api/result/:id] Report found:", data.id);

    let constitutionDetail = null;
    try {
      constitutionDetail = await fetchConstitutionDetail(client, data.constitution ?? "平和", data.locale ?? "zh");
    } catch (constitutionError) {
      console.warn("[GET /api/result/:id] Failed to fetch constitution detail:", constitutionError);
      // 继续处理，constitutionDetail 为 null
    }
    const adviceCounts = getAdviceCounts(data.advice);
    const adviceForResponse = sanitizeAdvice(data.advice, Boolean(data.unlocked));

    const qiIndex = data.qi_index ?? null;
    let qiIndexResponse = qiIndex;
    if (qiIndex && !data.unlocked) {
      qiIndexResponse = {
        total: qiIndex.total,
        level: qiIndex.level,
        trend: qiIndex.trend,
        advice: Array.isArray(qiIndex.advice) ? qiIndex.advice.slice(0, 1) : [],
      };
    }

    return NextResponse.json(
      {
        id: data.id,
        constitution: data.constitution,
        palm_result: data.unlocked ? data.palm_result : null,
        tongue_result: data.unlocked ? data.tongue_result : null,
        dream: sanitizeDream(data.dream, Boolean(data.unlocked)),
        advice: adviceForResponse,
        advice_counts: adviceCounts,
        solar_term: data.solar_term,
        quote: data.quote,
        created_at: data.created_at,
        unlocked: data.unlocked,
        locale: data.locale,
        constitution_detail: constitutionDetail ?? undefined,
        qi_index: qiIndexResponse,
        matched_rules: data.matched_rules ?? [],
        access: data.unlocked ? "full" : "lite",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/result/:id]", error);
    if (!SUPABASE_ANALYZE_ENABLED) {
      return respondWithLocal();
    }
    const localFallback = buildResponseFromLocal(getTemporaryReport(reportId));
    if (localFallback) {
      return NextResponse.json(localFallback.body, localFallback.init);
    }
    return NextResponse.json({ error: "查询报告时出错" }, { status: 500 });
  }
}

