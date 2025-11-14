"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeConstitution } from "@/lib/analysis/constitutionAnalyzer";
import type { TongueData } from "@/lib/analysis/constitutionAnalyzer";
import { loadData, loadStatuses } from "@/state/assessmentStorage";
import type { TongueRecordData, ModuleStatus } from "@/types/assessment";

const LABELS = {
  zh: {
    title: "舌相健康报告",
    description: "解析舌色、苔象与形态，为你提供调理建议。",
    missing: "尚未记录舌相数据，完成“舌相采集”即可生成报告。",
    goCapture: "前往舌相采集",
    backHub: "返回报告中心",
    focus: "调理方向",
  },
  en: {
    title: "Tongue Health Report",
    description: "Review analysis of tongue colour, coating and shape for balanced guidance.",
    missing: "No tongue capture data saved. Complete the Tongue Capture module to view this report.",
    goCapture: "Go to Tongue Capture",
    backHub: "Back to Report Hub",
    focus: "Focus areas",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function TongueReportPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const copy = LABELS[locale];

  const [tongueData, setTongueData] = useState<TongueRecordData | undefined>();
  const [status, setStatus] = useState<ModuleStatus>("not_started");

  useEffect(() => {
    const stored = loadData();
    setTongueData(stored.tongue);
    setStatus(loadStatuses().tongue);
  }, []);

  const tongueInput = useMemo<TongueData | null>(() => {
    if (!tongueData) return null;
    return {
      ...(tongueData.color ? { color: tongueData.color } : {}),
      ...(tongueData.coating ? { coating: tongueData.coating } : {}),
      ...(tongueData.shape ? { shape: tongueData.shape } : {}),
    };
  }, [tongueData]);

  const analysis = useMemo(() => {
    if (!tongueInput) return null;
    return analyzeConstitution({}, tongueInput, {});
  }, [tongueInput]);

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
          boxShadow: "0 18px 38px rgba(103, 85, 52, 0.18)",
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
            boxShadow: "0 18px 32px rgba(103, 85, 52, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>{analysis.summary}</p>
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
            boxShadow: "0 18px 32px rgba(103, 85, 52, 0.18)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)" }}>{copy.missing}</p>
          <Link href={`/${locale}/tongue-collection`} style={linkButtonStyle}>
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
  background: "linear-gradient(135deg, #C6A969, #8DAE92)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 14px 24px rgba(198, 169, 105, 0.25)",
};

