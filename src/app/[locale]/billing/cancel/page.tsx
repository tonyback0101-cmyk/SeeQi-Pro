import Link from "next/link";

export default function BillingCancelPage({ params }: { params: { locale: "zh" | "en" } }) {
  const { locale } = params;
  const isZh = locale === "zh";

  return (
    <section
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        background: "rgba(255, 255, 255, 0.92)",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 24px 48px rgba(20, 32, 24, 0.08)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", color: "#2C3E30", marginBottom: "1rem" }}>
        {isZh ? "支付尚未完成" : "Payment not completed"}
      </h1>
      <p style={{ color: "rgba(44,62,48,0.7)", lineHeight: 1.7 }}>
        {isZh
          ? "您可以随时返回继续结账。若遇到问题，请联系 support@seeqi.health 获取帮助。"
          : "Feel free to resume checkout anytime. If something went wrong, reach us at support@seeqi.health."}
      </p>
      <p style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
        {isZh
          ? "回到报告页面再次点击“解锁专业版”即可重新唤起支付。"
          : "Return to your report and click “Unlock Pro” again to restart checkout."}
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "1.5rem",
        }}
      >
        <Link
          href={`/${locale}/analyze`}
          style={{
            borderRadius: "999px",
            padding: "0.65rem 1.75rem",
            background: "linear-gradient(135deg,#8DAE92,#C6A969)",
            color: "#fff",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 16px 32px rgba(44, 62, 48, 0.18)",
          }}
        >
          {isZh ? "返回测评页" : "Back to assessment"}
        </Link>
        <Link
          href={`/${locale}`}
          style={{
            borderRadius: "999px",
            padding: "0.65rem 1.75rem",
            border: "1px solid rgba(44,62,48,0.25)",
            background: "#fff",
            color: "#2C3E30",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 12px 24px rgba(44, 62, 48, 0.08)",
          }}
        >
          {isZh ? "返回首页" : "Home"}
        </Link>
      </div>
    </section>
  );
}
