"use client";

import { useMemo } from "react";
import zh from "../../../locales/zh/about.json";
import en from "../../../locales/en/about.json";
import Link from "next/link";

type Locale = "zh" | "en";
type PageProps = {
  params: { locale: Locale };
};

const translations: Record<Locale, typeof zh> = {
  zh,
  en,
};

export default function AboutPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const t = useMemo(() => translations[locale], [locale]);

  return (
    <div
      style={{
        padding: "6rem 1.5rem 3rem",
        maxWidth: "960px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2.4rem", color: "#2C3E30" }}>{t.title}</h1>
        <p style={{ margin: 0, color: "#4A5A50", lineHeight: 1.7 }}>{t.mission}</p>
        <p style={{ margin: 0, color: "#4A5A50", lineHeight: 1.7 }}>{t.vision}</p>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{locale === "zh" ? "产品理念" : "Our Philosophy"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "#2C3E30", lineHeight: 1.8 }}>
          {t.intro.map((paragraph, idx) => (
            <p key={idx} style={{ margin: 0 }}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t.values.title}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {t.values.items.map((item) => (
            <article
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.92)",
                borderRadius: "16px",
                padding: "1.5rem",
                border: "1px solid #C6A969",
                boxShadow: "0 10px 20px rgba(198, 169, 105, 0.18)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <h3 style={{ margin: 0, color: "#8DAE92", fontSize: "1.1rem" }}>{item.label}</h3>
              <p style={{ margin: 0, color: "#2C3E30", lineHeight: 1.6 }}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t.team.title}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {t.team.members.map((member) => (
            <article
              key={member.name}
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: "16px",
                padding: "1.5rem",
                border: "1px solid rgba(141, 174, 146, 0.6)",
                boxShadow: "0 12px 24px rgba(141, 174, 146, 0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <h3 style={{ margin: 0, color: "#C6A969", fontSize: "1.1rem" }}>{member.name}</h3>
              <p style={{ margin: 0, color: "#8DAE92", fontWeight: 600 }}>{member.role}</p>
              <p style={{ margin: 0, color: "#2C3E30", lineHeight: 1.6 }}>{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{t.contact.title}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "#2C3E30" }}>
          <span>{t.contact.email}</span>
          <span>{t.contact.address}</span>
        </div>
      </section>

      <div style={{ textAlign: "center" }}>
        <Link href="/privacy" style={linkStyle}>
          {locale === "zh" ? "查看隐私政策" : "View Privacy Policy"}
        </Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  borderRadius: "20px",
  padding: "2rem",
  boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.6rem",
  color: "#2C3E30",
};

const linkStyle: React.CSSProperties = {
  color: "#8DAE92",
  fontWeight: 600,
  textDecoration: "underline",
};







