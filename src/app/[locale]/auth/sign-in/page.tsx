"use client";

import UserAuth from "@/components/UserAuth";

export default function SignInPage({ params }: { params: { locale: "zh" | "en" } }) {
  const { locale } = params;
  const isZh = locale === "zh";

  return (
    <section
      style={{
        maxWidth: "720px",
        margin: "2rem auto",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "28px",
        padding: "2.5rem 2rem",
        boxShadow: "0 28px 54px rgba(20, 32, 24, 0.12)",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.9rem", marginBottom: "0.5rem", color: "#2C3E30" }}>
          {isZh ? "登录 SeeQi" : "Sign in to SeeQi"}
        </h1>
        <p style={{ color: "rgba(44,62,48,0.75)", lineHeight: 1.7 }}>
          {isZh
            ? "使用 Google 或海外手机号登录，跨设备同步体质洞察、梦境解读与八卦卦象记录。"
            : "Connect with Google or an international phone number to sync constitution insights, dream analysis, and I Ching records across devices."}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <UserAuth locale={locale} />
      </div>
    </section>
  );
}
