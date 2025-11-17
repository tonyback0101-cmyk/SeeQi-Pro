"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Hero from "@/components/report/Hero";
import UpgradeStrip from "@/components/report/UpgradeStrip";
import ConstitutionCard from "@/components/report/cards/ConstitutionCard";
import QiCard from "@/components/report/cards/QiCard";
import AdviceCard from "@/components/report/cards/AdviceCard";
import DreamCard from "@/components/report/cards/DreamCard";
import SharePoster, { SharePosterHandle } from "@/components/share/SharePoster";
import { offlineService } from "@/services/offlineService";
import { DREAM_TAGS, getTagLabels } from "@/data/dreamOptions";
import { fadeUp, stagger } from "@/lib/motion";

type Locale = "zh" | "en";

type PageProps = {
  params: { locale: Locale; id: string };
};

type ReportResponse = {
  id: string;
  access?: "lite" | "full";
  unlocked: boolean;
  constitution?: string | null;
  constitution_detail?: {
    name?: string | null;
    feature?: string | null;
    advice?: {
      diet?: string;
      activity?: string;
      acupoint?: string;
    };
  } | null;
  advice?: {
    diet?: string[];
    lifestyle?: string[];
    exercise?: string[];
    acupoints?: Array<{ name?: string; function?: string; method?: string }>;
    constitution?: {
      feature?: string;
    } | null;
  } | null;
  qi_index?: {
    total?: number;
    advice?: string[];
  } | null;
  qi_phrase?: string | null;
  qi_warning?: string | null;
  solar_term?: string | null;
  created_at?: string | null;
  dream?: {
    summary?: string | null;
    tip?: string | null;
    keywords?: string[];
    category?: string | null;
    mood?: string | null;
    tags?: string[];
  } | null;
};

type SolarInfo = {
  qi_luck_index?: number | null;
  qi_phrase?: string | null;
  warning?: string | null;
  do?: string[];
  avoid?: string[];
  food?: string[];
  activity?: string[];
};

const TEXT = {
  zh: {
    title: "SeeQi 分析报告",
    back: "返回测评",
    retry: "重试",
    loading: "正在加载报告…",
    offline: "当前为离线模式 · 展示最近缓存的报告",
    failed: "抱歉，报告加载失败，请稍后再试。",
    verifying: "正在确认支付状态…",
    paymentPending: "支付尚未完成，可稍后再次点击“解锁专业版”确认。",
    paymentFailed: "创建支付会话失败，请稍后再试。",
    paymentUnknown: "暂时无法确认支付结果，请稍后再试。",
    paymentSuccess: "支付成功，正在刷新报告…",
  },
  en: {
    title: "SeeQi Insight Report",
    back: "Back to assessment",
    retry: "Retry",
    loading: "Loading report…",
    offline: "Offline mode · Showing your latest cached report",
    failed: "Unable to load this report. Please try again later.",
    verifying: "Verifying payment status…",
    paymentPending: "Payment is not completed yet. You can click “Unlock Pro” again later.",
    paymentFailed: "Failed to create a checkout session. Please try again later.",
    paymentUnknown: "We could not confirm the payment. Please try again shortly.",
    paymentSuccess: "Payment succeeded. Refreshing your report…",
  },
} as const;

