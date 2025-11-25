import { NextResponse } from "next/server";
import { getReportById } from "@/lib/analysis/v2/reportStore";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> | { reportId: string } }
) {
  // Next.js 15+ 使用 Promise，旧版本直接是对象
  const resolvedParams = params instanceof Promise ? await params : params;
  const { reportId } = resolvedParams;
  
  // 步骤1：在函数一开始加入日志，确认收到的 reportId
  console.log("[V2 RESULT] reportId:", reportId);
  console.log("[V2 RESULT] reportId length:", reportId?.length);
  console.log("[V2 RESULT] full params:", resolvedParams);

  if (!reportId) {
    console.warn("[V2 RESULT] Missing reportId");
    return NextResponse.json(
      { ok: false, code: "MISSING_ID", message: "reportId is required" },
      { status: 400 }
    );
  }

  // 步骤3：用 try/catch 包住整个处理逻辑，防止直接抛异常
  try {
    console.log(`[V2 RESULT] Calling getReportById for: ${reportId}`);
    const report = await getReportById(reportId);
    
    // 步骤4：查不到数据时返回 404，不要抛异常
    if (!report) {
      console.warn("[V2 RESULT] Report not found:", reportId);
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "Report not found" },
        { status: 404 }
      );
    }

    console.log("[V2 RESULT] Report found successfully:", {
      reportId,
      hasId: !!report.id,
      hasNormalized: !!report.normalized,
    });
    
    return NextResponse.json(
      { ok: true, data: report },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (error) {
    // 步骤3：捕获所有异常，返回 500 而不是直接抛错
    console.error("[V2 RESULT] error:", error);
    console.error("[V2 RESULT] error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reportId,
    });
    
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
