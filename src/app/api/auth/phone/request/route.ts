import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRestrictedRegion, normalizeInternationalPhone } from "@/lib/auth/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneInput = typeof body.phone === "string" ? body.phone : "";

    const normalizedPhone = normalizeInternationalPhone(phoneInput);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "PHONE_INVALID" }, { status: 400 });
    }
    if (isRestrictedRegion(normalizedPhone)) {
      return NextResponse.json({ error: "PHONE_RESTRICTED" }, { status: 403 });
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.code ?? "OTP_SEND_FAILED", message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, phone: normalizedPhone });
  } catch (error) {
    return NextResponse.json({ error: "UNEXPECTED", message: (error as Error).message }, { status: 500 });
  }
}
