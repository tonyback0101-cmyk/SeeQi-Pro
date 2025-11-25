"use client";

import { useSearchParams } from "next/navigation";
import { V2PageContainer, V2PageTitle, V2Text } from "@/components/v2/layout";
import SubscribeButtonV2 from "@/components/v2/SubscribeButtonV2";
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

export default function SubscriptionPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const t = TEXT[locale];
  const searchParams = useSearchParams();
  const shouldOpenPlans = searchParams?.get("open") === "1";

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

          <div className="flex justify-center">
            <SubscribeButtonV2 locale={locale} initiallyOpen={shouldOpenPlans} />
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


