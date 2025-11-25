"use client";

import UserAuth from "@/components/UserAuth";
import "@/styles/v2-theme.css";

export default function SignInPage({ params }: { params: { locale: "zh" | "en" } }) {
  const { locale } = params;
  const isZh = locale === "zh";

  return (
    <div className="v2-page-container">
      <section className="v2-card" style={{ maxWidth: "720px", margin: "var(--v2-spacing-2xl) auto" }}>
        <div>
          <h1 className="v2-card-title" style={{ marginBottom: "var(--v2-spacing-sm)" }}>
            {isZh ? "登录 SeeQi" : "Sign in to SeeQi"}
          </h1>
          <p className="v2-card-content">
            {isZh
              ? "使用 Google 或海外手机号登录，跨设备同步体质洞察、梦境解读与八卦卦象记录。"
              : "Connect with Google or an international phone number to sync constitution insights, dream analysis, and I Ching records across devices."}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--v2-spacing-lg)" }}>
          <UserAuth locale={locale} />
        </div>
      </section>
    </div>
  );
}
