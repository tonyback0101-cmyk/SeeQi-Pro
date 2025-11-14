import React from "react";
import zh from "../../../locales/zh/privacy.json";
import en from "../../../locales/en/privacy.json";

type Locale = "zh" | "en";

type PageProps = {
  params: { locale: Locale };
};

const translations: Record<Locale, typeof zh> = {
  zh,
  en,
};

export default function PrivacyPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const t = translations[locale];

  const pageStyle: React.CSSProperties = {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "4rem 1.5rem 5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.8rem",
    color: "#2c3e30",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    textAlign: "center",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.94)",
    borderRadius: "24px",
    padding: "2rem",
    boxShadow: "0 20px 38px rgba(45, 64, 51, 0.12)",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
    lineHeight: 1.65,
  };

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 2.6rem)" }}>{t.title}</h1>
        <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)", lineHeight: 1.6 }}>{t.subtitle}</p>
        <span style={{ color: "rgba(72, 66, 53, 0.6)", fontSize: "0.9rem" }}>{t.updatedAt}</span>
      </header>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#234035" }}>{t.sections.health.title}</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {t.sections.health.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#234035" }}>{t.sections.data.title}</h2>
        <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.78)" }}>{t.sections.data.description}</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {t.sections.data.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#234035" }}>{t.sections.usage.title}</h2>
        <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.78)" }}>{t.sections.usage.description}</p>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#234035" }}>{t.sections.rights.title}</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {t.sections.rights.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#234035" }}>{t.sections.contact.title}</h2>
        <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.78)" }}>{t.sections.contact.description}</p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          main section {
            padding: 1.6rem 1.4rem !important;
          }
        }
      ` }} />
    </main>
  );
}

