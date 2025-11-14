import SubscribeButton from "@/components/SubscribeButton";

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
    <div
      style={{
        maxWidth: "min(100%, 1024px)",
        margin: "0 auto",
        padding: "2rem clamp(0.12rem, 0.5vw, 0.3rem) 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <section
        style={{
          background: "rgba(255, 255, 255, 0.96)",
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          boxShadow: "0 24px 48px rgba(45, 63, 49, 0.16)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "2.4rem",
              color: "#2C3E30",
              textAlign: "center",
            }}
          >
            {isZh ? "升级 SeeQi 专业版" : "Upgrade to SeeQi Pro"}
          </h1>
          <p
            style={{
              margin: "0.75rem auto 0",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              color: "rgba(44, 62, 48, 0.78)",
              maxWidth: "640px",
              textAlign: "center",
            }}
          >
            {isZh
              ? "解锁掌纹识别、舌象健康、五行体质与梦境解析的全量 AI 报告，涵盖每日调养、专属推广返佣等高级功能。"
              : "Unlock full AI reports for palmistry, tongue health, five-element insights and dream decoding, plus daily wellness guidance and affiliate rewards."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {(isZh ? FEATURES_ZH : FEATURES_EN).map((item) => (
            <div
              key={item}
              style={{
                background: "rgba(141, 174, 146, 0.1)",
                borderRadius: "18px",
                padding: "1rem 1.25rem",
                fontWeight: 600,
                color: "#2C3E30",
                letterSpacing: "0.01em",
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
            gap: "0.6rem",
            alignItems: "center",
          }}
        >
          <SubscribeButton locale={locale} initiallyOpen={shouldOpenPlans} />
        </div>
      </section>

      <section
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "18px",
          padding: "1.5rem 1.75rem",
          color: "rgba(44, 62, 48, 0.75)",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
        }}
      >
        <div>
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
            {isZh ? "包含内容" : "What's included"}
          </strong>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>{isZh ? "AI 报告将实时同步至账户，并可导出 PDF" : "AI reports sync to your account and can be exported as PDF."}</li>
            <li>{isZh ? "支付由 Stripe 托管，支持主流信用卡" : "Payments are handled securely by Stripe."}</li>
            <li>{isZh ? "升级后可立即加入推广返佣计划" : "Upgrade unlocks the affiliate rewards program instantly."}</li>
          </ul>
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(141, 174, 146, 0.2)",
            paddingTop: "1.1rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {optionCopy.map((item) => (
            <div
              key={item.title}
              style={{
                borderRadius: "16px",
                border: "1px dashed rgba(141, 174, 146, 0.35)",
                padding: "1rem 1.2rem",
                background: "rgba(141, 174, 146, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <strong style={{ color: "#2C3E30" }}>{item.title}</strong>
              <span style={{ fontSize: "0.9rem" }}>{item.description}</span>
              <span
                style={{
                  marginTop: "0.35rem",
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "999px",
                  background: "rgba(198, 169, 105, 0.15)",
                  color: "#8B5E00",
                  fontSize: "0.8rem",
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
  );
}
