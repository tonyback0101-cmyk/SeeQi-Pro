import Link from "next/link";
import BillingSuccessState from "@/components/billing/BillingSuccessState";
import "@/styles/v2-theme.css";

export default function BillingSuccessPage({ params }: { params: { locale: "zh" | "en" } }) {
  const { locale } = params;
  const isZh = locale === "zh";

  return (
    <div className="v2-page-container">
      <section className="v2-card" style={{ maxWidth: "720px", margin: "var(--v2-spacing-2xl) auto", textAlign: "center" }}>
        <h1 className="v2-card-title" style={{ marginBottom: "var(--v2-spacing-md)" }}>
          {isZh ? "支付成功" : "Payment successful"}
        </h1>
        <p className="v2-card-content" style={{ marginBottom: "var(--v2-spacing-lg)" }}>
          {isZh
            ? "感谢您升级 SeeQi 专业版，系统正在为您同步高级功能权限。一般在 1 分钟内完成，如未解锁可手动刷新。"
            : "Thank you for upgrading to SeeQi Pro. We are syncing your premium access now. It usually completes within a minute; refresh if it takes longer."}
        </p>
        <BillingSuccessState locale={locale} />
        <p className="v2-text-muted" style={{ fontSize: "var(--v2-font-size-sm)", marginTop: "var(--v2-spacing-lg)", marginBottom: "var(--v2-spacing-lg)" }}>
          {isZh
            ? "若是在新标签页完成支付，请返回报告页面并刷新即可查看完整版。"
            : "If checkout opened in a new tab, switch back to your report and refresh to see the full version."}
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--v2-spacing-sm)",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "var(--v2-spacing-lg)",
          }}
        >
          <Link href={`/${locale}/analyze`} className="v2-button">
            {isZh ? "继续生成新报告" : "Start a new assessment"}
          </Link>
          <Link href={`/${locale}`} className="v2-button v2-button-secondary">
            {isZh ? "返回首页" : "Back to home"}
          </Link>
        </div>
      </section>
    </div>
  );
}
