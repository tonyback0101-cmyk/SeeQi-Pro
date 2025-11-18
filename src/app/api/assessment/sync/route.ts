import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { canUseInDatabase } from "@/lib/auth/testAccount";
import type { AssessmentModule, ModuleStatus } from "@/types/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_MODULES = new Set(["palm", "tongue", "dream", "fengshui", "iching"]);

type SyncPayload = {
  statuses?: Record<string, string>;
  data?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SyncPayload | null;
  if (!body) {
    return NextResponse.json({ error: "缺少同步数据" }, { status: 400 });
  }

  let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    console.warn("[POST /api/assessment/sync] Supabase unavailable, skip sync", error);
  }
  const userId = session.user.id;
  
  // 检查是否是测试账号，如果是则跳过数据库操作
  if (!canUseInDatabase(userId)) {
    console.log("[POST /api/assessment/sync] Test account detected, skipping database sync:", userId);
    return NextResponse.json({
      success: true,
      synced: [],
      skipped: "test_account",
      message: "测试账号跳过数据库同步",
    });
  }
  
  const rows: Array<{ module: string; status: string; payload: Record<string, unknown> }> = [];

  if (body.statuses) {
    for (const [module, status] of Object.entries(body.statuses)) {
      if (!SUPPORTED_MODULES.has(module)) continue;
      rows.push({
        module,
        status: typeof status === "string" ? status : "not_started",
        payload: (body.data?.[module] as Record<string, unknown>) ?? {},
      });
    }
  }

  if (!rows.length && body.data) {
    for (const [module, payload] of Object.entries(body.data)) {
      if (!SUPPORTED_MODULES.has(module)) continue;
      rows.push({ module, status: "completed", payload: (payload as Record<string, unknown>) ?? {} });
    }
  }

  if (!rows.length) {
    return NextResponse.json({ success: true, synced: [] });
  }

  const upsertPayload = rows.map((row) => ({
    user_id: userId,
    module_type: row.module, // 使用 module_type 匹配表结构
    status: row.status,
    data: row.payload, // 使用 data 匹配表结构
  }));

  if (!supabase) {
    return NextResponse.json({
      success: true,
      synced: upsertPayload.map((item) => item.module_type),
      skipped: "supabase_disabled",
    });
  }

  const { error, data } = await supabase
    .from("assessment_records")
    .upsert(upsertPayload, { onConflict: "user_id,module_type" })
    .select("module_type");

  if (error) {
    // 记录完整的错误信息，包括代码、详细信息、提示等
    console.error("[POST /api/assessment/sync] 更新插入失败", {
      代码: error.code,
      详细信息: error.details,
      提示: error.hint,
      消息: error.message,
      完整错误: error,
      尝试插入的数据: upsertPayload,
    });
    return NextResponse.json(
      {
        success: true,
        synced: [],
        skipped: "supabase_error",
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ success: true, synced: upsertPayload.map((item) => item.module_type) });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    console.warn("[GET /api/assessment/sync] Supabase unavailable", error);
  }

  const userId = session.user.id;

  if (!canUseInDatabase(userId)) {
    return NextResponse.json({
      success: true,
      statuses: {},
      data: {},
      skipped: "test_account",
    });
  }

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        error: "supabase_unavailable",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const modulesParam = url.searchParams.get("modules");
  let modulesFilter: AssessmentModule[] | null = null;
  if (modulesParam) {
    const parsed = modulesParam
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is AssessmentModule => SUPPORTED_MODULES.has(item));
    modulesFilter = parsed.length ? parsed : null;
  }

  let query = supabase.from("assessment_records").select("module_type,status,data").eq("user_id", userId);
  if (modulesFilter) {
    query = query.in("module_type", modulesFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[GET /api/assessment/sync] 查询失败", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 },
    );
  }

  const statuses: Record<string, ModuleStatus> = {};
  const payload: Record<string, unknown> = {};

  for (const row of data ?? []) {
    if (!SUPPORTED_MODULES.has(row.module_type as AssessmentModule)) continue;
    const moduleKey = row.module_type as AssessmentModule;
    statuses[moduleKey] = (row.status as ModuleStatus | null) ?? "not_started";
    if (row.data && Object.keys(row.data).length) {
      payload[moduleKey] = row.data;
    }
  }

  return NextResponse.json({
    success: true,
    statuses,
    data: payload,
  });
}
