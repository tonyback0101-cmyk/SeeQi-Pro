import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(email?: string | null) {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!allow.length) return false;
  return allow.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: pending, error } = await supabase
    .from("report_email_queue")
    .select("id, email_to, attempts, summary, share_link")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0 }, { status: 200 });
  }

  const ids = pending.map((item) => item.id);
  const now = new Date().toISOString();

  const { error: markProcessing } = await supabase
    .from("report_email_queue")
    .update({ status: "processing" })
    .in("id", ids);

  if (markProcessing) {
    return NextResponse.json({ error: markProcessing.message }, { status: 500 });
  }

  await Promise.all(
    pending.map((item) =>
      supabase
        .from("report_email_queue")
        .update({ attempts: (item.attempts ?? 0) + 1 })
        .eq("id", item.id)
    )
  );

  const { error: markSent } = await supabase
    .from("report_email_queue")
    .update({ status: "sent", processed_at: now, last_error: null })
    .in("id", ids);

  if (markSent) {
    return NextResponse.json({ error: markSent.message }, { status: 500 });
  }

  console.log("[report-email] processed", pending.length);

  return NextResponse.json({ processed: pending.length }, { status: 200 });
}
