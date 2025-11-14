"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzeDream } from "@/lib/analysis/dreamAnalyzer";
import { loadData, saveDreamData, markSkipped, resetStatus, markInProgress } from "@/state/assessmentStorage";
import type { DreamRecordData } from "@/types/assessment";
import ModuleNav from "@/components/assessment/ModuleNav";

const EMOTION_OPTIONS = [
  { value: "joy", zh: "喜悦", en: "Joy" },
  { value: "fear", zh: "恐惧", en: "Fear" },
  { value: "confusion", zh: "困惑", en: "Confusion" },
  { value: "calm", zh: "平静", en: "Calm" },
  { value: "anger", zh: "愤怒", en: "Anger" },
  { value: "sadness", zh: "悲伤", en: "Sadness" },
  { value: "neutral", zh: "中性", en: "Neutral" },
] as const;

const DEFAULT_PRESET_DREAMS = [
  {
    zh: "在山谷中奔跑，被看不见的力量追逐，最后飞上天空。",
    en: "I ran through a valley, chased by something invisible until I finally flew into the sky.",
  },
  {
    zh: "牙齿一颗颗松动掉落，我急着找医生却找不到。",
    en: "My teeth loosened and fell out one by one while I desperately searched for a dentist.",
  },
  {
    zh: "在海面上划船，突然风暴来临，被巨浪吞没。",
    en: "I rowed a small boat on the sea when a sudden storm hit and the waves swallowed me.",
  },
];

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
    zh: "如何描述梦境",
    en: "How to describe your dream",
  },
  intro: {
    zh: "记录时间、地点、人物与情绪，越具体能获得越精准的 AI 解读。",
    en: "Capture when, where, who and how you felt—the more detail, the better the AI insight.",
  },
  steps: [
    {
      zh: "描述梦境环境，例如室内/户外、季节或天气。",
      en: "Describe the environment: indoors/outdoors, season or weather.",
    },
    {
      zh: "记录关键人物或生物及其与你的关系。",
      en: "Note key people or beings and your relationship to them.",
    },
    {
      zh: "写下最强烈的情绪与身体感受。",
      en: "Write the strongest emotions and physical sensations you felt.",
    },
  ],
};

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function DreamRecordPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [narrative, setNarrative] = useState("");
  const [emotion, setEmotion] = useState<string>("neutral");
  const [autoKeywords, setAutoKeywords] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [presetDreams, setPresetDreams] = useState(DEFAULT_PRESET_DREAMS);
  const [guide, setGuide] = useState<{ title?: unknown; intro?: unknown; steps?: unknown[] } | null>(defaultGuide);

  useEffect(() => {
    const stored = loadData().dream;
    if (stored) {
      setNarrative(stored.narrative);
      setEmotion(stored.emotion);
      setAutoKeywords(stored.keywords);
    }
    markInProgress("dream");
  }, []);

  useEffect(() => {
    setSaveState("idle");
  }, [narrative, emotion]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings?keys=dream.samples,collection.guides")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !mounted) return;
        const samples = data.settings?.["dream.samples"];
        if (Array.isArray(samples)) {
          const formatted = samples
            .map((item) => {
              if (typeof item === "string") return { zh: item, en: item };
              if (item && typeof item === "object") {
                const zh = typeof item.zh === "string" ? item.zh : "";
                const en = typeof item.en === "string" ? item.en : zh;
                if (!zh && !en) return null;
                return { zh: zh || en, en: en || zh };
              }
              return null;
            })
            .filter(Boolean) as Array<{ zh: string; en: string }>;
          if (formatted.length) {
            setPresetDreams(formatted);
          }
        }
        const guides = data.settings?.["collection.guides"] as Record<string, unknown> | undefined;
        if (guides && typeof guides === "object" && guides.dream) {
          setGuide(guides.dream as { title?: unknown; intro?: unknown; steps?: unknown[] });
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const analysis = useMemo(() => {
    if (!narrative.trim()) {
      setAutoKeywords([]);
      return null;
    }
    const result = analyzeDream(narrative, emotion, locale);
    setAutoKeywords(result.keywords);
    return result;
  }, [narrative, emotion, locale]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!narrative.trim()) {
      return;
    }
    const payload: DreamRecordData = {
      narrative: narrative.trim(),
      emotion,
      keywords: autoKeywords,
      createdAt: Date.now(),
    };
    saveDreamData(payload);
    setSaveState("saved");
  };

  const handleSkip = () => {
    markSkipped("dream");
    setNarrative("");
    setEmotion("neutral");
    setAutoKeywords([]);
    setSaveState("idle");
  };

  const restorePending = () => {
    resetStatus("dream");
    setSaveState("idle");
  };

  return (
    <div
      style={{
        maxWidth: "980px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header
        style={{
          padding: "2.4rem 2rem",
          borderRadius: "28px",
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "0 24px 48px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "#8DAE92",
            textTransform: "uppercase",
          }}
        >
          {locale === "zh" ? "梦境采集 · 深度洞察" : "Dream Intake · Deep Insight"}
        </span>
        <h1 style={{ margin: 0, fontSize: "2.4rem", lineHeight: 1.2, color: "#2C3E30" }}>
          {locale === "zh" ? "记录梦境细节" : "Capture your dream details"}
        </h1>
        <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.75 }}>
          {locale === "zh"
            ? "填写梦境描述和当时情绪，可实时查看潜意识解析预览，稍后可继续完善。"
            : "Describe the dream and your feelings. A live preview reveals subconscious cues, and you can revisit later."}
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${locale}/dream-analysis`}
            style={{
              textDecoration: "none",
              color: "#8DAE92",
              fontWeight: 600,
            }}
          >
            ← {locale === "zh" ? "返回梦境解析首页" : "Back to dream overview"}
          </Link>
          <Link
            href={`/${locale}/assessment`}
            style={{
              textDecoration: "none",
              color: "#4C5FD7",
              fontWeight: 600,
            }}
          >
            {locale === "zh" ? "查看模块进度" : "View assessment hub"}
          </Link>
        </div>
      </header>

      <ModuleNav locale={locale} current="dream" />

      {guide && (
        <section
          style={{
            borderRadius: "24px",
            padding: "1.6rem 1.8rem",
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 18px 32px rgba(45, 64, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {resolveLocalizedText(guide.title, locale) ?? (locale === "zh" ? "梦境记录提示" : "Dream logging tips")}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.72)", lineHeight: 1.65 }}>
            {resolveLocalizedText(guide.intro, locale) ?? (locale === "zh" ? "写下关键情节与感受。" : "Write down key scenes and emotions.")}
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44,62,48,0.8)", lineHeight: 1.6 }}>
            {(Array.isArray(guide.steps) ? guide.steps : defaultGuide.steps).map((step, index) => (
              <li key={index}>{resolveLocalizedText(step, locale) ?? (locale === "zh" ? "记录更多细节以便解析。" : "Add details for deeper interpretation.")}</li>
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
            boxShadow: "0 20px 40px rgba(45, 64, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#2C3E30" }}>
            {locale === "zh" ? "梦境描述" : "Dream narrative"}
          </h2>
          <textarea
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            rows={8}
            placeholder={
              locale === "zh"
                ? "请尽可能详细描述梦境，包括场景、人物、颜色、感受等。"
                : "Describe the dream with as much detail as possible: scenes, people, colors, and feelings."
            }
            style={{
              width: "100%",
              borderRadius: "16px",
              border: "1px solid rgba(141, 174, 146, 0.35)",
              padding: "1rem 1.2rem",
              resize: "vertical",
              minHeight: "220px",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          />
          <div style={{ color: "rgba(44, 62, 48, 0.6)", fontSize: "0.9rem" }}>
            {locale === "zh"
              ? `当前字数：${narrative.trim().length}`
              : `Characters: ${narrative.trim().length}`}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {presetDreams.map((item, index) => (
              <button
                key={`${item.zh}-${index}`}
                type="button"
                onClick={() => setNarrative(locale === "zh" ? item.zh : item.en)}
                style={{
                  borderRadius: "12px",
                  border: "1px dashed rgba(141, 174, 146, 0.6)",
                  padding: "0.5rem 0.85rem",
                  background: "transparent",
                  color: "#2C3E30",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {locale === "zh" ? "示例" : "Sample"}
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(140, 122, 230, 0.08)",
            boxShadow: "0 20px 38px rgba(76, 95, 215, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#4C5FD7" }}>
            {locale === "zh" ? "情绪标记" : "Emotion tag"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "0.6rem",
            }}
          >
            {EMOTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEmotion(option.value)}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(140, 122, 230, 0.4)",
                  padding: "0.6rem",
                  background: emotion === option.value ? "#4C5FD7" : "rgba(255, 255, 255, 0.6)",
                  color: emotion === option.value ? "#fff" : "#2C3E30",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {locale === "zh" ? option.zh : option.en}
              </button>
            ))}
          </div>

          <div>
            <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "1.1rem", color: "#2C3E30" }}>
              {locale === "zh" ? "自动检测的关键词" : "Auto-detected keywords"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {autoKeywords.map((keyword) => (
                <span
                  key={keyword}
                  style={{
                    borderRadius: "999px",
                    background: "rgba(76, 95, 215, 0.12)",
                    color: "#4C5FD7",
                    padding: "0.35rem 0.8rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {keyword}
                </span>
              ))}
              {autoKeywords.length === 0 ? (
                <span style={{ color: "rgba(44, 62, 48, 0.6)", fontSize: "0.9rem" }}>
                  {locale === "zh" ? "请输入梦境内容以提取关键词" : "Start typing to reveal dream symbols."}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "1.1rem", color: "#2C3E30" }}>
              {locale === "zh" ? "实时解析预览" : "Live insight preview"}
            </h3>
            {analysis ? (
              <div
                style={{
                  borderRadius: "18px",
                  padding: "1rem 1.2rem",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  color: "#2C3E30",
                  fontSize: "0.95rem",
                }}
              >
                <p style={{ margin: 0 }}>{analysis.summary}</p>
                <p style={{ margin: 0 }}>{analysis.interpretation}</p>
                <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                  {analysis.advice.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.6)" }}>
                {locale === "zh"
                  ? "填写梦境后，将即时生成潜意识洞察与建议。"
                  : "Once you describe the dream, live insights will appear here."}
              </p>
            )}
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(245, 230, 200, 0.35)",
            boxShadow: "0 18px 32px rgba(122, 157, 127, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#5B4C2B" }}>
            {locale === "zh" ? "保存与进度" : "Save & progress"}
          </h2>
          <p style={{ margin: 0, color: "rgba(91, 76, 43, 0.8)", lineHeight: 1.6 }}>
            {locale === "zh"
              ? "提交后数据仅保存在本地设备，可随时返回编辑或重新生成报告。"
              : "After saving, data stays on this device. You can revisit to edit or refresh the report."}
          </p>
          <button
            type="submit"
            disabled={!narrative.trim()}
            style={{
              borderRadius: "14px",
              padding: "0.85rem 1.5rem",
              background: narrative.trim()
                ? "linear-gradient(135deg, #8DAE92, #7A9D7F)"
                : "rgba(141, 174, 146, 0.3)",
              color: narrative.trim() ? "#fff" : "rgba(44, 62, 48, 0.6)",
              fontWeight: 600,
              border: "none",
              cursor: narrative.trim() ? "pointer" : "not-allowed",
            }}
          >
            {locale === "zh" ? "保存梦境记录" : "Save dream record"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px dashed rgba(141, 174, 146, 0.6)",
              background: "transparent",
              color: "#2C3E30",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "暂时跳过此模块" : "Skip this module for now"}
          </button>
          <button
            type="button"
            onClick={restorePending}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px solid rgba(76, 95, 215, 0.4)",
              background: "rgba(76, 95, 215, 0.08)",
              color: "#4C5FD7",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "恢复待办状态" : "Restore to pending"}
          </button>
          {saveState === "saved" ? (
            <span style={{ color: "#2C3E30", fontWeight: 600 }}>
              {locale === "zh" ? "已保存，您可以前往综合报告查看。" : "Saved. You can review it from the report hub."}
            </span>
          ) : null}
        </section>
      </form>
    </div>
  );
}

