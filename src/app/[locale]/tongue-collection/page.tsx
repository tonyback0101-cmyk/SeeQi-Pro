/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadData, saveTongueData, markSkipped, resetStatus, markInProgress } from "@/state/assessmentStorage";
import type { TongueRecordData } from "@/types/assessment";
import ModuleNav from "@/components/assessment/ModuleNav";

const colorOptions = [
  { value: "normal", zh: "淡红（正常）", en: "Normal pink" },
  { value: "pale", zh: "淡白", en: "Pale" },
  { value: "red", zh: "绛红", en: "Red" },
  { value: "crimson", zh: "深红", en: "Crimson" },
  { value: "purple", zh: "紫暗", en: "Purple" },
  { value: "dark", zh: "发暗", en: "Dark" },
] as const;

const coatingOptions = [
  { value: "thin", zh: "薄白苔", en: "Thin white" },
  { value: "thick", zh: "厚腻苔", en: "Thick greasy" },
  { value: "yellow", zh: "黄苔", en: "Yellow" },
  { value: "greasy", zh: "黏腻苔", en: "Greasy" },
  { value: "none", zh: "少苔/无苔", en: "No coating" },
  { value: "peel", zh: "剥脱苔", en: "Peeling" },
] as const;

const shapeOptions = [
  { value: "normal", zh: "形态正常", en: "Normal" },
  { value: "swollen", zh: "体胖/肿胀", en: "Swollen" },
  { value: "teethmark", zh: "齿痕明显", en: "Teeth marks" },
  { value: "thin", zh: "细薄瘦长", en: "Thin" },
  { value: "cracked", zh: "裂纹明显", en: "Cracked" },
] as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

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
    zh: "舌相拍摄提示",
    en: "Tongue capture tips",
  },
  intro: {
    zh: "保持舌面自然放松，用柔光照亮，避免彩色灯光干扰。",
    en: "Relax your tongue, use soft neutral lighting and avoid colored lights.",
  },
  steps: [
    {
      zh: "漱口后等待 2-3 分钟，让舌面恢复自然湿度。",
      en: "Rinse and wait 2-3 minutes for natural moisture to return.",
    },
    {
      zh: "伸出舌头并保持稳定，可以拍摄多张以便选取清晰照片。",
      en: "Extend your tongue steadily and capture multiple shots for clarity.",
    },
    {
      zh: "拍摄时让舌面充满画面中心，避免遮挡。",
      en: "Keep the tongue centered in frame without obstruction.",
    },
  ],
};

