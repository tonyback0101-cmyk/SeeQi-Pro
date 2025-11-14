import { NextResponse } from "next/server";
import { analyzeDreamText } from "@/lib/analysis/dreamFeatures";

export const runtime = "nodejs";

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dreamText = body?.dream_text?.toString?.();
    if (!dreamText || dreamText.trim().length === 0) {
      return errorResponse("梦境内容不能为空");
    }
    if (dreamText.length > 300) {
      return errorResponse("梦境内容需在 300 字以内");
    }

    const locale = body?.locale === "en" ? "en" : "zh";
    const emotion = body?.emotion?.toString?.() ?? "unknown";
    const analysis = await analyzeDreamText({ text: dreamText, locale, emotion });

    return NextResponse.json(
      {
        success: true,
        ...analysis,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/dream/analyze]", error);
    return errorResponse("解析梦境时出现错误", 500);
  }
}

