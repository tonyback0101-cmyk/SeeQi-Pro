import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { fetchAffiliateDashboard } from "@/lib/server/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const data = await fetchAffiliateDashboard(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取数据失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
