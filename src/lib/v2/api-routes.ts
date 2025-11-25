/**
 * V2 API 路径生成函数
 * 统一管理所有 V2 API 路径，避免硬编码
 */

/**
 * 构建 V2 结果 API 路径
 * @param reportId 报告 ID
 * @returns API 路径字符串，如 "/api/v2/result/xxx-xxx-xxx"
 */
export function buildV2ResultApi(reportId: string): string {
  if (!reportId) {
    console.error("[buildV2ResultApi] Empty reportId provided");
    return "/api/v2/result/";
  }
  // 确保 reportId 被正确编码（虽然 UUID 通常不需要编码，但为了安全起见）
  const encodedReportId = encodeURIComponent(reportId);
  const apiPath = `/api/v2/result/${encodedReportId}`;
  console.log(`[buildV2ResultApi] Built API path: ${apiPath} for reportId: ${reportId}`);
  return apiPath;
}

/**
 * 构建 V2 分析 API 路径
 * @returns API 路径字符串，如 "/api/v2/analyze"
 */
export function buildV2AnalyzeApi(): string {
  return "/api/v2/analyze";
}

