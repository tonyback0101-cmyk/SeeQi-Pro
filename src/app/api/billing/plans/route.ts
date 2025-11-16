import { NextResponse } from "next/server";
import { getAvailableProPlans } from "@/lib/proPlans";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = await getAvailableProPlans();
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("billing/plans", error);
    return NextResponse.json({ error: "无法获取订阅方案，请稍后再试。" }, { status: 500 });
  }
}







