"use client";

import { useState } from "react";
import { V2PageContainer, V2PageTitle, V2Text, V2Card } from "@/components/v2/layout";
import { PRO_PLANS } from "@/lib/billing/plans";
import "@/styles/v2-theme.css";

type Locale = "zh" | "en";

type PageProps = {
  params: { locale: Locale };
};

const TEXT = {
  zh: {
    title: "升级 SeeQi 专业版",
    subtitle: "解锁掌纹识别、舌象健康、五行体质与梦境解析的全量 AI 报告，涵盖每日调养、专属推广返佣等高级功能。",
  },
  en: {
    title: "Upgrade to SeeQi Pro",
    subtitle: "Unlock full AI reports for palmistry, tongue health, five-element insights and dream decoding, plus daily wellness guidance and affiliate rewards.",
  },
} as const;

export default function PricingPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const t = TEXT[locale];
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: "single" | "monthly" | "yearly") => {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(locale === "zh" ? "创建支付链接失败，请稍后重试" : "Failed to create checkout session, please try again");
        setLoading(null);
      }
    } catch (error) {
      console.error("handleUpgrade error", error);
      alert(locale === "zh" ? "创建支付链接失败，请稍后重试" : "Failed to create checkout session, please try again");
      setLoading(null);
    }
  };

  const plans = PRO_PLANS.filter((plan) => plan.stripePriceId && plan.stripePriceId.trim().length > 0);
  const orderedPlans = [...plans].sort((a, b) => {
    const priority: ("single" | "monthly" | "yearly")[] = ["monthly", "yearly", "single"];
    return priority.indexOf(a.id) - priority.indexOf(b.id);
  });

  return (
    <div className="min-h-screen bg-[#FAF9F3]">
      <V2PageContainer maxWidth="2xl" className="py-8 md:py-12 space-y-8 md:space-y-12 bg-[#FAF9F3]">
        <div className="text-center space-y-4">
          <V2PageTitle>{t.title}</V2PageTitle>
          <V2Text variant="body" className="max-w-2xl mx-auto">
            {t.subtitle}
          </V2Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedPlans.map((plan) => {
            const isHighlight = plan.id === "monthly";
            const isSelecting = loading === plan.id;

            return (
              <V2Card
                key={plan.id}
                className={`h-full flex flex-col space-y-4 border-2 ${
                  isHighlight
                    ? "border-[var(--v2-color-green-primary)] bg-gradient-to-br from-[var(--v2-color-green-primary)]/5 to-[var(--v2-color-green-primary)]/10"
                    : "border-slate-100"
                }`}
              >
                <div className="flex-1 space-y-3">
                  <V2PageTitle level="card">{plan.name}</V2PageTitle>
                  <V2Text variant="note">{plan.description}</V2Text>
                  <div className="pt-2">
                    <div className="text-3xl font-bold text-[var(--v2-color-green-primary)]">
                      {plan.priceText}
                    </div>
                    {plan.billingType === "subscription" ? (
                      <V2Text variant="note" className="text-xs mt-1">
                        {locale === "zh" ? "Stripe 安全托管，可随时取消" : "Secured by Stripe, cancel anytime"}
                      </V2Text>
                    ) : (
                      <V2Text variant="note" className="text-xs mt-1">
                        {locale === "zh" ? "一次性付款" : "One-time payment"}
                      </V2Text>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isSelecting || !!loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                    isHighlight
                      ? "bg-[var(--v2-color-green-primary)] text-white hover:bg-[var(--v2-color-green-hover)]"
                      : "bg-[var(--v2-color-green-primary)] text-white hover:bg-[var(--v2-color-green-hover)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSelecting
                    ? locale === "zh"
                      ? "跳转中…"
                      : "Redirecting…"
                    : locale === "zh"
                    ? plan.id === "single"
                      ? "立即解锁"
                      : plan.id === "monthly"
                      ? "开通月付"
                      : "升级年付"
                    : plan.id === "single"
                    ? "Unlock Now"
                    : plan.id === "monthly"
                    ? "Subscribe Monthly"
                    : "Subscribe Yearly"}
                </button>
              </V2Card>
            );
          })}
        </div>
      </V2PageContainer>
    </div>
  );
}


