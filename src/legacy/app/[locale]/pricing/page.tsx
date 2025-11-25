import SubscribeButton from "@/components/SubscribeButton";
import "@/styles/v2-theme.css";

const FEATURES_ZH = [
  "掌纹与舌象 AI 深度分析",
  "五行体质画像 + 养生建议",
  "梦境解读与情绪洞察",
  "每日节气调养提示",
  "高级报告导出与分享",
  "专属推广返佣计划",
];

const FEATURES_EN = [
  "AI-powered palmistry & tongue diagnostics",
  "Personal five-element profile & wellness plan",
  "Dream decoding with emotional insights",
  "Daily solar-term wellness guidance",
  "Advanced report export & sharing",
  "Affiliate rewards program",
];

const PAY_OPTIONS = {
  zh: [
    {
      title: "PayPal 一次性购买",
      description: "适合仅需单次专业报告的用户，支持国际 PayPal 账号。",
      status: "即将上线",
    },
    {
      title: "Apple / Google 内购",
      description: "移动端订阅版本即将开放，可直接在 App 内完成支付与续费。",
      status: "筹备中",
    },
  ],
  en: [
    {
      title: "PayPal One-time Purchase",
      description: "Great for one-off deep reports using an international PayPal account.",
      status: "Coming soon",
    },
    {
      title: "Apple / Google In-app",
      description: "Mobile in-app subscriptions coming soon for direct purchase and renewal.",
      status: "In preparation",
    },
  ],
} as const;

