/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { generateHexagram } from "@/lib/analysis/ichingGenerator";
import { loadData, saveIChingData, markSkipped, resetStatus, markInProgress } from "@/state/assessmentStorage";
import type { IChingRecordData } from "@/types/assessment";
import ModuleNav from "@/components/assessment/ModuleNav";

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

const castingMethods = [
  { value: "three_coin", zh: "掷三枚铜钱", en: "Three-coin method" },
  { value: "manual", zh: "传统手摇蓍草", en: "Manual yarrow stalk" },
  { value: "virtual", zh: "虚拟易经算法", en: "Virtual algorithm" },
] as const;

function resolveLocalizedText(value: unknown, locale: "zh" | "en"): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const map = value as Record<string, unknown>;
    if (typeof map[locale] === "string") return map[locale] as string;
    if (typeof map.default === "string") return map.default as string;
  }
  return null;
}

const defaultGuide = {
  title: {
    zh: "提问与占卜提示",
    en: "Question & casting tips",
  },
  intro: {
    zh: "将疑问表述为开放式句子，专注当下状况即可获得更具启发的卦象。",
    en: "Frame your concern as an open-ended question focused on the present for clearer guidance.",
  },
  steps: [
    {
      zh: "写下当前困扰或目标，越具体越好。",
      en: "Write down your current challenge or goal as specifically as possible.",
    },
    {
      zh: "选择熟悉的占卜方式，三枚铜钱或手动蓍草法均可。",
      en: "Choose the casting method you feel most comfortable with.",
    },
    {
      zh: "占卜后关注动爻与变卦，结合 AI 提示解读。",
      en: "After casting, pay attention to moving lines and the resulting hexagram.",
    },
  ],
};

