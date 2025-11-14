"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeFengshui } from "@/lib/analysis/fengshuiAdvisor";
import { loadData, loadStatuses } from "@/state/assessmentStorage";
import type { FengshuiRecordData, ModuleStatus } from "@/types/assessment";

const LABELS = {
  zh: {
    title: "五行风水报告",
    description: "根据居住信息与目标，为你提供空间调理建议。",
    missing: "尚未填写五行风水资料，完成“风水填写”即可生成报告。",
    goCapture: "前往五行风水填写",
    backHub: "返回报告中心",
    space: "空间优化建议",
    ritual: "日常仪式",
    goal: "目标定制",
  },
  en: {
    title: "Five-Element Fengshui Report",
    description: "Insights tailored to your living space, orientation, and personal goals.",
    missing: "No fengshui data yet. Complete the Fengshui Input module to generate this report.",
    goCapture: "Go to Fengshui Input",
    backHub: "Back to Report Hub",
    space: "Space optimisation",
    ritual: "Daily rituals",
    goal: "Goal-focused tips",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function FengshuiReportPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const copy = LABELS[locale];

  const [data, setData] = useState<FengshuiRecordData | undefined>();
  const [status, setStatus] = useState<ModuleStatus>("not_started");

  useEffect(() => {
    const stored = loadData();
    setData(stored.fengshui);
    setStatus(loadStatuses().fengshui);
  }, []);

  const result = useMemo(() => {
    if (!data) return null;
    return analyzeFengshui(data, locale);
  }, [data, locale]);

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
          boxShadow: "0 18px 38px rgba(122, 157, 127, 0.18)",
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

      {result ? (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(122, 157, 127, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>{result.headline}</p>
          <p style={{ margin: 0 }}>{result.description}</p>

          <strong style={{ color: "#2C3E30" }}>{copy.space}</strong>
          <ul style={listStyle}>
            {result.spaceTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <strong style={{ color: "#2C3E30" }}>{copy.ritual}</strong>
          <ul style={listStyle}>
            {result.ritualTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {result.goals.length > 0 && (
            <>
              <strong style={{ color: "#2C3E30" }}>{copy.goal}</strong>
              <ul style={listStyle}>
                {result.goals.map((goal) => (
                  <li key={goal.goal}>
                    <span style={{ display: "block", fontWeight: 600 }}>{goal.goal}</span>
                    <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                      {goal.suggestions.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </li>
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
            boxShadow: "0 18px 32px rgba(122, 157, 127, 0.22)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)" }}>{copy.missing}</p>
          <Link href={`/${locale}/fengshui-input`} style={linkButtonStyle}>
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
  background: "linear-gradient(135deg, #7A9D7F, #8DAE92)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 14px 24px rgba(122, 157, 127, 0.25)",
};

