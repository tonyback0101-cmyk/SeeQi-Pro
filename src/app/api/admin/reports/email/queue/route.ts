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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("report_email_queue")
    .select("id, email_to, status, attempts, created_at, processed_at, last_error, summary")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ queue: data ?? [] }, { status: 200 });
}






