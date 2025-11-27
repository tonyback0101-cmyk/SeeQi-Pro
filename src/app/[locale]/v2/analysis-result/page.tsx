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
  const { reportId, success, intent } = await searchParams;

  if (!reportId) {
    // 如果没有 reportId，重定向到首页或显示错误
    redirect(`/${locale}/v2/analyze`);
  }

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
  if (success === "1") {
    const sessionId = (await searchParams).session_id;
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
          
          // 判断是否为单次购买：优先检查 metadata，其次检查订单
          const metadataMode = checkoutSession.metadata?.mode;
          const isSinglePurchase = metadataMode === "single" || 
                                   order?.kind === "single" ||
                                   (checkoutSession.metadata?.report_id && checkoutSession.metadata.report_id === reportId);
          
          console.log(`[V2AnalysisResultPage] Is single purchase: ${isSinglePurchase}`, {
            metadata_mode: metadataMode,
            order_kind: order?.kind,
            metadata_report_id: checkoutSession.metadata?.report_id,
            reportId,
          });
          
          // 如果是单次购买，创建 report_access 记录
          if (isSinglePurchase && reportId) {
            // 创建或更新 report_access 记录（单次购买）
            const { error: accessError, data: accessData } = await supabase
              .from("report_access")
              .upsert(
                {
                  user_id: userId,
                  report_id: reportId,
                  tier: "full",
                  created_at: new Date().toISOString(),
                },
                { onConflict: "report_id,user_id" }
              )
              .select();
            
            if (accessError) {
              console.error("[V2AnalysisResultPage] Failed to create report_access:", accessError);
              // 即使创建失败，也继续处理，webhook 会处理
            } else {
              console.log(`[V2AnalysisResultPage] Created/updated report_access for user ${userId}, report ${reportId}`, accessData);
              // 支付成功且创建了 report_access，重定向到同一页面（不带 success 参数）以刷新权限
              // 这样 computeV2Access 就能立即识别到新创建的权限
              const redirectUrl = `/${locale}/v2/analysis-result?reportId=${encodeURIComponent(reportId)}`;
              console.log(`[V2AnalysisResultPage] Redirecting to: ${redirectUrl}`);
              redirect(redirectUrl);
            }
          } else if (!isSinglePurchase) {
            // 如果不是单次购买，可能是订阅，不需要创建 report_access（订阅用户通过 hasActiveSubscription 判断）
            console.log(`[V2AnalysisResultPage] Not a single purchase, skipping report_access creation`);
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

  // 计算 access
  const access = await computeV2Access({ userId, reportId });

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

  const enrichedReport = injectFiveAspectContent(report, locale, access.hasFullAccess);

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

  const previewOverall = takeSentences(`${palmSummary} ${tongueSummary} ${dreamSummary}`, 2, locale) || fallbackText(locale, "overall");
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
  const palmLifePreview = palmSentences[0] || fallbackText(locale, "palm");
  const palmEmotionPreview = palmSentences[1] || palmLifePreview;
  const palmWealthPreview = palmSentences[2] || palmLifePreview;
  const palmLifeFull = hasFullAccess ? `${palmLifePreview} ${buildGanzhiLine(locale, lunar.ganzhi_day)}`.trim() : palmLifePreview;
  const palmEmotionFull = hasFullAccess
    ? `${palmEmotionPreview} ${locale === "zh" ? "情绪纹随日干起伏，宜以柔克刚。" : "Emotion line echoes today's stem, reply with softness."}`.trim()
    : palmEmotionPreview;
  const palmWealthFull = hasFullAccess
    ? `${palmWealthPreview} ${locale === "zh" ? "结合节气势能，财富线宜稳步累积、少做激进决策。" : "With the current term, focus on steady accumulation and avoid drastic bets."}`.trim()
    : palmWealthPreview;

  const tonguePreview = takeSentences(tongueSummary, 2, locale) || fallbackText(locale, "tongue");
  const tongueFull = hasFullAccess ? `${tongueSummary || fallbackText(locale, "tongue")} ${buildTermInteraction(locale, lunar.term)}`.trim() : tonguePreview;

  const dreamPreview = takeSentences(dreamSummary, 2, locale) || fallbackText(locale, "dream");
  const dreamFull = hasFullAccess ? `${dreamSummary || fallbackText(locale, "dream")} ${buildDreamYiJiLink(locale, lunar.yi, lunar.ji)}`.trim() : dreamPreview;

  const yiList = sanitizeList(lunar.yi);
  const jiList = sanitizeList(lunar.ji);
  const luckyHours = sanitizeList(lunar.lucky_hours);
  const unluckyHours = sanitizeList(lunar.unlucky_hours);

  const previewQi = buildQiPreview(locale, yiList, jiList, luckyHours);
  const fullQi = hasFullAccess
    ? buildQiFull(locale, yiList, jiList, luckyHours, unluckyHours)
    : previewQi;

  const trimmedYi = hasFullAccess ? yiList : yiList.slice(0, 2);
  const trimmedJi = hasFullAccess ? jiList : jiList.slice(0, 2);
  const trimmedLucky = hasFullAccess ? luckyHours : luckyHours.slice(0, 1);
  const trimmedUnlucky = hasFullAccess ? unluckyHours : unluckyHours.slice(0, 1);

  const summaryBlock = {
    overall_label: locale === "zh" ? "象局" : "Essence",
    overall: fullOverall,
    preview: previewOverall,
  };

  const palmBlock = {
    life_line: {
      label: locale === "zh" ? "生命线" : "Life Line",
      summary: palmLifePreview,
      detail: palmLifeFull,
    },
    emotion: {
      label: locale === "zh" ? "情绪纹" : "Emotion Line",
      summary: palmEmotionPreview,
      detail: palmEmotionFull,
    },
    wealth: {
      label: locale === "zh" ? "财富纹" : "Wealth Line",
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
  const termText = lunar.term ? (locale === "zh" ? `节气「${lunar.term}」` : `the "${lunar.term}" solar term`) : "";
  const ganzhiText = lunar.ganzhi_day ? (locale === "zh" ? `当天干支「${lunar.ganzhi_day}」` : `Ganzhi day "${lunar.ganzhi_day}"`) : "";
  const palm = palmSummary || fallbackText(locale, "palm");
  const tongue = tongueSummary || fallbackText(locale, "tongue");
  const dream = dreamSummary || fallbackText(locale, "dream");

  if (locale === "zh") {
    return `${termText || "当令气机"}与${ganzhiText || "天地轮替"}交织，令今日象局呈现层次分明的缓进之势。${palm}；${tongue}；${dream}。整体气场宜慢收慢放，兼顾现实行动与内在沉淀。`
      .replace(/；；/g, "；")
      .replace(/；。/g, "。");
  }
  return `${termText || "Current seasonal qi"} together with ${ganzhiText || "the day's cyclical stem-branch"} sets a layered yet measured tone. ${palm} ${tongue} ${dream} Keep actions steady while allowing inner insights to settle.`;
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

function buildQiFull(locale: Locale, yi: string[], ji: string[], lucky: string[], unlucky: string[]) {
  const luckyText = lucky.length
    ? (locale === "zh" ? `吉时涵盖：${lucky.join("、")}。` : `Lucky hours cover: ${lucky.join(", ")}.`)
    : "";
  const unluckyText = unlucky.length
    ? (locale === "zh" ? `慎避时段：${unlucky.join("、")}。` : `Take care around: ${unlucky.join(", ")}.`)
    : "";
  const yiText = yi.length ? (locale === "zh" ? `宜：${yi.join("、")}。` : `Do: ${yi.join(", ")}.`) : "";
  const jiText = ji.length ? (locale === "zh" ? `忌：${ji.join("、")}。` : `Avoid: ${ji.join(", ")}.`) : "";
  const action = locale === "zh" ? "行动宜循序渐进，先稳住呼吸与节奏，再推关键事项。" : "Move in measured steps—center breath and rhythm before key moves.";
  return `${luckyText} ${unluckyText} ${yiText} ${jiText} ${action}`.trim();
}
