import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || "gpt-4o-mini",
        messages: body.messages,
        temperature: body.temperature ?? 1,
        max_tokens: body.max_tokens ?? 600,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[LLM Proxy Error]", err);
      return NextResponse.json(
        { error: "llm_proxy_failed", message: err },
        { status: 500 },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[LLM Proxy Crash]", err);
    return NextResponse.json(
      { error: "llm_proxy_failed", message: err.message },
      { status: 500 },
    );
  }
}