export default function IChingCastPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState<IChingRecordData["method"]>("three_coin");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof generateHexagram> | null>(null);
  const [saved, setSaved] = useState(false);
  const [guide, setGuide] = useState<{ title?: unknown; intro?: unknown; steps?: unknown[] } | null>(defaultGuide);

  useEffect(() => {
    const stored = loadData().iching;
    if (stored) {
      setQuestion(stored.question);
      setMethod(stored.method);
      setNotes(stored.notes ?? "");
    }
    markInProgress("iching");
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [question, method]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings?keys=collection.guides")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !mounted) return;
        const guides = data.settings?.["collection.guides"] as Record<string, unknown> | undefined;
        if (guides && typeof guides === "object" && guides.iching) {
          setGuide(guides.iching as { title?: unknown; intro?: unknown; steps?: unknown[] });
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }
    const payload: IChingRecordData = {
      question: question.trim(),
      method,
      notes: notes.trim() ? notes.trim() : undefined,
      createdAt: Date.now(),
    };
    saveIChingData(payload);
    setPreview(generateHexagram());
    setSaved(true);
  };

  const handleSkip = () => {
    markSkipped("iching");
    setSaved(false);
  };

  const handleRestore = () => {
    resetStatus("iching");
    setSaved(false);
  };

  const previewSummary = useMemo(() => {
    if (!preview) return null;
    const base = preview.base;
    return `${base.name} · ${base.chinese}`;
  }, [preview, locale]);

  return (
    <main
      style={{
        maxWidth: "980px",
        margin: "0 auto",
        padding: "5.5rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "28px",
          padding: "2.3rem 2rem",
          boxShadow: "0 24px 40px rgba(76, 95, 215, 0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#4C5FD7",
            fontWeight: 600,
          }}
        >
          {locale === "zh" ? "周易卦象采集" : "I Ching Casting"}
        </span>
        <h1 style={{ margin: 0, fontSize: "2.3rem", color: "#2C3E30" }}>
          {locale === "zh" ? "提出问题，记录卦象缘起" : "Pose your question and record the casting"}
        </h1>
        <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.7 }}>
          {locale === "zh"
            ? "简述所问之事与背景，选择摇卦方式。保存后可自动生成示例卦象作参考。"
            : "Describe your inquiry and choose a casting method. After saving, we’ll generate a sample hexagram for review."}
        </p>
      </header>

      <ModuleNav locale={locale} current="iching" />

      {guide && (
        <section
          style={{
            borderRadius: "24px",
            padding: "1.6rem 1.8rem",
            background: "rgba(76, 95, 215, 0.1)",
            boxShadow: "0 18px 32px rgba(76, 95, 215, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#4C5FD7" }}>
            {resolveLocalizedText(guide.title, locale) ?? (locale === "zh" ? "占卜提示" : "Casting tips")}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.72)", lineHeight: 1.65 }}>
            {resolveLocalizedText(guide.intro, locale) ?? (locale === "zh" ? "先明确主题再抽取卦象。" : "Clarify your topic before casting.")}
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44,62,48,0.8)", lineHeight: 1.6 }}>
            {(Array.isArray(guide.steps) ? guide.steps : defaultGuide.steps).map((step, index) => (
              <li key={index}>{resolveLocalizedText(step, locale) ?? (locale === "zh" ? "根据步骤完成占卜。" : "Follow the outlined casting steps.")}</li>
            ))}
          </ol>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 18px 34px rgba(76, 95, 215, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "问题描述" : "Your question"}
          </h2>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={6}
            placeholder={
              locale === "zh"
                ? "请陈述你想请教的主题（例如：职业转变、关系、居住环境调整）。"
                : "Explain what you seek guidance on (career shift, relationships, living adjustments, etc.)."
            }
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(76, 95, 215, 0.25)",
              padding: "1rem 1.1rem",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
          <div style={{ color: "rgba(44, 62, 48, 0.6)", fontSize: "0.92rem" }}>
            {locale === "zh"
              ? `当前字数：${question.trim().length}`
              : `Characters: ${question.trim().length}`}
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(76, 95, 215, 0.08)",
            boxShadow: "0 18px 34px rgba(76, 95, 215, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "摇卦方式" : "Casting method"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {castingMethods.map((option) => (
              <label
                key={option.value}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(76, 95, 215, 0.35)",
                  padding: "0.75rem 1rem",
                  background: method === option.value ? "#4C5FD7" : "#fff",
                  color: method === option.value ? "#fff" : "#2C3E30",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  style={{ marginRight: "0.75rem" }}
                />
                {locale === "zh" ? option.zh : option.en}
              </label>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder={
              locale === "zh"
                ? "可记录摇卦过程，如时间、地点、是否斋戒等。"
                : "Optional: record casting context such as time, place, or rituals."
            }
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(76, 95, 215, 0.25)",
              padding: "0.9rem 1rem",
              resize: "vertical",
            }}
          />
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 18px 34px rgba(45, 64, 51, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "保存与示例" : "Save & preview"}
          </h2>
          <button
            type="submit"
            disabled={!question.trim()}
            style={{
              borderRadius: "14px",
              padding: "0.85rem 1.4rem",
              background: question.trim()
                ? "linear-gradient(135deg, #4C5FD7, #8C7AE6)"
                : "rgba(76, 95, 215, 0.2)",
              color: question.trim() ? "#fff" : "rgba(44, 62, 48, 0.6)",
              fontWeight: 600,
              border: "none",
              cursor: question.trim() ? "pointer" : "not-allowed",
            }}
          >
            {locale === "zh" ? "保存占卜请求" : "Save divination request"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px dashed rgba(76, 95, 215, 0.5)",
              background: "transparent",
              color: "#2C3E30",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "暂时跳过" : "Skip for now"}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px solid rgba(141, 174, 146, 0.4)",
              background: "rgba(141, 174, 146, 0.12)",
              color: "#2C3E30",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "恢复待填写状态" : "Restore pending"}
          </button>
          {saved ? (
            <span style={{ color: "#2C3E30", fontWeight: 600 }}>
              {locale === "zh"
                ? "已保存请求，以下展示示例卦象以便预览报告结构。"
                : "Request saved. A sample hexagram preview is shown below."}
            </span>
          ) : null}
        </section>
      </form>

      {preview ? (
        <section
          style={{
            borderRadius: "28px",
            padding: "2rem",
            background: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 24px 44px rgba(76, 95, 215, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.6rem", color: "#2C3E30" }}>
            {locale === "zh" ? "示例卦象预览" : "Sample hexagram preview"}
          </h2>
          <p style={{ margin: 0, color: "#4A4A4A" }}>{previewSummary}</p>
          <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.6 }}>
            {preview.base.judgment}
          </p>
          <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.6 }}>
            {preview.base.image}
          </p>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", color: "#4A4A4A" }}>
            {preview.lines.map((line) => (
              <li key={line.position}>
                {locale === "zh" ? `第${line.position}爻` : `Line ${line.position}`} ·{" "}
                {preview.base.lines?.[line.position] ?? (locale === "zh" ? "无爻辞数据" : "No changing text")}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "0.75rem", color: "#4A4A4A" }}>
            <strong>{locale === "zh" ? "现代启示" : "Modern insight"}</strong>
            <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem" }}>
              <li>{preview.interpretation.career}</li>
              <li>{preview.interpretation.relationship}</li>
              <li>{preview.interpretation.health}</li>
              <li>{preview.interpretation.wisdom}</li>
            </ul>
          </div>
        </section>
      ) : null}

      <Link
        href={`/${locale}/assessment`}
        style={{
          alignSelf: "flex-start",
          color: "#4C5FD7",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {locale === "zh" ? "返回综合测评中心" : "Back to assessment hub"}
      </Link>
    </main>
  );
}

