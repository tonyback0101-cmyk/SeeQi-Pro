"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { generateHexagram } from "@/lib/analysis/ichingGenerator";
import type { HexagramEntry, HexagramLine } from "@/lib/analysis/ichingGenerator";
import HexagramDisplay from "@/components/iching/HexagramDisplay";
import type { HexagramMeta, IchingLine } from "@/lib/ichingGenerator";
import { loadData, loadStatuses } from "@/state/assessmentStorage";
import type { IChingRecordData, ModuleStatus } from "@/types/assessment";

const LABELS = {
  zh: {
    title: "周易卦象报告",
    description: "回顾你的提问与对应卦象，获取现代生活启示。",
    missing: "尚未保存卦象数据，完成“周易卦象推演”即可生成报告。",
    goCapture: "前往周易卦象推演",
    backHub: "返回报告中心",
    modern: "现代启示",
  },
  en: {
    title: "I Ching Hexagram Report",
    description: "Review your recorded inquiry, hexagram, and modern advice.",
    missing: "No casting saved yet. Complete the I Ching Casting module to see this report.",
    goCapture: "Go to I Ching Casting",
    backHub: "Back to Report Hub",
    modern: "Modern guidance",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function IChingReportPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const copy = LABELS[locale];

  const [data, setData] = useState<IChingRecordData | undefined>();
  const [status, setStatus] = useState<ModuleStatus>("not_started");

  useEffect(() => {
    const stored = loadData();
    setData(stored.iching);
    setStatus(loadStatuses().iching);
  }, []);

  const reading = useMemo(() => {
    if (!data) return null;
    const raw = generateHexagram(data.createdAt);
    // Convert HexagramEntry to HexagramMeta for HexagramDisplay component
    const convertToMeta = (entry: HexagramEntry, id: string): HexagramMeta => ({
      id,
      name: entry.name.replace("卦", ""),
      description: entry.chinese,
      judgement: entry.judgment,
      image: entry.image,
      lineTexts: entry.lines ? Object.values(entry.lines) : [],
      modernAdvice: "",
    });
    const convertLines = (lines: HexagramLine[]): IchingLine[] =>
      lines.map((line) => ({
        position: line.position as 1 | 2 | 3 | 4 | 5 | 6,
        value: line.value as 6 | 7 | 8 | 9,
        type: line.type as "yin" | "yang",
        isChanging: line.changing,
        traditionalMeaning: raw.base.lines?.[line.position] || "",
        modernReflection: "",
      }));
    return {
      base: convertToMeta(raw.base, raw.baseId.toString()),
      changing: raw.changing ? convertToMeta(raw.changing, raw.changingId!.toString()) : undefined,
      lines: convertLines(raw.lines),
      interpretation: raw.interpretation,
    };
  }, [data]);

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
          boxShadow: "0 18px 38px rgba(76, 95, 215, 0.18)",
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

      {reading && data ? (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(76, 95, 215, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ margin: 0, color: "rgba(72, 66, 53, 0.7)" }}>
            {locale === "zh"
              ? `问题：「${data.question}」 · 方式：${methodLabelZh[data.method]}`
              : `Question: "${data.question}" · Method: ${methodLabelEn[data.method]}`}
          </p>
          <HexagramDisplay
            baseHexagram={reading.base}
            changingHexagram={reading.changing}
            lines={reading.lines}
            locale={locale}
          />
          <p style={{ margin: 0 }}>{reading.base.description} · {reading.base.judgement}</p>
          <p style={{ margin: 0 }}>{reading.base.image}</p>
          <strong style={{ color: "#2C3E30" }}>{copy.modern}</strong>
          <ul style={listStyle}>
            {Object.entries(reading.interpretation).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        </section>
      ) : (
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "1.8rem",
            boxShadow: "0 18px 32px rgba(76, 95, 215, 0.22)",
          }}
        >
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)" }}>{copy.missing}</p>
          <Link href={`/${locale}/iching-cast`} style={linkButtonStyle}>
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

const methodLabelZh: Record<IChingRecordData["method"], string> = {
  three_coin: "三枚铜钱",
  manual: "蓍草手摇",
  virtual: "虚拟易算法",
};

const methodLabelEn: Record<IChingRecordData["method"], string> = {
  three_coin: "Three-coin",
  manual: "Manual yarrow",
  virtual: "Virtual algorithm",
};

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
  background: "linear-gradient(135deg, #4C5FD7, #8C7AE6)",
  color: "#fff",
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 14px 24px rgba(76, 95, 215, 0.25)",
};

