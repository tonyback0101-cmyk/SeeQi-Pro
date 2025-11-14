import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizePhone(raw: string): string {
  return raw.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === "string" ? normalizePhone(body.phone) : "";
    const locale = body?.locale === "zh" ? "zh" : "en";

    if (!phone) {
      return NextResponse.json({ error: "请提供手机号" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
        data: {
          locale,
          source: "seeqi-pwa",
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送验证码失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
