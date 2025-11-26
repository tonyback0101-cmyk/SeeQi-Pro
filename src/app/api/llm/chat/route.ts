import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.PENAI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "12000", 10); // 默认 12 秒（10-15 秒范围）

export const runtime = "edge";

/**
 * 创建带超时的 fetch 请求
 * Edge Runtime 支持 AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`LLM request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[LLM] proxy error: Missing OPENAI_API_KEY");
    return NextResponse.json(
      { error: "llm_proxy_failed", message: "LLM service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const startTime = Date.now();

    const res = await fetchWithTimeout(
      `${BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
      LLM_TIMEOUT_MS
    );

    const duration = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[LLM] proxy error", {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
        duration,
      });
      return NextResponse.json(
        { error: "llm_proxy_failed", message: "LLM API request failed" },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log("[LLM] proxy success", {
      duration,
      model: body.model || "unknown",
      usage: data.usage,
    });
    return NextResponse.json(data);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = errorMessage.includes("timeout");
    
    console.error("[LLM] proxy error", {
      error: errorMessage,
      isTimeout,
      timeoutMs: LLM_TIMEOUT_MS,
    });
    
    return NextResponse.json(
      {
        error: "llm_proxy_failed",
        message: isTimeout
          ? `LLM request timeout after ${LLM_TIMEOUT_MS}ms`
          : "LLM service error",
      },
      { status: 500 }
    );
  }
}


