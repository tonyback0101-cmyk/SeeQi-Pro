import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "dream.samples",
  "collection.guides",
  "share.templates",
  "analysis.overrides",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawKeys = searchParams.get("keys");
  const keys = rawKeys
    ? rawKeys
        .split(",")
        .map((key) => key.trim())
        .filter((key) => key.length > 0 && ALLOWED_KEYS.has(key))
    : [];

  if (!keys.length) {
    return NextResponse.json({ settings: {} }, { status: 200 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const map: Record<string, unknown> = {};
  (data ?? []).forEach((row) => {
    map[row.key] = row.value;
  });

  return NextResponse.json({ settings: map }, { status: 200 });
}