export default function PricingPage({
  params,
  searchParams,
}: {
  params: { locale: "zh" | "en" };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { locale } = params;
  const isZh = locale === "zh";
  const optionCopy = PAY_OPTIONS[isZh ? "zh" : "en"];
  const shouldOpenPlans = (() => {
    if (!searchParams) return false;
    const raw = typeof searchParams.plans === "string" ? searchParams.plans : Array.isArray(searchParams.plans) ? searchParams.plans[0] : undefined;
    const alt = typeof searchParams.openPlans === "string" ? searchParams.openPlans : Array.isArray(searchParams.openPlans) ? searchParams.openPlans[0] : undefined;
    const flag = raw ?? alt;
    if (!flag) return false;
    return ["open", "1", "true"].includes(flag.toLowerCase());
  })();

  return (
    <div className="v2-page-container">
      <div
        style={{
          maxWidth: "min(100%, 1024px)",
          margin: "0 auto",
          padding: "var(--v2-spacing-xl) clamp(0.12rem, 0.5vw, 0.3rem) var(--v2-spacing-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--v2-spacing-xl)",
        }}
      >
        <section className="v2-card">
          <div>
            <h1 className="v2-card-title" style={{ textAlign: "center", marginBottom: "var(--v2-spacing-md)" }}>
              {isZh ? "升级 SeeQi 专业版" : "Upgrade to SeeQi Pro"}
            </h1>
            <p className="v2-card-content" style={{ maxWidth: "640px", margin: "var(--v2-spacing-md) auto 0", textAlign: "center" }}>
              {isZh
                ? "解锁掌纹识别、舌象健康、五行体质与梦境解析的全量 AI 报告，涵盖每日调养、专属推广返佣等高级功能。"
                : "Unlock full AI reports for palmistry, tongue health, five-element insights and dream decoding, plus daily wellness guidance and affiliate rewards."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "var(--v2-spacing-md)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: "var(--v2-spacing-lg)",
            }}
          >
            {(isZh ? FEATURES_ZH : FEATURES_EN).map((item) => (
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
              display: "flex",
              flexDirection: "column",
              gap: "var(--v2-spacing-sm)",
              alignItems: "center",
              marginTop: "var(--v2-spacing-lg)",
            }}
          >
            <SubscribeButton locale={locale} initiallyOpen={shouldOpenPlans} />
          </div>
        </section>

        <section className="v2-card">
          <div>
            <strong className="v2-text-primary" style={{ display: "block", marginBottom: "var(--v2-spacing-sm)", fontFamily: "var(--v2-font-serif)" }}>
              {isZh ? "包含内容" : "What's included"}
            </strong>
            <ul className="v2-card-content" style={{ margin: 0, paddingLeft: "var(--v2-spacing-lg)" }}>
              <li>{isZh ? "AI 报告将实时同步至账户，并可导出 PDF" : "AI reports sync to your account and can be exported as PDF."}</li>
              <li>{isZh ? "支付由 Stripe 托管，支持主流信用卡" : "Payments are handled securely by Stripe."}</li>
              <li>{isZh ? "升级后可立即加入推广返佣计划" : "Upgrade unlocks the affiliate rewards program instantly."}</li>
            </ul>
          </div>
          <hr className="v2-divider" />
          <div
            style={{
              display: "grid",
              gap: "var(--v2-spacing-md)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {optionCopy.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: "var(--v2-radius-md)",
                  border: "1px dashed var(--v2-color-border)",
                  padding: "var(--v2-spacing-md) var(--v2-spacing-lg)",
                  background: "rgba(61, 107, 31, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--v2-spacing-xs)",
                }}
              >
                <strong className="v2-text-primary" style={{ fontFamily: "var(--v2-font-serif)" }}>{item.title}</strong>
                <span className="v2-text-secondary" style={{ fontSize: "var(--v2-font-size-sm)" }}>{item.description}</span>
                <span
                  style={{
                    marginTop: "var(--v2-spacing-xs)",
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    padding: "var(--v2-spacing-xs) var(--v2-spacing-sm)",
                    borderRadius: "var(--v2-radius-sm)",
                    background: "rgba(198, 169, 105, 0.15)",
                    color: "#8B5E00",
                    fontSize: "var(--v2-font-size-xs)",
                    fontWeight: 600,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import "@/styles/v2-theme.css";

const FEATURES_ZH = [
  "掌纹与舌象 AI 深度分析",
  "五行体质画像 + 养生建议",
  "梦境解读与情绪洞察",
  "每日节气调养提示",
  "高级报告导出与分享",
  "专属推广返佣计划",
];

const FEATURES_EN = [
  "AI-powered palmistry & tongue diagnostics",
  "Personal five-element profile & wellness plan",
  "Dream decoding with emotional insights",
  "Daily solar-term wellness guidance",
  "Advanced report export & sharing",
  "Affiliate rewards program",
];

const PAY_OPTIONS = {
  zh: [
    {
      title: "PayPal 一次性购买",
      description: "适合仅需单次专业报告的用户，支持国际 PayPal 账号。",
      status: "即将上线",
    },
    {
      title: "Apple / Google 内购",
      description: "移动端订阅版本即将开放，可直接在 App 内完成支付与续费。",
      status: "筹备中",
    },
  ],
  en: [
    {
      title: "PayPal One-time Purchase",
      description: "Great for one-off deep reports using an international PayPal account.",
      status: "Coming soon",
    },
    {
      title: "Apple / Google In-app",
      description: "Mobile in-app subscriptions coming soon for direct purchase and renewal.",
      status: "In preparation",
    },
  ],
} as const;

export default function PricingPage({
  params,
  searchParams,
}: {
  params: { locale: "zh" | "en" };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { locale } = params;
  const isZh = locale === "zh";
  const optionCopy = PAY_OPTIONS[isZh ? "zh" : "en"];
  const shouldOpenPlans = (() => {
    if (!searchParams) return false;
    const raw = typeof searchParams.plans === "string" ? searchParams.plans : Array.isArray(searchParams.plans) ? searchParams.plans[0] : undefined;
    const alt = typeof searchParams.openPlans === "string" ? searchParams.openPlans : Array.isArray(searchParams.openPlans) ? searchParams.openPlans[0] : undefined;
    const flag = raw ?? alt;
    if (!flag) return false;
    return ["open", "1", "true"].includes(flag.toLowerCase());
  })();

  return (
    <div className="v2-page-container">
      <div
        style={{
          maxWidth: "min(100%, 1024px)",
          margin: "0 auto",
          padding: "var(--v2-spacing-xl) clamp(0.12rem, 0.5vw, 0.3rem) var(--v2-spacing-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--v2-spacing-xl)",
        }}
      >
        <section className="v2-card">
          <div>
            <h1 className="v2-card-title" style={{ textAlign: "center", marginBottom: "var(--v2-spacing-md)" }}>
              {isZh ? "升级 SeeQi 专业版" : "Upgrade to SeeQi Pro"}
            </h1>
            <p className="v2-card-content" style={{ maxWidth: "640px", margin: "var(--v2-spacing-md) auto 0", textAlign: "center" }}>
              {isZh
                ? "解锁掌纹识别、舌象健康、五行体质与梦境解析的全量 AI 报告，涵盖每日调养、专属推广返佣等高级功能。"
                : "Unlock full AI reports for palmistry, tongue health, five-element insights and dream decoding, plus daily wellness guidance and affiliate rewards."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "var(--v2-spacing-md)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: "var(--v2-spacing-lg)",
            }}
          >
            {(isZh ? FEATURES_ZH : FEATURES_EN).map((item) => (
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
              display: "flex",
              flexDirection: "column",
              gap: "var(--v2-spacing-sm)",
              alignItems: "center",
              marginTop: "var(--v2-spacing-lg)",
            }}
          >
            <SubscribeButton locale={locale} initiallyOpen={shouldOpenPlans} />
          </div>
        </section>

        <section className="v2-card">
          <div>
            <strong className="v2-text-primary" style={{ display: "block", marginBottom: "var(--v2-spacing-sm)", fontFamily: "var(--v2-font-serif)" }}>
              {isZh ? "包含内容" : "What's included"}
            </strong>
            <ul className="v2-card-content" style={{ margin: 0, paddingLeft: "var(--v2-spacing-lg)" }}>
              <li>{isZh ? "AI 报告将实时同步至账户，并可导出 PDF" : "AI reports sync to your account and can be exported as PDF."}</li>
              <li>{isZh ? "支付由 Stripe 托管，支持主流信用卡" : "Payments are handled securely by Stripe."}</li>
              <li>{isZh ? "升级后可立即加入推广返佣计划" : "Upgrade unlocks the affiliate rewards program instantly."}</li>
            </ul>
          </div>
          <hr className="v2-divider" />
          <div
            style={{
              display: "grid",
              gap: "var(--v2-spacing-md)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {optionCopy.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: "var(--v2-radius-md)",
                  border: "1px dashed var(--v2-color-border)",
                  padding: "var(--v2-spacing-md) var(--v2-spacing-lg)",
                  background: "rgba(61, 107, 31, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--v2-spacing-xs)",
                }}
              >
                <strong className="v2-text-primary" style={{ fontFamily: "var(--v2-font-serif)" }}>{item.title}</strong>
                <span className="v2-text-secondary" style={{ fontSize: "var(--v2-font-size-sm)" }}>{item.description}</span>
                <span
                  style={{
                    marginTop: "var(--v2-spacing-xs)",
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    padding: "var(--v2-spacing-xs) var(--v2-spacing-sm)",
                    borderRadius: "var(--v2-radius-sm)",
                    background: "rgba(198, 169, 105, 0.15)",
                    color: "#8B5E00",
                    fontSize: "var(--v2-font-size-xs)",
                    fontWeight: 600,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

