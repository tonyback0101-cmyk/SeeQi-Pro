import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getReportById } from "@/lib/analysis/v2/reportStore";
import { computeV2Access } from "@/lib/access/v2Access";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import V2AnalysisResultClient from "./V2AnalysisResultClient";
import { redirect } from "next/navigation";

type Locale = "zh" | "en";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ reportId?: string; success?: string; canceled?: string; intent?: string; session_id?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === "zh";
  return {
    title: isZh ? "综合测评报告" : "Comprehensive Report",
    description: isZh
      ? "基于掌纹、舌象、体质、梦境与气运的综合分析报告"
      : "Comprehensive analysis report based on palmistry, tongue diagnosis, constitution, dreams, and qi rhythm",
  };
}

export default async function V2AnalysisResultPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = localeParam === "en" ? "en" : "zh";
  const resolvedSearchParams = await searchParams;
  const { reportId, success, session_id } = resolvedSearchParams;

  if (!reportId) {
    // 如果没有 reportId，重定向到首页或显示错误
    redirect(`/${locale}/v2/analyze`);
  }

  console.log("[V2AnalysisResultPage] URL params:", { reportId, success, session_id });

  // Server 端获取 report 和 session
  const session = await getServerSession(authOptions).catch(() => null);
  let userId = session?.user?.id ?? null;

  if (userId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn("[V2AnalysisResultPage] Invalid user id, treating as anonymous", { userId });
      userId = null;
    }
  }

  // 获取 report（来自 report_v2）
  let report = null;
  try {
    report = await getReportById(reportId);
    if (!report) {
      redirect(`/${locale}/v2/analyze`);
    }
  } catch (error) {
    console.error("[V2AnalysisResultPage] Failed to get report:", error);
    redirect(`/${locale}/v2/analyze`);
  }

  // 如果支付成功（success=1），立即检查 Stripe session 状态并更新订单
  if (success === "1" && session_id) {
    const sessionId = session_id;
    console.log(`[V2AnalysisResultPage] Payment success detected, sessionId: ${sessionId}, userId: ${userId}, reportId: ${reportId}`);
    
    if (sessionId && userId && reportId) {
      try {
        const { getStripeClient } = await import("@/lib/stripe");
        const stripe = getStripeClient();
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log(`[V2AnalysisResultPage] Checkout session status:`, {
          payment_status: checkoutSession.payment_status,
          status: checkoutSession.status,
          metadata: checkoutSession.metadata,
          mode: checkoutSession.mode,
        });
        
        if (checkoutSession.payment_status === "paid" || checkoutSession.status === "complete") {
          // 支付成功，立即更新订单状态和创建 report_access（不等待 webhook）
          const supabase = getSupabaseAdminClient();
          
          // 检查订单是否存在
          const { data: order } = await supabase
            .from("orders")
            .select("id, status, kind, report_id")
            .eq("stripe_checkout_session_id", sessionId)
            .maybeSingle();
          
          console.log(`[V2AnalysisResultPage] Order lookup result:`, order);
          
          // 判断是否为单次购买：优先检查 metadata，其次检查 checkout mode 和 report_id，最后检查订单
          const metadataMode = checkoutSession.metadata?.mode;
          const checkoutMode = checkoutSession.mode; // 'payment' | 'subscription'
          const metadataReportId = checkoutSession.metadata?.report_id;
          
          // 判断逻辑（按优先级）：
          // 1. metadata.mode === "single" (最可靠，直接来自 checkout 接口)
          // 2. checkout.mode === "payment" 且 metadata.report_id 存在 (单次支付且有报告ID)
          // 3. metadata.report_id === reportId (有报告ID且匹配当前报告)
          // 4. order.kind === "single" (如果订单存在)
          const isSinglePurchase = 
            metadataMode === "single" || 
            (checkoutMode === "payment" && metadataReportId) ||
            (metadataReportId && metadataReportId === reportId) ||
            order?.kind === "single";
          
          console.log(`[V2AnalysisResultPage] Is single purchase: ${isSinglePurchase}`, {
            metadata_mode: metadataMode,
            checkout_mode: checkoutMode,
            order_kind: order?.kind,
            metadata_report_id: metadataReportId,
            current_reportId: reportId,
            match: metadataReportId === reportId,
            reason: metadataMode === "single" ? "metadata.mode === 'single'" :
                   (checkoutMode === "payment" && metadataReportId) ? "checkout.mode === 'payment' && has report_id" :
                   (metadataReportId && metadataReportId === reportId) ? "metadata.report_id matches" :
                   order?.kind === "single" ? "order.kind === 'single'" : "none",
          });
          
          // 如果是单次购买，创建 report_access 记录
          if (isSinglePurchase && reportId) {
            let accessError: any = null;
            let accessCreated = false;
            
            // 先检查是否已存在
            const { data: existingAccess } = await supabase
              .from("report_access")
              .select("id")
              .eq("user_id", userId)
              .eq("report_id", reportId)
              .maybeSingle();
            
            if (existingAccess) {
              // 已存在，更新 tier
              const { error: updateError } = await supabase
                .from("report_access")
                .update({ tier: "full" })
                .eq("user_id", userId)
                .eq("report_id", reportId);
              
              if (updateError) {
                console.error("[V2AnalysisResultPage] Failed to update report_access:", updateError);
                accessError = updateError;
              } else {
                console.log(`[V2AnalysisResultPage] Updated report_access for user ${userId}, report ${reportId}`);
                accessCreated = true;
              }
            } else {
              // 不存在，插入新记录
              const { error: insertError, data: insertData } = await supabase
                .from("report_access")
                .insert({
                  user_id: userId,
                  report_id: reportId,
                  tier: "full",
                })
                .select();
              
              if (insertError) {
                console.error("[V2AnalysisResultPage] Failed to create report_access:", insertError);
                accessError = insertError;
              } else {
                console.log(`[V2AnalysisResultPage] Created report_access for user ${userId}, report ${reportId}`, insertData);
                accessCreated = true;
              }
            }
            
            // 无论创建成功与否，都重定向以刷新页面（webhook 会确保权限创建）
            // 如果创建失败，等待更长时间让 webhook 处理
            const waitTime = accessError ? 2000 : 1000;
            console.log(`[V2AnalysisResultPage] Waiting ${waitTime}ms before redirect (accessCreated: ${accessCreated}, hasError: ${!!accessError})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // 重定向前再次检查权限（给 webhook 时间处理）
            const { data: finalAccessCheck } = await supabase
              .from("report_access")
              .select("id")
              .eq("user_id", userId)
              .eq("report_id", reportId)
              .maybeSingle();
            
            if (finalAccessCheck) {
              console.log(`[V2AnalysisResultPage] report_access confirmed before redirect`);
            } else {
              console.log(`[V2AnalysisResultPage] report_access not found yet, webhook will handle it`);
            }
            
            const redirectUrl = `/${locale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}`;
            console.log(`[V2AnalysisResultPage] Redirecting to: ${redirectUrl}`);
            redirect(redirectUrl);
          } else if (!isSinglePurchase) {
            // 如果不是单次购买，可能是订阅，不需要创建 report_access（订阅用户通过 hasActiveSubscription 判断）
            console.log(`[V2AnalysisResultPage] Not a single purchase, skipping report_access creation`);
            // 即使是订阅，也重定向以刷新页面，让 computeV2Access 重新检查订阅状态
            await new Promise(resolve => setTimeout(resolve, 500));
            const redirectUrl = `/${locale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}`;
            console.log(`[V2AnalysisResultPage] Redirecting to refresh subscription status: ${redirectUrl}`);
            redirect(redirectUrl);
          }
          
          // 如果订单存在且状态不是 paid，更新订单状态
          if (order && order.status !== "paid") {
            const { error: updateError } = await supabase
              .from("orders")
              .update({ status: "paid", updated_at: new Date().toISOString() })
              .eq("id", order.id);
            
            if (updateError) {
              console.error("[V2AnalysisResultPage] Failed to update order status:", updateError);
            } else {
              console.log(`[V2AnalysisResultPage] Updated order ${order.id} to paid status`);
            }
          } else if (!order) {
            // 如果订单不存在，尝试创建订单（用于记录）
            // 注意：这里不强制创建，因为 webhook 会处理
            console.warn(`[V2AnalysisResultPage] Order not found for session ${sessionId}, webhook will handle it`);
          }
        }
      } catch (error) {
        console.error("[V2AnalysisResultPage] Failed to verify payment", error);
        // 不阻止流程继续，webhook 会处理
      }
    }
  }

  // 如果有 session_id（即使没有 success=1），也检查并处理支付成功
  // 因为用户可能直接通过 URL 访问，或者 success 参数丢失
  if (session_id && userId && reportId && success !== "1") {
    console.log(`[V2AnalysisResultPage] Session ID present but success=1 missing, verifying payment for sessionId: ${session_id}, userId: ${userId}, reportId: ${reportId}`);
    try {
      const { getStripeClient } = await import("@/lib/stripe");
      const stripe = getStripeClient();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      
      // 如果支付已完成，创建 report_access
      if ((checkoutSession.payment_status === "paid" || checkoutSession.status === "complete") && 
          (checkoutSession.metadata?.mode === "single" || checkoutSession.mode === "payment")) {
        const supabase = getSupabaseAdminClient();
        const metadataReportId = checkoutSession.metadata?.report_id;
        const isSinglePurchase = checkoutSession.metadata?.mode === "single" || 
                                 (checkoutSession.mode === "payment" && metadataReportId) ||
                                 (metadataReportId && metadataReportId === reportId);
        
        if (isSinglePurchase && reportId) {
          // 检查是否已存在
          const { data: existingAccess } = await supabase
            .from("report_access")
            .select("id")
            .eq("user_id", userId)
            .eq("report_id", reportId)
            .maybeSingle();
          
          if (!existingAccess) {
            // 不存在，插入新记录
            const { error: insertError } = await supabase
              .from("report_access")
              .insert({
                user_id: userId,
                report_id: reportId,
                tier: "full",
              });
            
            if (insertError) {
              console.error("[V2AnalysisResultPage] Failed to create report_access from session_id:", insertError);
            } else {
              console.log(`[V2AnalysisResultPage] Created report_access from session_id for user ${userId}, report ${reportId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("[V2AnalysisResultPage] Failed to verify payment from session_id:", error);
      // 不阻止流程继续
    }
  }

  // 计算 access（会查询 report_access 和 orders 表）
  // 如果 access 检查失败，但订单存在且已支付，强制创建 report_access 并重试
  let access = await computeV2Access({ userId, reportId });
  console.log(`[V2AnalysisResultPage] Access computed (first attempt):`, {
    level: access.level,
    hasFullAccess: access.hasFullAccess,
    isFree: access.isFree,
    userId,
    reportId,
  });
  
  // 如果仍然没有权限，但存在已支付的订单，强制创建 report_access
  if (!access.hasFullAccess && userId && reportId) {
    const supabase = getSupabaseAdminClient();
    const { data: paidOrder } = await supabase
      .from("orders")
      .select("id, status, kind, report_id")
      .eq("user_id", userId)
      .eq("report_id", reportId)
      .eq("status", "paid")
      .eq("kind", "single")
      .maybeSingle();
    
    if (paidOrder) {
      console.log(`[V2AnalysisResultPage] Found paid order but no access, creating report_access:`, paidOrder);
      // 检查是否已存在
      const { data: existingAccess } = await supabase
        .from("report_access")
        .select("id")
        .eq("user_id", userId)
        .eq("report_id", reportId)
        .maybeSingle();
      
      if (!existingAccess) {
        const { error: insertError } = await supabase
          .from("report_access")
          .insert({
            user_id: userId,
            report_id: reportId,
            tier: "full",
          });
        
        if (insertError) {
          console.error("[V2AnalysisResultPage] Failed to create report_access from paid order:", insertError);
        } else {
          console.log(`[V2AnalysisResultPage] Created report_access from paid order for user ${userId}, report ${reportId}`);
          // 重新计算 access
          access = await computeV2Access({ userId, reportId });
          console.log(`[V2AnalysisResultPage] Access recomputed after creating report_access:`, {
            level: access.level,
            hasFullAccess: access.hasFullAccess,
            isFree: access.isFree,
          });
        }
      } else {
        // 已存在但 computeV2Access 没查到，可能是查询问题，直接设置为有权限
        console.log(`[V2AnalysisResultPage] report_access exists but computeV2Access didn't find it, forcing full access`);
        access = { level: "single_paid", isFree: false, hasFullAccess: true };
      }
    }
  }

  // 获取 user 信息（从 user_profiles 表读取 is_pro）
  let user: { is_pro?: boolean } | null = null;
  if (userId) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("is_pro")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data) {
        user = { is_pro: Boolean(data.is_pro) };
      }
    } catch (error) {
      console.error("[V2AnalysisResultPage] Failed to get user profile:", error);
    }
  }

  // 根据 access.hasFullAccess 决定展示完整版还是预览版
  const enrichedReport = injectFiveAspectContent(report, locale, access.hasFullAccess);
  
  console.log(`[V2AnalysisResultPage] Report enriched with access:`, {
    hasFullAccess: access.hasFullAccess,
    reportId,
  });

  return (
    <V2AnalysisResultClient
      locale={locale}
      report={enrichedReport}
      access={access}
      userId={userId}
      isLoggedIn={!!session}
      user={user}
    />
  );
}

type LunarMeta = {
  term?: string | null;
  ganzhi_day?: string | null;
  yi?: string[] | null;
  ji?: string[] | null;
  lucky_hours?: string[] | null;
  unlucky_hours?: string[] | null;
};

function injectFiveAspectContent(report: any, locale: Locale, hasFullAccess: boolean) {
  if (!report) return report;
  const normalized = report.normalized ?? {};
  const palmSummary: string = normalized.palm_summary ?? (report as any)?.palm_summary ?? normalized?.palm_insight?.palm_overview_summary ?? "";
  const tongueSummary: string = normalized.tongue_summary ?? (report as any)?.tongue_summary ?? normalized?.body_tongue?.summary ?? "";
  const dreamSummary: string = normalized.dream_summary ?? (report as any)?.dream_summary ?? normalized?.dream_insight?.llm?.symbolic ?? "";
  const lunar: LunarMeta =
    normalized.lunar ??
    (report as any)?.lunar ?? {
      term: normalized?.qi_rhythm?.calendar?.solarTerm ?? null,
      ganzhi_day: normalized?.qi_rhythm?.calendar?.dayGanzhi ?? null,
      yi: normalized?.qi_rhythm?.calendar?.yi ?? null,
      ji: normalized?.qi_rhythm?.calendar?.ji ?? null,
      lucky_hours: normalized?.qi_rhythm?.calendar?.lucky_hours ?? null,
      unlucky_hours: normalized?.qi_rhythm?.calendar?.unlucky_hours ?? null,
    };

  // 预览版：简洁但高级的摘要，增加付费动机
  const previewOverall = hasFullAccess
    ? null // 完整版不显示预览，直接显示完整内容
    : (locale === "zh" 
        ? "今日五象呈现微妙变化，完整版将揭示象局本质、行动力节奏、财气流向与心念关隘，并提供精准破局方案。"
        : "Today's five aspects show subtle changes. Full version reveals the essence pattern, action rhythm, wealth flow, mental thresholds, and precise breakthrough strategies.");
  
  // 完整版：深度内容，不与预览重复
  const fullOverall = hasFullAccess
    ? buildFullNarrative({
        locale,
        palmSummary,
        tongueSummary,
        dreamSummary,
        lunar,
      })
    : previewOverall;

  const palmSentences = splitIntoSentences(palmSummary, locale);
  const palmInsight = normalized?.palm_insight ?? (report as any)?.palm_insight ?? null;
  
  // 提取掌象相关字段（四条主线）
  const lifeXiang = palmInsight?.life_rhythm || palmSentences[0] || (locale === "zh" ? "稳中求进" : "steady progress");
  const wisdomXiang = palmInsight?.thought_style || palmSentences[1] || (locale === "zh" ? "思维清晰" : "clear thinking");
  const emotionXiang = palmInsight?.emotion_pattern || palmSentences[2] || (locale === "zh" ? "情绪波动" : "emotional fluctuation");
  const wealthXiang = (palmInsight as any)?.wealth || palmSentences[3] || (locale === "zh" ? "财气稳定" : "stable wealth");
  
  // 从财富描述中判断四象状态（聚/泄/稳/动）
  const wealthXiangText = String(wealthXiang);
  let wealthState = (locale === "zh" ? "稳" : "stable"); // 默认值
  if (locale === "zh") {
    if (wealthXiangText.includes("聚") || wealthXiangText.includes("收") || wealthXiangText.includes("积")) {
      wealthState = "聚";
    } else if (wealthXiangText.includes("泄") || wealthXiangText.includes("散") || wealthXiangText.includes("失")) {
      wealthState = "泄";
    } else if (wealthXiangText.includes("动") || wealthXiangText.includes("变") || wealthXiangText.includes("转")) {
      wealthState = "动";
    } else {
      wealthState = "稳";
    }
  } else {
    if (wealthXiangText.includes("gather") || wealthXiangText.includes("accumulate")) {
      wealthState = "gather";
    } else if (wealthXiangText.includes("disperse") || wealthXiangText.includes("leak")) {
      wealthState = "disperse";
    } else if (wealthXiangText.includes("move") || wealthXiangText.includes("change")) {
      wealthState = "move";
    } else {
      wealthState = "stable";
    }
  }
  
  // 预览版：简洁但高级的摘要，增加付费动机（四条主线）
  const palmLifePreview = hasFullAccess
    ? null // 完整版不显示预览，直接显示完整内容
    : (locale === "zh"
        ? "生命线走势需完整版查看，完整版将展示生命线、智慧线、感情线与事业财运线的深度解读。"
        : "Life line details require full version. Full version provides deep insights into life, wisdom, emotion, and career & wealth lines.");
  const palmWisdomPreview = hasFullAccess
    ? null
    : (locale === "zh"
        ? "智慧线走势需完整版查看，完整版将展示生命线、智慧线、感情线与事业财运线的深度解读。"
        : "Wisdom line details require full version. Full version provides deep insights into life, wisdom, emotion, and career & wealth lines.");
  const palmEmotionPreview = hasFullAccess
    ? null
    : (locale === "zh"
        ? "感情线走势需完整版查看，完整版将展示生命线、智慧线、感情线与事业财运线的深度解读。"
        : "Heart line details require full version. Full version provides deep insights into life, wisdom, emotion, and career & wealth lines.");
  const palmWealthPreview = hasFullAccess
    ? null
    : (locale === "zh"
        ? "事业财运线走势需完整版查看，完整版将展示生命线、智慧线、感情线与事业财运线的深度解读。"
        : "Career & wealth line details require full version. Full version provides deep insights into life, wisdom, emotion, and career & wealth lines.");
  
  // 完整版掌象文案：深度内容，不与预览重复（四条主线）
  const palmLifeFull = hasFullAccess
    ? (locale === "zh"
        ? `生命线走势显示今日计划推进度受『${lifeXiang}』影响，应以稳为主。`
        : `Life line shows today's plan progress is affected by '${lifeXiang}', should prioritize stability.`)
    : (palmLifePreview || (locale === "zh" 
        ? "掌纹光线或纹理识别度不足，仅能提供基础判断。完整版包含生命线、智慧线、感情线与事业财运线走势解读。"
        : "Palm lines have light or pattern interference, unable to generate high-recognition results. Full version will provide life, wisdom, emotion, and career & wealth line trends."));
  const palmWisdomFull = hasFullAccess
    ? (locale === "zh"
        ? `智慧线呈现『${wisdomXiang}』，提示今日思维节奏与决策方向。`
        : `Wisdom line shows '${wisdomXiang}' pattern, indicating today's thinking rhythm and decision direction.`)
    : (palmWisdomPreview || palmLifePreview || (locale === "zh"
        ? "掌纹光线或纹理识别度不足，仅能提供基础判断。完整版包含生命线、智慧线、感情线与事业财运线走势解读。"
        : "Palm lines have light or pattern interference, unable to generate high-recognition results. Full version will provide life, wisdom, emotion, and career & wealth line trends."));
  const palmEmotionFull = hasFullAccess
    ? (locale === "zh"
        ? `感情线呈现『${emotionXiang}』，提示今日避免能量外泄。`
        : `Emotion line shows '${emotionXiang}' trend, indicating today needs to avoid emotional energy leakage.`)
    : (palmEmotionPreview || palmLifePreview || (locale === "zh"
        ? "掌纹光线或纹理识别度不足，仅能提供基础判断。完整版包含生命线、智慧线、感情线与事业财运线走势解读。"
        : "Palm lines have light or pattern interference, unable to generate high-recognition results. Full version will provide life, wisdom, emotion, and career & wealth line trends."));
  const palmWealthFull = hasFullAccess
    ? (locale === "zh"
        ? `事业财运线显示财气处于『${wealthXiang}』状态，为'聚 / 泄 / 稳 / 动'四象之一。`
        : `Career & wealth line shows today's wealth qi is in '${wealthXiang}' state, belonging to one of the four patterns '${wealthState}'.`)
    : (palmWealthPreview || palmLifePreview || (locale === "zh"
        ? "掌纹光线或纹理识别度不足，仅能提供基础判断。完整版包含生命线、智慧线、感情线与事业财运线走势解读。"
        : "Palm lines have light or pattern interference, unable to generate high-recognition results. Full version will provide life, wisdom, emotion, and career & wealth line trends."));

  // 预览版：简洁但高级的摘要，增加付费动机
  const tonguePreview = hasFullAccess
    ? null // 完整版不显示预览，直接显示完整内容
    : (locale === "zh"
        ? "舌象是体质的重要窗口，完整版将精准解读气血状态、火气/湿气指数，并提供个性化的今日调理方案，助你优化身心节奏。"
        : "Tongue is a key window to constitution. Full version precisely interprets qi-blood state, fire-qi/dampness index, and provides personalized daily adjustment strategies to optimize your body-mind rhythm.");
  
  // 提取舌象相关字段
  const bodyTongue = normalized?.body_tongue ?? (report as any)?.body_tongue ?? null;
  const qiXueXiang = bodyTongue?.qi_pattern || bodyTongue?.energy_state || (locale === "zh" ? "气血平衡" : "balanced qi-blood");
  const huoQiValue = bodyTongue?.energy_state || (locale === "zh" ? "中等" : "moderate");
  const tiaoLiAdvice = bodyTongue?.health_care_advice?.[0] || bodyTongue?.suggestions?.[0] || (locale === "zh" ? "温和调理" : "gentle adjustment");
  
  // 完整版舌象文案：深度内容，不与预览重复
  const tongueFull = hasFullAccess
    ? (locale === "zh"
        ? `舌象反映气血偏向『${qiXueXiang}』，火气/湿气指数为 ${huoQiValue}，建议今日采取 ${tiaoLiAdvice}。`
        : `Today's tongue reflects your qi-blood state leaning towards '${qiXueXiang}', fire-qi/dampness/cold-heat index is ${huoQiValue}. Suggest taking ${tiaoLiAdvice} today.`)
    : (tonguePreview || (locale === "zh"
        ? "舌象纹理模糊，暂无法判断体质类别。完整版将提供气血、火气和今日调理建议。"
        : "Tongue texture and color have blurred areas, unable to generate constitution judgment. Full version will provide qi-blood, fire-qi, and daily qi-nourishing suggestions."));

  // 预览版：简洁但高级的摘要，增加付费动机
  const dreamPreview = hasFullAccess
    ? null // 完整版不显示预览，直接显示完整内容
    : (locale === "zh"
        ? "梦境是潜意识的映射，完整版将深入解析梦象象征、心理伏笔与运势趋势，揭示你内心深处的信号与今日行动指引。"
        : "Dreams are reflections of the subconscious. Full version deeply interprets dream symbols, psychological undercurrents, and fortune trends, revealing signals from your inner depths and today's action guidance.");
  
  // 提取梦象相关字段
  const dreamInsight = normalized?.dream_insight ?? (report as any)?.dream_insight ?? null;
  const mengXiangCode = dreamInsight?.archetype?.type 
    || dreamInsight?.llm?.symbolic 
    || dreamInsight?.llm?.ImageSymbol 
    || dreamSummary.split(/[。！？\n]/)[0] 
    || (locale === "zh" ? "思维转换" : "mental transition");
  
  // 完整版梦象文案：深度内容，不与预览重复
  const dreamFull = hasFullAccess
    ? (locale === "zh"
        ? `梦兆出现『${mengXiangCode}』，象征你正跨越心念关隘，今日宜顺势而为。`
        : `Dream omen shows typical symbol '${mengXiangCode}', corresponding to inner mind crossing a mental threshold, today should follow the flow.`)
    : (dreamPreview || (locale === "zh"
        ? "梦境线索不足，无法形成完整梦兆。完整版将结合象征体系解析趋势与心理伏笔。"
        : "Dream symbols show key clues, but description is insufficient for complete dream omen judgment. Full version will provide fortune trends and mental analysis."));

  const yiList = sanitizeList(lunar.yi);
  const jiList = sanitizeList(lunar.ji);
  const luckyHours = sanitizeList(lunar.lucky_hours);
  const unluckyHours = sanitizeList(lunar.unlucky_hours);

  // 预览版：简洁但高级的摘要，增加付费动机
  const previewQi = hasFullAccess
    ? null // 完整版不显示预览，直接显示完整内容
    : (locale === "zh"
        ? "今日气运处于关键节点，完整版将提供精准的宜忌事项、吉时窗口与破局方法，助你把握最佳行动时机。"
        : "Today's qi rhythm is at a critical point. Full version provides precise do's and don'ts, lucky time windows, and breakthrough methods to help you grasp the best action timing.");
  
  // 提取气运相关字段
  const qiRhythm = normalized?.qi_rhythm ?? (report as any)?.qi_rhythm ?? null;
  // 完整版气运文案：深度内容，不与预览重复
  const fullQi = hasFullAccess
    ? buildQiFull(locale, yiList, jiList, luckyHours, unluckyHours, qiRhythm)
    : (previewQi || (locale === "zh"
        ? "今日节奏未成吉凶，仍处在临界区。完整版包含今日宜忌、吉时与破局法。"
        : "Today's rhythm is at a critical point, great fortune not yet opened, light misfortune not yet fallen. Full version can view do's and don'ts, lucky hours, and today's breakthrough suggestions."));

  const trimmedYi = hasFullAccess ? yiList : yiList.slice(0, 2);
  const trimmedJi = hasFullAccess ? jiList : jiList.slice(0, 2);
  const trimmedLucky = hasFullAccess ? luckyHours : luckyHours.slice(0, 1);
  const trimmedUnlucky = hasFullAccess ? unluckyHours : unluckyHours.slice(0, 1);

  // summaryBlock：确保预览版和完整版不重复
  // 完整版时，preview 为 null，只显示 overall（完整内容）
  // 预览版时，preview 显示高级摘要，overall 也显示预览内容（避免客户端重复渲染）
  const summaryBlock = {
    overall_label: locale === "zh" ? "象局" : "Essence",
    overall: hasFullAccess ? fullOverall : (previewOverall || fullOverall), // 完整版显示完整内容，预览版显示预览内容
    preview: hasFullAccess ? null : previewOverall, // 完整版不显示预览，预览版显示高级摘要
  };

  const palmBlock = {
    life_line: {
      label: locale === "zh" ? "生命线" : "Life Line",
      summary: palmLifePreview,
      detail: palmLifeFull,
    },
    wisdom: {
      label: locale === "zh" ? "智慧线" : "Wisdom Line",
      summary: palmWisdomPreview,
      detail: palmWisdomFull,
    },
    emotion: {
      label: locale === "zh" ? "感情线" : "Heart Line",
      summary: palmEmotionPreview,
      detail: palmEmotionFull,
    },
    wealth: {
      label: locale === "zh" ? "事业财运线" : "Career & Wealth Line",
      summary: palmWealthPreview,
      detail: palmWealthFull,
    },
  };

  const tongueBlock = {
    constitution: {
      label: locale === "zh" ? "体质象" : "Constitution",
      summary: tonguePreview,
      detail: tongueFull,
    },
  };

  const dreamBlock = {
    main_symbol: {
      label: locale === "zh" ? "梦象" : "Dream Symbol",
      summary: dreamPreview,
      detail: dreamFull,
    },
  };

  const qiBlock = {
    today_phase: {
      label: locale === "zh" ? "今日气运" : "Qi Phase",
      summary: previewQi,
      detail: fullQi,
    },
    yi: trimmedYi,
    ji: trimmedJi,
    lucky_hours: trimmedLucky,
    unlucky_hours: trimmedUnlucky,
  };

  const updatedNormalized = {
    ...normalized,
    qi_rhythm: {
      ...(normalized.qi_rhythm ?? {}),
      calendar: {
        ...(normalized.qi_rhythm?.calendar ?? {}),
        yi: trimmedYi,
        ji: trimmedJi,
        lucky_hours: trimmedLucky,
        unlucky_hours: trimmedUnlucky,
      },
    },
  };

  return {
    ...report,
    summary: summaryBlock,
    palm: palmBlock,
    tongue: tongueBlock,
    dream: dreamBlock,
    qi_rhythm: {
      ...(report.qi_rhythm ?? {}),
      today_phase: qiBlock.today_phase,
      calendar: {
        ...(report.qi_rhythm?.calendar ?? {}),
        yi: trimmedYi,
        ji: trimmedJi,
        lucky_hours: trimmedLucky,
        unlucky_hours: trimmedUnlucky,
      },
    },
    normalized: updatedNormalized,
  };
}

function takeSentences(text: string | null | undefined, max: number, locale: Locale) {
  if (!text) return null;
  const separators = locale === "zh" ? /[。！？\n]/ : /[.!?\n]/;
  const sentences = text
    .split(separators)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (sentences.length === 0) {
    return text.trim();
  }
  return sentences.slice(0, max).join(locale === "zh" ? "。" : ". ") + (sentences.length > 0 ? (locale === "zh" ? "。" : ".") : "");
}

function splitIntoSentences(text: string | null | undefined, locale: Locale) {
  if (!text) return [];
  const separators = locale === "zh" ? /[。！？\n]/ : /[.!?\n]/;
  return text
    .split(separators)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function fallbackText(locale: Locale, type: "overall" | "palm" | "tongue" | "dream") {
  const zhMap = {
    overall: "今日五象走势稳定，适合循序渐进地调整身心节奏。",
    palm: "掌纹整体趋于平稳，宜把握节奏稳扎稳打。",
    tongue: "舌象显示气血尚可，但仍需注意作息与饮食。",
    dream: "梦象提醒你调整心绪，保持内在秩序。",
  };
  const enMap = {
    overall: "Five aspects stay balanced today, favoring steady pacing.",
    palm: "Palms indicate a stable path; move forward deliberately.",
    tongue: "Tongue signals moderate qi and blood—mind routine and diet.",
    dream: "Dreams suggest calming emotions and keeping inner order.",
  };
  return locale === "zh" ? zhMap[type] : enMap[type];
}

function buildGanzhiLine(locale: Locale, ganzhi?: string | null) {
  if (!ganzhi) return "";
  return locale === "zh"
    ? `干支「${ganzhi}」带来阶段性的气势起伏，提醒你顺势调节。`
    : `The Ganzhi day "${ganzhi}" hints at phase adjustments—align with the flow.`;
}

function buildTermInteraction(locale: Locale, term?: string | null) {
  if (!term) return "";
  return locale === "zh"
    ? `节气「${term}」与体质互动，适合通过饮食与温润作息巩固根本。`
    : `The solar term "${term}" interacts with your constitution; gentle diet and rest reinforce the root.`;
}

function buildDreamYiJiLink(locale: Locale, yi?: string[] | null, ji?: string[] | null) {
  const yiFirst = yi?.[0];
  const jiFirst = ji?.[0];
  if (!yiFirst && !jiFirst) return "";
  return locale === "zh"
    ? `宜事如「${yiFirst ?? ""}」帮助梦意落地，忌事「${jiFirst ?? ""}」需暂缓。`
    : `Lean into "${yiFirst ?? ""}" to ground the dream symbol and pause on "${jiFirst ?? ""}" today.`;
}

function buildFullNarrative({
  locale,
  palmSummary,
  tongueSummary,
  dreamSummary,
  lunar,
}: {
  locale: Locale;
  palmSummary: string;
  tongueSummary: string;
  dreamSummary: string;
  lunar: LunarMeta;
}) {
  // 提取象局结论：综合掌象、舌象、梦象的简要描述
  const palmBrief = palmSummary ? takeSentences(palmSummary, 1, locale) || palmSummary.split(/[。！？\n]/)[0] : "";
  const tongueBrief = tongueSummary ? takeSentences(tongueSummary, 1, locale) || tongueSummary.split(/[。！？\n]/)[0] : "";
  const dreamBrief = dreamSummary ? takeSentences(dreamSummary, 1, locale) || dreamSummary.split(/[。！？\n]/)[0] : "";
  
  // 构建象局结论：综合三个方面的关键词
  const conclusionParts: string[] = [];
  if (palmBrief) conclusionParts.push(palmBrief);
  if (tongueBrief) conclusionParts.push(tongueBrief);
  if (dreamBrief) conclusionParts.push(dreamBrief);
  const xiangJuConclusion = conclusionParts.length > 0 
    ? conclusionParts.join("、") 
    : (locale === "zh" ? "稳中求进" : "steady progress");

  if (locale === "zh") {
    return `根据掌象、舌象、梦象与节气推算，你今日的整体五象呈『${xiangJuConclusion}』，影响行动力、财气流动、心念稳定度及贵人位置。`;
  }
  return `Based on palm, tongue, dream symbols and today's solar term calculation, your five aspects today show a '${xiangJuConclusion}' pattern. This pattern affects action rhythm, mental stability, wealth gathering/dispersal, and noble person movements.`;
}

function sanitizeList(list?: string[] | null): string[] {
  return Array.isArray(list) ? list.filter((item) => typeof item === "string" && item.trim().length > 0) : [];
}

function buildQiPreview(locale: Locale, yi: string[], ji: string[], lucky: string[]) {
  const firstLucky = lucky[0];
  const yiText = yi.slice(0, 2).join(locale === "zh" ? "、" : ", ");
  const jiText = ji.slice(0, 2).join(locale === "zh" ? "、" : ", ");
  if (locale === "zh") {
    return `${firstLucky ? `首个吉时落在「${firstLucky}」` : "今日吉时尚待捕捉"}，宜事：${yiText || "调息"}，忌事：${jiText || "躁进"}`;
  }
  return `${firstLucky ? `First lucky window: ${firstLucky}` : "Lucky window still forming"}, do: ${yiText || "slow breath"}, avoid: ${jiText || "rush"}`;
}

function buildQiFull(locale: Locale, yi: string[], ji: string[], lucky: string[], unlucky: string[], qiRhythm?: any) {
  const yiText = yi.length ? yi.join("、") : (locale === "zh" ? "调息" : "breath adjustment");
  const jiText = ji.length ? ji.join("、") : (locale === "zh" ? "躁进" : "rushing");
  const luckyText = lucky.length ? lucky.join("、") : (locale === "zh" ? "待定" : "TBD");
  const poJuFa = qiRhythm?.advice?.[0] 
    || qiRhythm?.suggestions?.[0] 
    || (locale === "zh" ? "循序渐进，先稳后进" : "step by step, stabilize first then advance");
  
  if (locale === "zh") {
    return `根据天干地支与节气推算：宜 ${yiText}，忌 ${jiText}，吉时为 ${luckyText}。今日破局法：${poJuFa}。`;
  }
  return `Based on heavenly stems and earthly branches calculation, today do: ${yiText}, avoid: ${jiText}, lucky hours: ${luckyText}. Today's breakthrough method: ${poJuFa}.`;
}
