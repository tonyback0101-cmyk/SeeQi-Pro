/**
 * V2 路由路径生成函数
 * 统一管理所有 V2 页面路由，避免硬编码
 */

export type Locale = "zh" | "en";

/**
 * 构建 V2 分析页面路径
 * @param locale 语言代码
 * @returns 路径字符串，如 "/zh/v2/analyze"
 */
export function buildV2AnalyzePage(locale: Locale): string {
  return `/${locale}/v2/analyze`;
}

/**
 * 构建 V2 分析结果页面路径
 * @param locale 语言代码
 * @param reportId 报告 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/analysis-result?reportId=xxx"
 */
export function buildV2ResultPage(locale: Locale, reportId?: string | null): string {
  const basePath = `/${locale}/v2/analysis-result`;
  if (reportId) {
    return `${basePath}?reportId=${encodeURIComponent(reportId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 掌纹报告页面路径
 * @param locale 语言代码
 * @param reportId 报告 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/reports/palm?reportId=xxx"
 */
export function buildV2PalmReportPage(locale: Locale, reportId?: string | null): string {
  const basePath = `/${locale}/v2/reports/palm`;
  if (reportId) {
    return `${basePath}?reportId=${encodeURIComponent(reportId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 舌苔报告页面路径
 * @param locale 语言代码
 * @param reportId 报告 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/reports/tongue?reportId=xxx"
 */
export function buildV2TongueReportPage(locale: Locale, reportId?: string | null): string {
  const basePath = `/${locale}/v2/reports/tongue`;
  if (reportId) {
    return `${basePath}?reportId=${encodeURIComponent(reportId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 梦境报告页面路径
 * @param locale 语言代码
 * @param reportId 报告 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/reports/dream?reportId=xxx"
 */
export function buildV2DreamReportPage(locale: Locale, reportId?: string | null): string {
  const basePath = `/${locale}/v2/reports/dream`;
  if (reportId) {
    return `${basePath}?reportId=${encodeURIComponent(reportId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 气运报告页面路径
 * @param locale 语言代码
 * @param reportId 报告 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/reports/qi?reportId=xxx"
 */
export function buildV2QiReportPage(locale: Locale, reportId?: string | null): string {
  const basePath = `/${locale}/v2/reports/qi`;
  if (reportId) {
    return `${basePath}?reportId=${encodeURIComponent(reportId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 订阅页面路径
 * @param locale 语言代码
 * @returns 路径字符串，如 "/zh/v2/subscription"
 */
export function buildV2SubscriptionPage(locale: Locale): string {
  return `/${locale}/v2/subscription`;
}

/**
 * 构建 V2 订阅成功页面路径
 * @param locale 语言代码
 * @param sessionId 会话 ID（可选）
 * @returns 路径字符串，如 "/zh/v2/subscription/success?session_id=xxx"
 */
export function buildV2SubscriptionSuccessPage(locale: Locale, sessionId?: string | null): string {
  const basePath = `/${locale}/v2/subscription/success`;
  if (sessionId) {
    return `${basePath}?session_id=${encodeURIComponent(sessionId)}`;
  }
  return basePath;
}

/**
 * 构建 V2 Pro 页面路径
 * @param locale 语言代码
 * @param from 来源参数（可选）
 * @param additionalParams 额外查询参数（可选），如 { p: "palm", reportId: "xxx" }
 * @returns 路径字符串，如 "/zh/pro?from=v2-result&p=palm&reportId=xxx"
 */
export function buildV2ProPage(
  locale: Locale,
  from?: string | null,
  additionalParams?: Record<string, string | null | undefined>
): string {
  const basePath = `/${locale}/pro`;
  const params = new URLSearchParams();
  
  if (from) {
    params.append("from", from);
  }
  
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
  }
  
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * 构建登录页面路径
 * @param locale 语言代码
 * @param redirect 重定向 URL（可选）
 * @returns 路径字符串，如 "/zh/auth/sign-in?redirect=xxx"
 */
export function buildAuthSignInPage(locale: Locale, redirect?: string | null): string {
  const basePath = `/${locale}/auth/sign-in`;
  if (redirect) {
    return `${basePath}?redirect=${encodeURIComponent(redirect)}`;
  }
  return basePath;
}

/**
 * 构建首页路径
 * @param locale 语言代码
 * @returns 路径字符串，如 "/zh"
 */
export function buildHomePage(locale: Locale): string {
  return `/${locale}`;
}

