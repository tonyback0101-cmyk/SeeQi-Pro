/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadData, saveFengshuiData, markSkipped, resetStatus, markInProgress } from "@/state/assessmentStorage";
import type { FengshuiRecordData } from "@/types/assessment";
import ModuleNav from "@/components/assessment/ModuleNav";

const residenceTypes = [
  { value: "apartment", zh: "公寓/高层", en: "Apartment / high-rise" },
  { value: "house", zh: "独栋/联排", en: "House / townhouse" },
  { value: "studio", zh: "单身公寓", en: "Studio" },
  { value: "other", zh: "其他", en: "Other" },
] as const;

const facingOptions = [
  { value: "north", zh: "坐北朝南", en: "North-facing" },
  { value: "south", zh: "坐南朝北", en: "South-facing" },
  { value: "east", zh: "坐东朝西", en: "East-facing" },
  { value: "west", zh: "坐西朝东", en: "West-facing" },
  { value: "complex", zh: "多朝向", en: "Multiple orientations" },
] as const;

const goalOptions = [
  { value: "health", zh: "养生调理", en: "Health balance" },
  { value: "sleep", zh: "改善睡眠", en: "Improve sleep" },
  { value: "career", zh: "事业突破", en: "Career growth" },
  { value: "relationships", zh: "家庭关系", en: "Family harmony" },
  { value: "wealth", zh: "财运规划", en: "Wealth planning" },
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
    zh: "填写空间信息",
    en: "Describe your space",
  },
  intro: {
    zh: "提供住宅类型、朝向与主要需求，AI 将基于五行匹配建议。",
    en: "Share home type, facing direction and your goals for tailored five-element guidance.",
  },
  steps: [
    {
      zh: "注明是自住还是办公场所，便于聚焦场景。",
      en: "Clarify whether it is a living or working space.",
    },
    {
      zh: "补充家庭成员或搭档情况，方便结合人事布局。",
      en: "Mention who uses the space to align with personal needs.",
    },
    {
      zh: "写下近期重点目标（如睡眠、财务、学习），报告会优先覆盖。",
      en: "List your priority goals (sleep, finance, study) for focused recommendations.",
    },
  ],
};

