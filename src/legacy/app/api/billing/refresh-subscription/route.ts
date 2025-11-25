import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getLatestSubscriptionStatus } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const status = await getLatestSubscriptionStatus(session.user.id);
    return NextResponse.json({ subscription: status }, { status: 200 });
  } catch (error) {
    console.error("refresh-subscription:error", error);
    return NextResponse.json({ error: "获取订阅状态失败" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getLatestSubscriptionStatus } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const status = await getLatestSubscriptionStatus(session.user.id);
    return NextResponse.json({ subscription: status }, { status: 200 });
  } catch (error) {
    console.error("refresh-subscription:error", error);
    return NextResponse.json({ error: "获取订阅状态失败" }, { status: 500 });
  }
}