export default function AnalysisResultPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const t = TEXT[locale];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [solar, setSolar] = useState<SolarInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const fetchSolar = useCallback(
    async (date: string | undefined | null) => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const targetDate = date ? date.slice(0, 10) : new Date().toISOString().slice(0, 10);
        const response = await fetch(`/api/solar?locale=${locale}&tz=${tz}&date=${targetDate}`);
        if (!response.ok) return;
        const data = (await response.json()) as SolarInfo;
        setSolar(data);
      } catch (err) {
        console.warn("solar-fetch", err);
      }
    },
    [locale],
  );

  const loadReport = useCallback(
    async (options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await fetch(`/api/result/${params.id}`, { cache: "no-store" });
        if (!response.ok) {
          // 尝试解析错误消息
          let errorMessage = t.failed;
          try {
            const errorData = await response.json().catch(() => null);
            if (errorData?.error && typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else {
              const errorText = await response.text().catch(() => null);
              if (errorText) {
                try {
                  const parsed = JSON.parse(errorText);
                  if (parsed?.error && typeof parsed.error === "string") {
                    errorMessage = parsed.error;
                  }
                } catch {
                  // 如果不是 JSON，使用原始文本（如果不太长）
                  if (errorText.length < 200) {
                    errorMessage = errorText;
                  }
                }
              }
            }
          } catch (parseError) {
            console.warn("result-load: failed to parse error response", parseError);
          }
          throw new Error(errorMessage);
        }
        const data = (await response.json()) as ReportResponse;
        if (!data || !data.id) {
          throw new Error(t.failed);
        }
        setReport(data);
        setOffline(false);
        offlineService.saveReport({
          id: data.id,
          generatedAt: Date.now(),
          payload: data,
        });
        await fetchSolar(data.created_at);
      } catch (err) {
        console.error("result-load", err);
        const cached = offlineService.getReports().find((item) => item.id === params.id);
        if (cached) {
          setReport(cached.payload as ReportResponse);
          setOffline(true);
          await fetchSolar((cached.payload as ReportResponse)?.created_at);
        } else {
          const errorMessage = err instanceof Error ? err.message : t.failed;
          setError(errorMessage);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [params.id, fetchSolar, t.failed],
  );

  useEffect(() => {
    let cancelled = false;
    loadReport()
      .catch((err) => console.error("result-load:init", err))
      .finally(() => {
        if (cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadReport]);

  useEffect(() => {
    const checkoutSessionId = searchParams?.get("session_id");
    if (!checkoutSessionId) return;

    let cancelled = false;
    async function verifyPayment() {
      setCheckingPayment(true);
      setPaymentMessage(t.verifying);
      try {
        const response = await fetch(
          `/api/pay/status?session_id=${encodeURIComponent(checkoutSessionId)}&report_id=${params.id}`,
          { cache: "no-store" },
        );
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.ok && data?.unlocked) {
            setPaymentMessage(locale === "zh" ? "支付成功，正在刷新报告…" : "Payment succeeded. Refreshing your report…");
            await loadReport({ silent: true });
        } else {
              const message: string =
                (typeof data?.error === "string" && data.error.trim().length > 0 ? data.error : t.paymentPending) ?? t.paymentPending;
          setPaymentMessage(message);
        }
      } catch (error) {
        console.error("verify-payment", error);
        if (!cancelled) {
          setPaymentMessage(t.paymentUnknown);
        }
      } finally {
        if (!cancelled) {
          setCheckingPayment(false);
          setTimeout(() => {
            router.replace(`/${locale}/analysis-result/${params.id}`);
          }, 0);
        }
      }
    }

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [searchParams, locale, params.id, loadReport, router, t.paymentPending, t.paymentSuccess, t.paymentUnknown, t.verifying]);

  const handleUnlock = useCallback(async () => {
    if (unlocking || checkingPayment) return;
    const ensureReport = report;
    if (!ensureReport) {
      setPaymentMessage(locale === "zh" ? "报告尚未加载完成，请稍后再试。" : "Report is still loading. Please try again.");
      return;
    }

    setUnlocking(true);
    setPaymentMessage(null);
    try {
      const response = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: ensureReport.id ?? params.id,
          locale,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data?.error === "string" && data.error.trim().length > 0
            ? data.error
            : locale === "zh"
            ? "支付通道暂不可用，请稍后再试。"
            : "Payment channel is unavailable. Please try again later.";
        setPaymentMessage(message);
        return;
      }

      if (typeof data?.url === "string" && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }

      if (typeof data?.mockUrl === "string" && data.mockUrl.length > 0) {
        window.location.href = data.mockUrl;
        setPaymentMessage(locale === "zh" ? "已进入模拟支付流程。" : "Opened mock checkout flow.");
        return;
      }

      if (data?.alreadyUnlocked) {
        const message = locale === "zh" ? "该报告已解锁。" : "This report is already unlocked.";
        setPaymentMessage(message);
        await loadReport({ silent: true });
        return;
      }

      setPaymentMessage(
        typeof data?.error === "string" && data.error.trim().length > 0
          ? data.error
          : locale === "zh"
          ? "未获取到支付链接，请稍后重试。"
          : "Could not retrieve checkout link. Please try again.",
      );
    } catch (error) {
      console.error("checkout-start", error);
      setPaymentMessage(t.paymentFailed);
    } finally {
      setUnlocking(false);
    }
  }, [unlocking, checkingPayment, report, params.id, locale, t.paymentFailed, loadReport]);

  const posterRef = useRef<SharePosterHandle | null>(null);

  const handleSharePoster = useCallback(async () => {
    await posterRef.current?.generate();
  }, []);

  if (loading) {
    return (
      <main className="page page--center">
        <h1>{t.loading}</h1>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="page page--center">
        <h1>{error ?? t.failed}</h1>
        <button type="button" onClick={() => router.refresh()}>
          {t.retry}
        </button>
      </main>
    );
  }

  const qiIndexValue = typeof report.qi_index === "number" ? report.qi_index : report.qi_index?.total ?? null;
  const totalScore = typeof qiIndexValue === "number" ? Math.round(qiIndexValue) : null;

  const dreamTags = getTagLabels(report.dream?.tags, locale);
  const isFullAccess = (report.access ?? (report.unlocked ? "full" : "lite")) === "full";

  const copy = locale === "zh"
    ? {
        heroTitle: "SeeQi 分析报告",
        heroSubtitle: "东方智慧 · 气运与体质洞察",
        share: "生成分享卡",
        unlock: "解锁完整版（$1）",
        upgradeMessage: "已生成简版结果 · 解锁完整报告查看更多建议与解释",
        upgradeButton: "解锁完整版（$1）",
        constitutionHeading: "体质洞察",
        qiHeading: "今日气运",
        qiFallback: "保持平和的心态，适时调息。",
        qiWarningLabel: "提醒",
        adviceHeading: "今日建议",
        adviceLabels: { food: "食材", action: "调理动作", acupoint: "穴位", empty: "暂无" },
        dreamHeading: "梦境提示",
        dreamEmpty: "暂无记录，可前往解梦页体验",
        dreamTip: "建议",
        bottomHint: "完整掌纹 + 舌相联合分析，准确率更高（PRO）",
      }
    : {
        heroTitle: "SeeQi Insight Report",
        heroSubtitle: "Eastern wisdom · Qi & constitution insights",
        share: "Create share poster",
        unlock: "Unlock full report ($1)",
        upgradeMessage: "Lite insights ready · Unlock the full report for more guidance",
        upgradeButton: "Unlock full report ($1)",
        constitutionHeading: "Constitution Insight",
        qiHeading: "Qi Outlook",
        qiFallback: "Stay calm and adjust mindfully.",
        qiWarningLabel: "Note",
        adviceHeading: "Daily Recommendations",
        adviceLabels: { food: "Foods", action: "Exercises", acupoint: "Acupoint", empty: "N/A" },
        dreamHeading: "Dream Highlights",
        dreamEmpty: "No dream recorded yet. Visit the dream page to explore more.",
        dreamTip: "Tip",
        bottomHint: "Combine palm & tongue insight for higher accuracy (PRO)",
      };

  const foodAdvice = Array.isArray(solar?.food) && solar.food.length
    ? (solar.food.filter(Boolean) as string[])
    : ((report.advice?.diet ?? []).filter(Boolean) as string[]);

  const actionAdvice = Array.isArray(solar?.activity) && solar.activity.length
    ? (solar.activity.filter(Boolean) as string[])
    : ((report.advice?.exercise ?? []).filter(Boolean) as string[]);

  const acupointAdvice = (report.advice?.acupoints ?? [])
    .map((item) => item?.name ?? item?.function ?? "")
    .filter((item): item is string => Boolean(item && item.trim()));

  return (
    <main className="report-page">
      <SharePoster
        ref={posterRef}
        report={{
          id: report.id,
          qi_index: totalScore ?? undefined,
          qi_phrase: solar?.qi_phrase ?? report.qi_phrase ?? undefined,
          solar_term: report.solar_term ?? undefined,
          advice: { food: foodAdvice },
        }}
      />

      <Hero
        qiIndex={totalScore ?? undefined}
        onShare={handleSharePoster}
        onUnlock={handleUnlock}
        disabled={unlocking || checkingPayment}
        title={copy.heroTitle}
        subtitle={copy.heroSubtitle}
        shareLabel={copy.share}
        unlockLabel={copy.unlock}
      />
      {!isFullAccess ? (
        <UpgradeStrip onUnlock={handleUnlock} message={copy.upgradeMessage} buttonLabel={copy.upgradeButton} />
      ) : null}

      {offline ? (
        <motion.div variants={fadeUp(0.2)} initial="hidden" animate="visible" className="banner banner--offline">
          {t.offline}
        </motion.div>
      ) : null}

      <motion.section
        variants={fadeUp(0.25)}
        initial="hidden"
        animate="visible"
        className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500"
      >
        <div>
          <span className="font-medium text-emerald-800">报告编号：</span>
          <code className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">{report.id}</code>
        </div>
        {paymentMessage ? <span className="text-xs text-amber-700">{paymentMessage}</span> : null}
        <Link href={`/${locale}/analyze`} className="secondary">
          ← {t.back}
        </Link>
      </motion.section>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="cards-grid">
        <ConstitutionCard
          title={report.constitution_detail?.name ?? report.constitution ?? null}
          brief={report.constitution_detail?.feature ?? report.advice?.constitution?.feature ?? null}
          full={isFullAccess ? report.constitution_detail?.advice?.diet ?? undefined : undefined}
          heading={copy.constitutionHeading}
          delay={0.3}
        />
        <QiCard
          score={totalScore}
          phrase={solar?.qi_phrase ?? report.qi_phrase ?? undefined}
          warning={solar?.warning ?? report.qi_warning ?? undefined}
          heading={copy.qiHeading}
          fallbackPhrase={copy.qiFallback}
          warningLabel={copy.qiWarningLabel}
          delay={0.34}
        />
        <AdviceCard
          food={foodAdvice}
          action={actionAdvice}
          acupoint={acupointAdvice}
          labels={{
            heading: copy.adviceHeading,
            food: copy.adviceLabels.food,
            action: copy.adviceLabels.action,
            acupoint: copy.adviceLabels.acupoint,
            empty: copy.adviceLabels.empty,
          }}
          delay={0.38}
        />
        <DreamCard
          summary={report.dream?.summary ?? null}
          tip={report.dream?.tip ?? null}
          tags={dreamTags}
          heading={copy.dreamHeading}
          emptyText={copy.dreamEmpty}
          tipLabel={copy.dreamTip}
          delay={0.42}
        />
      </motion.div>

      {!isFullAccess ? (
        <motion.section variants={fadeUp(0.48)} initial="hidden" animate="visible" className="bottom-hint">
          {copy.bottomHint}
        </motion.section>
      ) : null}

      <style jsx>{`
        .report-page {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.4rem 1.6rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.1rem;
          margin-top: 1rem;
        }
        .secondary {
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #0f766e;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .secondary:hover {
          background: rgba(16, 185, 129, 0.1);
        }
        .banner--offline {
          border-radius: 16px;
          border: 1px solid rgba(245, 158, 11, 0.35);
          background: rgba(254, 243, 199, 0.6);
          padding: 0.9rem 1.1rem;
          font-size: 0.92rem;
          color: #92400e;
          display: inline-flex;
          gap: 0.6rem;
          align-items: center;
        }
        .bottom-hint {
          margin-top: 1rem;
          border-radius: 18px;
          border: 1px dashed rgba(59, 130, 246, 0.35);
          background: rgba(59, 130, 246, 0.08);
          padding: 0.85rem 1.2rem;
          color: #1d4ed8;
          text-align: center;
          font-size: 0.92rem;
        }
        @media (max-width: 768px) {
          .report-page {
            padding: 2.2rem 1.1rem 3.5rem;
            gap: 1.4rem;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

