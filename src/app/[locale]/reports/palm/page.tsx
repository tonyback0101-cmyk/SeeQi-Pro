"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeConstitution } from "@/lib/analysis/constitutionAnalyzer";
import type { PalmData } from "@/lib/analysis/constitutionAnalyzer";
import { loadData, loadStatuses } from "@/state/assessmentStorage";
import type { PalmRecordData, ModuleStatus } from "@/types/assessment";

const LABELS = {
  zh: {
    title: "手相掌纹报告",
    description: "基于你保存的掌纹资料，给出体质与调理建议。",
    missing: "尚未保存手相采集数据，完成“手相采集”模块即可生成报告。",
    goCapture: "前往手相采集",
    backHub: "返回报告中心",
    primary: "主要体质",
    secondary: "次要体质",
    palmHighlights: "掌纹重点",
    focus: "调理方向",
  },
  en: {
    title: "Palm Insight Report",
    description: "Review constitution suggestions generated from your saved palm data.",
    missing: "No palm capture data saved yet. Complete the Palm Capture module to generate this report.",
    goCapture: "Go to Palm Capture",
    backHub: "Back to Report Hub",
    primary: "Primary constitutions",
    secondary: "Secondary constitutions",
    palmHighlights: "Palm highlights",
    focus: "Focus areas",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function PalmReportPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const copy = LABELS[locale];

  const [palmData, setPalmData] = useState<PalmRecordData | undefined>();
  const [status, setStatus] = useState<ModuleStatus>("not_started");

  useEffect(() => {
    const stored = loadData();
    setPalmData(stored.palm);
    setStatus(loadStatuses().palm);
  }, []);

  const palmInput = useMemo<PalmData | null>(() => {
    if (!palmData) return null;
    const lines: NonNullable<PalmData["lines"]> = {};
    if (palmData.lifeLine) lines.life = palmData.lifeLine;
    if (palmData.heartLine) lines.heart = palmData.heartLine;
    if (palmData.headLine) lines.head = palmData.headLine;
    return {
      ...(palmData.color ? { color: palmData.color } : {}),
      ...(palmData.texture ? { texture: palmData.texture } : {}),
      ...(Object.keys(lines).length ? { lines } : {}),
    };
  }, [palmData]);

  const analysis = useMemo(() => {
    if (!palmInput) return null;
    return analyzeConstitution(palmInput, {}, {});
  }, [palmInput]);

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
          boxShadow: "0 18px 38px rgba(45, 64, 51, 0.12)",
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

      {analysis ? (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(45, 64, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>{analysis.summary}</p>
          <p>
            {copy.primary}：{analysis.primaryConstitutions.join(locale === "zh" ? "、" : ", ") || "—"}
          </p>
          <p>
            {copy.secondary}：{analysis.secondaryConstitutions.join(locale === "zh" ? "、" : ", ") || "—"}
          </p>
          {analysis.highlights.length > 0 && (
            <>
              <strong style={{ color: "#2C3E30" }}>{copy.palmHighlights}</strong>
              <ul style={listStyle}>
                {analysis.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {analysis.focusAreas.length > 0 && (
            <>
              <strong style={{ color: "#2C3E30" }}>{copy.focus}</strong>
              <ul style={listStyle}>
                {analysis.focusAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(45, 64, 51, 0.12)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)" }}>{copy.missing}</p>
          <Link
            href={`/${locale}/palm-collection`}
            style={linkButtonStyle}
          >
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
  background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 14px 24px rgba(122, 157, 127, 0.25)",
};

