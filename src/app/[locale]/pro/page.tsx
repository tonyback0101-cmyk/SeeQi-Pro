"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { V2PageContainer, V2PageTitle, V2Text } from "@/components/v2/layout";
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
    features: [
      "掌纹与舌象 AI 深度分析",
      "五行体质画像 + 养生建议",
      "梦境解读与情绪洞察",
      "每日节气调养提示",
      "高级报告导出与分享",
      "专属推广返佣计划",
    ],
    included: "包含内容",
    includedItems: [
      "AI 报告将实时同步至账户，并可导出 PDF",
      "支付由 Stripe 托管，支持主流信用卡",
      "升级后可立即加入推广返佣计划",
    ],
  },
  en: {
    title: "Upgrade to SeeQi Pro",
    subtitle: "Unlock full AI reports for palmistry, tongue health, five-element insights and dream decoding, plus daily wellness guidance and affiliate rewards.",
    features: [
      "AI-powered palmistry & tongue diagnostics",
      "Personal five-element profile & wellness plan",
      "Dream decoding with emotional insights",
      "Daily solar-term wellness guidance",
      "Advanced report export & sharing",
      "Affiliate rewards program",
    ],
    included: "What's included",
    includedItems: [
      "AI reports sync to your account and can be exported as PDF.",
      "Payments are handled securely by Stripe.",
      "Upgrade unlocks the affiliate rewards program instantly.",
    ],
  },
} as const;

export default function ProPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const [loading, setLoading] = useState<string | null>(null);
  const t = TEXT[locale];

  const searchParams = useSearchParams();
  const reportId = searchParams?.get("reportId") || null;

  const handleUpgrade = async (planId: "single" | "monthly" | "yearly") => {
    setLoading(planId);
    try {
      // 将 planId 映射到 V2 API 的 mode
      const mode = planId === "single" ? "single" : planId === "monthly" ? "sub_month" : "sub_year";
      
      const res = await fetch("/api/v2/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode, 
          reportId: mode === "single" ? reportId : undefined, // 仅 single 模式需要 reportId
          locale 
        }),
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        const errorMsg = data.error || (locale === "zh" ? "创建支付链接失败，请稍后重试" : "Failed to create checkout session, please try again");
        alert(errorMsg);
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
    <V2PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <V2PageTitle>{t.title}</V2PageTitle>
          <V2Text variant="body" className="max-w-2xl mx-auto">
            {t.subtitle}
          </V2Text>
        </div>

        <div className="v2-card space-y-6">
          <div
            style={{
              display: "grid",
              gap: "var(--v2-spacing-md)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {t.features.map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(61, 107, 31, 0.08)",
                  borderRadius: "var(--v2-radius-md)",
                  padding: "var(--v2-spacing-md) var(--v2-spacing-lg)",
                  fontWeight: 600,
                  color: "var(--v2-color-text-primary)",
                  letterSpacing: "0.01em",
                  border: "1px solid var(--v2-color-border-light)",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              width: "100%",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {orderedPlans.map((plan) => {
              const isHighlight = plan.id === "monthly";
              const isSelecting = loading === plan.id;

              return (
                <div
                  key={plan.id}
                  style={{
                    borderRadius: "20px",
                    border: isHighlight ? "2px solid rgba(44, 110, 73, 0.4)" : "1px solid rgba(44, 62, 48, 0.2)",
                    background: isHighlight
                      ? "linear-gradient(140deg, rgba(44, 62, 48, 0.92), rgba(74, 113, 87, 0.9))"
                      : "rgba(255, 255, 255, 0.95)",
                    color: isHighlight ? "#f1fff9" : "#2C3E30",
                    padding: "1.35rem 1.4rem",
                    boxShadow: isHighlight
                      ? "0 24px 40px rgba(44, 62, 48, 0.32)"
                      : "0 16px 28px rgba(44, 62, 48, 0.18)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>{plan.name}</div>
                    <div style={{ fontSize: "0.95rem", opacity: isHighlight ? 0.8 : 0.7 }}>{plan.description}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{plan.priceText}</div>
                    {plan.billingType === "subscription" ? (
                      <div style={{ fontSize: "0.85rem", opacity: isHighlight ? 0.75 : 0.65 }}>
                        {locale === "zh" ? "Stripe 安全托管，可随时取消" : "Secured by Stripe, cancel anytime"}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.85rem", opacity: isHighlight ? 0.75 : 0.65 }}>
                        {locale === "zh" ? "一次性付款" : "One-time payment"}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isSelecting || !!loading}
                    style={{
                      marginTop: "auto",
                      borderRadius: 999,
                      border: isHighlight ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(44, 62, 48, 0.4)",
                      background: isHighlight ? "rgba(255,255,255,0.18)" : "#2C3E30",
                      color: isHighlight ? "#fff" : "#f5fff9",
                      padding: "0.65rem 1rem",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: isSelecting ? "wait" : "pointer",
                      transition: "transform 0.18s ease, box-shadow 0.18s ease",
                      boxShadow: isHighlight ? "0 12px 24px rgba(0,0,0,0.22)" : "0 12px 22px rgba(44, 62, 48, 0.18)",
                      opacity: loading && !isSelecting ? 0.5 : 1,
                    }}
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="v2-card space-y-4">
          <div>
            <strong className="v2-text-primary" style={{ display: "block", marginBottom: "var(--v2-spacing-sm)", fontFamily: "var(--v2-font-serif)" }}>
              {t.included}
            </strong>
            <ul className="v2-card-content" style={{ margin: 0, paddingLeft: "var(--v2-spacing-lg)" }}>
              {t.includedItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </V2PageContainer>
  );
}