export default function TongueCollectionPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [color, setColor] = useState<TongueRecordData["color"]>("normal");
  const [coating, setCoating] = useState<TongueRecordData["coating"]>("thin");
  const [shape, setShape] = useState<TongueRecordData["shape"]>("normal");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [guide, setGuide] = useState<{ title?: unknown; intro?: unknown; steps?: unknown[] } | null>(defaultGuide);

  useEffect(() => {
    const stored = loadData().tongue;
    if (stored) {
      setColor(stored.color ?? "normal");
      setCoating(stored.coating ?? "thin");
      setShape(stored.shape ?? "normal");
      setNotes(stored.notes ?? "");
    }
    markInProgress("tongue");
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [color, coating, shape, notes]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings?keys=collection.guides")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !mounted) return;
        const guides = data.settings?.["collection.guides"] as Record<string, unknown> | undefined;
        if (guides && typeof guides === "object" && guides.tongue) {
          setGuide(guides.tongue as { title?: unknown; intro?: unknown; steps?: unknown[] });
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: TongueRecordData = {
      color,
      coating,
      shape,
      notes: notes.trim() ? notes.trim() : undefined,
      createdAt: Date.now(),
    };
    saveTongueData(payload);
    setSaved(true);
  };

  const handleSkip = () => {
    markSkipped("tongue");
    setSaved(false);
  };

  const handleRestore = () => {
    resetStatus("tongue");
    setSaved(false);
  };

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
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
          boxShadow: "0 20px 36px rgba(103, 85, 52, 0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#C6A969",
            fontWeight: 600,
          }}
        >
          {locale === "zh" ? "舌象采集" : "Tongue Capture"}
        </span>
        <h1 style={{ margin: 0, fontSize: "2.2rem", color: "#2C3E30" }}>
          {locale === "zh" ? "记录舌色与苔象特征" : "Log tongue color and coating"}
        </h1>
        <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.7 }}>
          {locale === "zh"
            ? "未来将提供多角度拍摄与 AI 质量诊断。当前可先记录目测特征，方便生成体质分析。"
            : "Multi-angle capture with AI checks is on the roadmap. For now, record observed features to enrich your profile."}
        </p>
      </header>

      <ModuleNav locale={locale} current="tongue" />

      {guide && (
        <section
          style={{
            borderRadius: "24px",
            padding: "1.6rem 1.8rem",
            background: "rgba(198, 169, 105, 0.12)",
            boxShadow: "0 18px 32px rgba(198, 169, 105, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#8B5E00" }}>
            {resolveLocalizedText(guide.title, locale) ?? (locale === "zh" ? "采集提示" : "Capture tips")}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.72)", lineHeight: 1.65 }}>
            {resolveLocalizedText(guide.intro, locale) ?? (locale === "zh" ? "保持舌面自然伸展。" : "Keep the tongue extended naturally.")}
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44,62,48,0.8)", lineHeight: 1.6 }}>
            {(Array.isArray(guide.steps) ? guide.steps : defaultGuide.steps).map((step, index) => (
              <li key={index}>{resolveLocalizedText(step, locale) ?? (locale === "zh" ? "按照提示完成采集。" : "Follow the capture guidance.")}</li>
            ))}
          </ol>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 18px 32px rgba(103, 85, 52, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#5B4C2B" }}>
            {locale === "zh" ? "舌色判定" : "Tongue color"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {colorOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(198, 169, 105, 0.4)",
                  padding: "0.75rem 1rem",
                  background: color === option.value ? "rgba(198, 169, 105, 0.18)" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="tongueColor"
                  value={option.value}
                  checked={color === option.value}
                  onChange={() => setColor(option.value)}
                  style={{ marginRight: "0.75rem" }}
                />
                {locale === "zh" ? option.zh : option.en}
              </label>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(198, 169, 105, 0.1)",
            boxShadow: "0 18px 32px rgba(198, 169, 105, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#5B4C2B" }}>
            {locale === "zh" ? "苔象与湿度" : "Coating & hydration"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {coatingOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(198, 169, 105, 0.35)",
                  padding: "0.75rem 1rem",
                  background: coating === option.value ? "#fff" : "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="coating"
                  value={option.value}
                  checked={coating === option.value}
                  onChange={() => setCoating(option.value)}
                  style={{ marginRight: "0.75rem" }}
                />
                {locale === "zh" ? option.zh : option.en}
              </label>
            ))}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <strong>{locale === "zh" ? "舌形状态" : "Tongue shape"}</strong>
            <select
              value={shape ?? "normal"}
              onChange={(event) => setShape(event.target.value as TongueRecordData["shape"])}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(198, 169, 105, 0.3)",
                padding: "0.65rem 1rem",
                background: "#fff",
              }}
            >
              {shapeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "zh" ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder={
              locale === "zh"
                ? "备注：例如舌边齿痕、裂纹、入口时间等。"
                : "Notes: tooth marks, cracks, time of observation, etc."
            }
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(198, 169, 105, 0.3)",
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
            boxShadow: "0 18px 32px rgba(141, 174, 146, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "保存与跳过" : "Save & skip"}
          </h2>
          <button
            type="submit"
            style={{
              borderRadius: "14px",
              padding: "0.85rem 1.4rem",
              background: "linear-gradient(135deg, #C6A969, #8DAE92)",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "保存舌象记录" : "Save tongue record"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px dashed rgba(198, 169, 105, 0.6)",
              background: "transparent",
              color: "#5B4C2B",
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
              border: "1px solid rgba(76, 95, 215, 0.4)",
              background: "rgba(76, 95, 215, 0.08)",
              color: "#4C5FD7",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "恢复待填写状态" : "Restore pending"}
          </button>
          {saved ? (
            <span style={{ color: "#2C3E30", fontWeight: 600 }}>
              {locale === "zh" ? "已保存，本地缓存支持您随时继续。" : "Saved locally. Continue anytime."}
            </span>
          ) : null}
        </section>
      </form>

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

