"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";

const TEXT = {
  zh: {
    title: "模拟支付流程",
    summary: "以下为测试环境的支付界面示例。实际集成 Stripe 后，这里会自动跳转到 Stripe 的安全收银台。",
    amountLabel: "应付金额",
    description: "解锁完整分析报告",
    reportNoted: "报告编号",
    confirm: "模拟支付成功",
    cancel: "返回报告页",
    warning:
      "当前为演示模式，未真正发起 Stripe 付款。若要验证真实流程，请在 .env.local 中配置 STRIPE_SECRET_KEY 与价格 ID。",
  },
  en: {
    title: "Mock Checkout",
    summary:
      "This is a mock checkout screen for testing. Once Stripe is fully configured, this flow will redirect to Stripe's secure checkout.",
    amountLabel: "Amount Due",
    description: "Unlock the full analysis report",
    reportNoted: "Report ID",
    confirm: "Simulate Successful Payment",
    cancel: "Back to Report",
    warning:
      "You are currently in demo mode. No real charge will be made. Configure STRIPE_SECRET_KEY and price IDs in .env.local to enable real payments.",
  },
} as const;

export default function MockCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const localeParam = searchParams.get("locale");
  const locale = localeParam === "en" ? "en" : "zh";
  const t = TEXT[locale];

  const price = useMemo(() => {
    const fallback = locale === "zh" ? "US$1.00" : "US$1.00";
    return searchParams.get("amount") ?? fallback;
  }, [searchParams, locale]);

  const reportId = searchParams.get("report") ?? "N/A";
  const reason = searchParams.get("reason") ?? "";
  const message = searchParams.get("message") ?? "";

  const handleConfirm = () => {
    router.replace(`/${locale}/analysis-result/${reportId}?session_id=mock-success`);
  };

  const handleCancel = () => {
    router.replace(`/${locale}/analysis-result/${reportId}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #f0f6f4 0%, #fdf7ef 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "min(480px, 100%)",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 32px 64px rgba(36, 64, 53, 0.18)",
          padding: "2rem 2.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.6rem",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.9rem", color: "#1f3c2f" }}>{t.title}</h1>
          <p style={{ margin: 0, color: "rgba(31,60,47,0.68)", lineHeight: 1.5 }}>{t.summary}</p>
        </header>

        <section
          style={{
            borderRadius: "18px",
            padding: "1.4rem 1.6rem",
            background: "rgba(141,174,146,0.12)",
            border: "1px solid rgba(141,174,146,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "1.05rem", color: "rgba(31,60,47,0.75)" }}>{t.amountLabel}</span>
            <strong style={{ fontSize: "1.6rem", color: "#2c533f" }}>{price}</strong>
          </div>
          <div style={{ color: "rgba(31,60,47,0.72)" }}>
            <div>{t.description}</div>
            <small style={{ color: "rgba(31,60,47,0.5)" }}>
              {t.reportNoted}: <span style={{ fontFamily: "monospace" }}>{reportId}</span>
            </small>
          </div>
        </section>

        {reason ? (
          <section
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(198, 169, 105, 0.35)",
              background: "rgba(198, 169, 105, 0.12)",
              padding: "1rem 1.2rem",
              color: "rgba(120, 84, 21, 0.85)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            <strong>Debug:</strong> {reason}
            {message ? ` · ${decodeURIComponent(message)}` : null}
          </section>
        ) : null}

        <p style={{ color: "rgba(31,60,47,0.6)", fontSize: "0.88rem", lineHeight: 1.5 }}>{t.warning}</p>

        <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              borderRadius: 999,
              padding: "0.65rem 1.4rem",
              border: "1px solid rgba(141,174,146,0.5)",
              background: "transparent",
              color: "#1f3c2f",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              borderRadius: 999,
              padding: "0.7rem 1.6rem",
              border: "none",
              background: "linear-gradient(135deg, #5E8D75, #C6A969)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 16px 32px rgba(36, 64, 53, 0.2)",
            }}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </main>
  );
}


