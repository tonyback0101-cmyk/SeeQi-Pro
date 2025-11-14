import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(email?: string | null) {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!allowList.length) return false;
  return allowList.includes(email.toLowerCase());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const map: Record<string, unknown> = {};
  (data ?? []).forEach((row) => {
    map[row.key] = row.value;
  });

  return NextResponse.json({ settings: map }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const key = typeof payload?.key === "string" ? payload.key : null;
  const value = payload?.value;

  if (!key) {
    return NextResponse.json({ error: "缺少 key" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key,
      value: value ?? {},
      updated_by: session?.user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}






