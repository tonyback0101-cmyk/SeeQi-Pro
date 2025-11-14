import Link from "next/link";
import BillingSuccessState from "@/components/billing/BillingSuccessState";

export default function BillingSuccessPage({ params }: { params: { locale: "zh" | "en" } }) {
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
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.9rem", color: "#2C3E30", margin: 0 }}>
        {isZh ? "支付成功" : "Payment successful"}
      </h1>
      <p style={{ color: "rgba(44,62,48,0.72)", lineHeight: 1.7, margin: 0 }}>
        {isZh
          ? "感谢您升级 SeeQi 专业版，系统正在为您同步高级功能权限。一般在 1 分钟内完成，如未解锁可手动刷新。"
          : "Thank you for upgrading to SeeQi Pro. We are syncing your premium access now. It usually completes within a minute; refresh if it takes longer."}
      </p>
      <BillingSuccessState locale={locale} />
      <p style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.95rem", margin: 0 }}>
        {isZh
          ? "若是在新标签页完成支付，请返回报告页面并刷新即可查看完整版。"
          : "If checkout opened in a new tab, switch back to your report and refresh to see the full version."}
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          flexWrap: "wrap",
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
          {isZh ? "继续生成新报告" : "Start a new assessment"}
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
          {isZh ? "返回首页" : "Back to home"}
        </Link>
      </div>
    </section>
  );
}
