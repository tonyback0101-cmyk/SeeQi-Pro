"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeDream } from "@/lib/analysis/dreamAnalyzer";
import { loadData, loadStatuses } from "@/state/assessmentStorage";
import type { DreamRecordData, ModuleStatus } from "@/types/assessment";

const LABELS = {
  zh: {
    title: "梦境解析报告",
    description: "回顾梦境关键词、潜意识洞察与建议。",
    missing: "尚未记录梦境内容，完成“梦境记录”即可生成报告。",
    goCapture: "前往梦境记录",
    backHub: "返回报告中心",
    keywords: "梦境关键词",
    advice: "个性化建议",
  },
  en: {
    title: "Dream Insight Report",
    description: "Review extracted symbols, subconscious messages, and guidance.",
    missing: "No dream entry yet. Complete the Dream Record module to view this report.",
    goCapture: "Go to Dream Record",
    backHub: "Back to Report Hub",
    keywords: "Dream keywords",
    advice: "Personalised advice",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function DreamReportPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const copy = LABELS[locale];

  const [dreamData, setDreamData] = useState<DreamRecordData | undefined>();
  const [status, setStatus] = useState<ModuleStatus>("not_started");

  useEffect(() => {
    const stored = loadData();
    setDreamData(stored.dream);
    setStatus(loadStatuses().dream);
  }, []);

  const result = useMemo(() => {
    if (!dreamData) return null;
    return analyzeDream(dreamData.narrative, dreamData.emotion || "neutral");
  }, [dreamData]);

  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.8rem",
      }}
    >
      <header
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "26px",
          padding: "2.2rem 2rem",
          boxShadow: "0 18px 38px rgba(140, 122, 230, 0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2.2rem", color: "#2C3E30" }}>{copy.title}</h1>
        <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.75)", lineHeight: 1.6 }}>{copy.description}</p>
        <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.6)" }}>
          Status: {locale === "zh" ? statusToZh(status) : statusToEn(status)}
        </p>
      </header>

      {result && dreamData ? (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(140, 122, 230, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>{dreamData.narrative}</p>
          <p style={{ margin: 0 }}>{result.summary}</p>
          <strong style={{ color: "#2C3E30" }}>{copy.keywords}</strong>
          <ul style={listStyle}>
            {result.symbolDetails.slice(0, 6).map((symbol) => (
              <li key={symbol.key}>
                {locale === "zh"
                  ? `${symbol.meaning} · 元素：${symbol.element}`
                  : `${symbol.meaning} · Element: ${symbol.element}`}
                {symbol.subtext?.archetype && (
                  <p style={{ margin: "0.3rem 0 0", color: "rgba(72, 66, 53, 0.7)", fontSize: "0.92rem" }}>
                    {symbol.subtext.archetype}
                  </p>
                )}
                {symbol.subtext?.affirmation && (
                  <p style={{ margin: "0.15rem 0 0", color: "#4C5FD7", fontSize: "0.9rem" }}>
                    {symbol.subtext.affirmation}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <strong style={{ color: "#2C3E30" }}>{copy.advice}</strong>
          <ul style={listStyle}>
            {result.advice.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>{result.interpretation}</p>
        </section>
      ) : (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(140, 122, 230, 0.22)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)" }}>{copy.missing}</p>
          <Link href={`/${locale}/dream-record`} style={linkButtonStyle}>
            {copy.goCapture}
          </Link>
        </section>
      )}

      <Link href={`/${locale}/analysis-result`} style={{ ...linkButtonStyle, background: "transparent", color: "#4C5FD7", border: "1px solid rgba(76, 95, 215, 0.4)" }}>
        ← {copy.backHub}
      </Link>
    </main>
  );
}

function statusToZh(status: ModuleStatus) {
  switch (status) {
    case "completed":
      return "已完成";
    case "in_progress":
      return "进行中";
    case "skipped":
      return "已跳过";
    default:
      return "未开始";
  }
}

function statusToEn(status: ModuleStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    case "skipped":
      return "Skipped";
    default:
      return "Not started";
  }
}

const listStyle: React.CSSProperties = {
  margin: "0",
  paddingLeft: "1.2rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
  color: "rgba(44, 62, 48, 0.78)",
};

const linkButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.75rem 1.4rem",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #8C7AE6, #4C5FD7)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 14px 24px rgba(140, 122, 230, 0.3)",
};

