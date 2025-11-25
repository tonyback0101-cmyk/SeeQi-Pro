import Link from "next/link";
import "@/styles/v2-theme.css";

export default function BillingCancelPage({ params }: { params: { locale: "zh" | "en" } }) {
  const { locale } = params;
  const isZh = locale === "zh";

  return (
    <div className="v2-page-container">
      <section className="v2-card" style={{ maxWidth: "720px", margin: "var(--v2-spacing-2xl) auto", textAlign: "center" }}>
        <h1 className="v2-card-title" style={{ marginBottom: "var(--v2-spacing-md)" }}>
          {isZh ? "支付尚未完成" : "Payment not completed"}
        </h1>
        <p className="v2-card-content" style={{ marginBottom: "var(--v2-spacing-sm)" }}>
          {isZh
            ? "您可以随时返回继续结账。若遇到问题，请联系 support@seeqi.health 获取帮助。"
            : "Feel free to resume checkout anytime. If something went wrong, reach us at support@seeqi.health."}
        </p>
        <p className="v2-text-muted" style={{ fontSize: "var(--v2-font-size-sm)", marginBottom: "var(--v2-spacing-lg)" }}>
          {isZh
            ? "回到报告页面再次点击「解锁专业版」即可重新唤起支付。"
            : "Return to your report and click \"Unlock Pro\" again to restart checkout."}
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
            {isZh ? "返回测评页" : "Back to assessment"}
          </Link>
          <Link href={`/${locale}`} className="v2-button v2-button-secondary">
            {isZh ? "返回首页" : "Home"}
          </Link>
        </div>
      </section>
    </div>
  );
}
