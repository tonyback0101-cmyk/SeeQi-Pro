import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

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

  const { error } = await supabase
    .from("assessment_records")
    .upsert(upsertPayload, { onConflict: "user_id,module_type" })
    .select("module_type");

  if (error) {
    console.warn("[POST /api/assessment/sync] upsert failed", error);
    return NextResponse.json(
      {
        success: true,
        synced: [],
        skipped: "supabase_error",
        message: error.message,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ success: true, synced: upsertPayload.map((item) => item.module_type) });
}
