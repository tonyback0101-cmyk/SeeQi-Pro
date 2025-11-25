import { NextResponse } from "next/server";
import { getAvailableProPlans } from "@/lib/billing/plans";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = getAvailableProPlans();
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/v2/subscription/plans]", error);
    return NextResponse.json(
      { error: "无法获取订阅方案，请稍后再试。" },
      { status: 500 }
    );
  }
}