export default function FengshuiInputPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [residenceType, setResidenceType] = useState("apartment");
  const [facingDirection, setFacingDirection] = useState("north");
  const [birthPattern, setBirthPattern] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["health"]);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [guide, setGuide] = useState<{ title?: unknown; intro?: unknown; steps?: unknown[] } | null>(defaultGuide);

  useEffect(() => {
    const stored = loadData().fengshui;
    if (stored) {
      setResidenceType(stored.residenceType);
      setFacingDirection(stored.facingDirection);
      setBirthPattern(stored.birthPattern);
      setSelectedGoals(stored.goals);
    }
    markInProgress("fengshui");
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [residenceType, facingDirection, birthPattern, selectedGoals]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings?keys=collection.guides")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !mounted) return;
        const guides = data.settings?.["collection.guides"] as Record<string, unknown> | undefined;
        if (guides && typeof guides === "object" && guides.fengshui) {
          setGuide(guides.fengshui as { title?: unknown; intro?: unknown; steps?: unknown[] });
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const summaryGoals = useState(
    () =>
      selectedGoals
        .map((value) => {
          const option = goalOptions.find((item) => item.value === value);
          return option ? (locale === "zh" ? option.zh : option.en) : value;
        })
        .join(locale === "zh" ? "、" : ", "),
  )[0];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: FengshuiRecordData = {
      residenceType,
      facingDirection,
      birthPattern: birthPattern.trim(),
      goals: selectedGoals,
      createdAt: Date.now(),
    };
    saveFengshuiData(payload);
    setSaved(true);
  };

  const handleSkip = () => {
    markSkipped("fengshui");
    setSaved(false);
  };

  const handleRestore = () => {
    resetStatus("fengshui");
    setSaved(false);
  };

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
          boxShadow: "0 24px 40px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#7A9D7F",
            fontWeight: 600,
          }}
        >
          {locale === "zh" ? "五行风水填报" : "Five-element Feng Shui"}
        </span>
        <h1 style={{ margin: 0, fontSize: "2.3rem", color: "#2C3E30" }}>
          {locale === "zh" ? "描绘居家气场轮廓" : "Describe your living energy"}
        </h1>
        <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.7 }}>
          {locale === "zh"
            ? "填写居住类型、方位与个人八字概况，帮助我们生成五行风水调理建议。"
            : "Tell us about your space, orientation, and birth chart so we can craft five-element recommendations."}
        </p>
      </header>

      <ModuleNav locale={locale} current="fengshui" />

      {guide && (
        <section
          style={{
            borderRadius: "24px",
            padding: "1.6rem 1.8rem",
            background: "rgba(35, 64, 53, 0.08)",
            boxShadow: "0 18px 32px rgba(35, 64, 53, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#234035" }}>
            {resolveLocalizedText(guide.title, locale) ?? (locale === "zh" ? "填写提示" : "Input tips")}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.72)", lineHeight: 1.65 }}>
            {resolveLocalizedText(guide.intro, locale) ?? (locale === "zh" ? "尽可能完整填写空间信息。" : "Provide as much detail as possible about your space.")}
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44,62,48,0.8)", lineHeight: 1.6 }}>
            {(Array.isArray(guide.steps) ? guide.steps : defaultGuide.steps).map((step, index) => (
              <li key={index}>{resolveLocalizedText(step, locale) ?? (locale === "zh" ? "按需求说明重点。" : "Describe your focus goals.")}</li>
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
            boxShadow: "0 18px 34px rgba(45, 64, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "居住类型" : "Residence type"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {residenceTypes.map((option) => (
              <label
                key={option.value}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(122, 157, 127, 0.35)",
                  padding: "0.75rem 1rem",
                  background: residenceType === option.value ? "rgba(122, 157, 127, 0.16)" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="residence"
                  value={option.value}
                  checked={residenceType === option.value}
                  onChange={() => setResidenceType(option.value)}
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
            background: "rgba(122, 157, 127, 0.12)",
            boxShadow: "0 18px 34px rgba(122, 157, 127, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "朝向与出生信息" : "Orientation & birth"}
          </h2>
          <select
            value={facingDirection}
            onChange={(event) => setFacingDirection(event.target.value)}
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(122, 157, 127, 0.4)",
              padding: "0.75rem 1rem",
              background: "#fff",
              fontSize: "1rem",
            }}
          >
            {facingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {locale === "zh" ? option.zh : option.en}
              </option>
            ))}
          </select>
          <textarea
            value={birthPattern}
            onChange={(event) => setBirthPattern(event.target.value)}
            rows={4}
            placeholder={
              locale === "zh"
                ? "可填写生日、时辰或八字关键字，例如：1994-05-18 亥时，阴历甲戌年。"
                : "Share birth date/time or key pillars, e.g. May 18 1994 (Hai hour), Yin Wood Dog year."
            }
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(122, 157, 127, 0.35)",
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
            boxShadow: "0 18px 34px rgba(198, 169, 105, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "调理目标" : "Goals"}
          </h2>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {goalOptions.map((option) => {
              const selected = selectedGoals.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleGoal(option.value)}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid rgba(198, 169, 105, 0.45)",
                    padding: "0.6rem 1rem",
                    background: selected ? "linear-gradient(135deg, #C6A969, #7A9D7F)" : "rgba(255,255,255,0.85)",
                    color: selected ? "#fff" : "#5B4C2B",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {locale === "zh" ? option.zh : option.en}
                </button>
              );
            })}
          </div>
          <div style={{ color: "rgba(44, 62, 48, 0.65)", fontSize: "0.92rem" }}>
            {locale === "zh"
              ? `当前选择：${summaryGoals || "未选择"}`
              : `Selected: ${summaryGoals || "None"}`}
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(255, 255, 255, 0.94)",
            boxShadow: "0 18px 32px rgba(122, 157, 127, 0.18)",
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
              background: "linear-gradient(135deg, #7A9D7F, #8DAE92)",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "保存风水资料" : "Save feng shui data"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px dashed rgba(122, 157, 127, 0.6)",
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
              {locale === "zh" ? "已保存，稍后可在综合报告中查看推荐。" : "Saved. Recommendations will appear in the combined report."}
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

