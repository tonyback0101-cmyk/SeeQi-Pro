"use client";

import { useMemo, useRef, useState } from "react";
import { COLORS } from "@/lib/colors";

const html2canvasPromise = () => import("html2canvas");

type Locale = "zh" | "en";

type AdviceSet = {
  good: string[];
  avoid: string[];
};

type QiCardProps = {
  locale: Locale;
  reportId: string;
  score: number | null | undefined;
  phrase?: string | null;
  warning?: string | null;
  advice?: AdviceSet | null;
  food?: string[];
  activity?: string[];
  emoji?: string | null;
  shareRef?: string | null;
};

const COPY = {
  zh: {
    title: "今日气运指数",
    warningLabel: "温馨提醒",
    goodLabel: "宜",
    avoidLabel: "忌",
    foodLabel: "食疗建议",
    activityLabel: "行动建议",
    shareButton: "生成签图",
    shareGenerating: "生成中…",
    shareSuccess: "签图已生成，新页面中打开。",
    shareError: "生成失败，请稍后再试。",
  },
  en: {
    title: "Qi Index Today",
    warningLabel: "Gentle Reminder",
    goodLabel: "Recommended",
    avoidLabel: "Avoid",
    foodLabel: "Nourishing Picks",
    activityLabel: "Suggested Actions",
    shareButton: "Generate Share Card",
    shareGenerating: "Rendering…",
    shareSuccess: "Card generated in the new tab.",
    shareError: "Generation failed. Please retry.",
  },
} as const;

function sanitizeList(input?: string[]): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export default function QiCard({
  locale,
  reportId,
  score,
  phrase,
  warning,
  advice,
  food,
  activity,
  emoji,
  shareRef,
}: QiCardProps) {
  const t = COPY[locale];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const goodList = useMemo(() => sanitizeList(advice?.good), [advice]);
  const avoidList = useMemo(() => sanitizeList(advice?.avoid), [advice]);
  const foodList = useMemo(() => sanitizeList(food), [food]);
  const activityList = useMemo(() => sanitizeList(activity), [activity]);

  const displayScore = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : "—";
  const displayEmoji = emoji && emoji.trim().length > 0 ? emoji : locale === "zh" ? "🌤️" : "🌤️";

  async function handleGenerateCard() {
    if (!cardRef.current) {
      setStatus("error");
      setStatusMessage(t.shareError);
      return;
    }

    setStatus("loading");
    setStatusMessage(null);
    try {
      const html2canvas = (await html2canvasPromise()).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#F7F5ED",
        scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const storageKey = `seeqi-share-card-${reportId}`;
      sessionStorage.setItem(storageKey, dataUrl);
      setStatus("success");
      setStatusMessage(t.shareSuccess);
      const query = shareRef ? `?ref=${encodeURIComponent(shareRef)}` : "";
      const url = `/${locale}/analysis-result/share/${reportId}${query}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("qi-card-generate", error);
      setStatus("error");
      setStatusMessage(t.shareError);
    }
  }

  return (
    <div
      style={{
        borderRadius: "28px",
        background: "linear-gradient(145deg, rgba(233, 239, 231, 0.95), rgba(255, 249, 240, 0.95))",
        border: "1px solid rgba(141, 174, 146, 0.28)",
        boxShadow: "0 24px 48px rgba(35, 64, 53, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        padding: "1.8rem 1.9rem 2.1rem",
      }}
    >
      <div
        ref={cardRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.3rem",
          background: "radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(247,245,237,0.95))",
          borderRadius: "24px",
          padding: "1.6rem",
          border: "1px solid rgba(141, 174, 146, 0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", letterSpacing: "0.08em", color: "rgba(35,64,53,0.6)" }}>
              {locale === "zh" ? "SeeQi 今日签" : "SeeQi Daily Card"}
            </span>
            <h2 style={{ margin: 0, fontSize: "1.7rem", color: COLORS.text.darkGreen }}>{t.title}</h2>
          </div>
          <span style={{ fontSize: "2.4rem", lineHeight: 1 }}>{displayEmoji}</span>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.8rem 1.4rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(141,174,146,0.28), rgba(198,169,105,0.32))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.text.darkGreen,
              fontWeight: 700,
              fontSize: "2rem",
            }}
          >
            {displayScore}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", color: "rgba(35,64,53,0.78)" }}>
            {phrase ? <p style={{ margin: 0, fontSize: "1rem" }}>{phrase}</p> : null}
            {warning ? (
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#8C6B28" }}>
                <strong>{t.warningLabel}：</strong>
                {warning}
              </p>
            ) : null}
          </div>
        </div>

        {(goodList.length > 0 || avoidList.length > 0) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.9rem",
            }}
          >
            {goodList.length > 0 ? (
              <SectionList title={`${t.goodLabel}`} items={goodList} accent="rgba(80,129,107,0.16)" />
            ) : null}
            {avoidList.length > 0 ? (
              <SectionList title={`${t.avoidLabel}`} items={avoidList} accent="rgba(198,105,105,0.16)" />
            ) : null}
          </div>
        )}

        {(foodList.length > 0 || activityList.length > 0) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.9rem",
            }}
          >
            {foodList.length > 0 ? (
              <SectionList title={t.foodLabel} items={foodList} accent="rgba(198,169,105,0.18)" />
            ) : null}
            {activityList.length > 0 ? (
              <SectionList title={t.activityLabel} items={activityList} accent="rgba(76,95,215,0.12)" />
            ) : null}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleGenerateCard}
          disabled={status === "loading"}
          style={{
            borderRadius: 999,
            padding: "0.7rem 1.4rem",
            border: "none",
            background: "linear-gradient(135deg, #5E8D75, #C6A969)",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            opacity: status === "loading" ? 0.8 : 1,
            transition: "transform 0.2s ease",
          }}
        >
          {status === "loading" ? t.shareGenerating : t.shareButton}
        </button>
        {statusMessage ? (
          <span
            style={{
              fontSize: "0.85rem",
              color: status === "error" ? "#B55309" : "rgba(35,64,53,0.7)",
            }}
          >
            {statusMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}

type SectionListProps = {
  title: string;
  items: string[];
  accent: string;
};

function SectionList({ title, items, accent }: SectionListProps) {
  const borderColor = accent.includes("0.16") ? accent.replace("0.16", "0.32") : accent;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        background: accent,
        borderRadius: "18px",
        padding: "0.95rem 1.1rem",
        border: `1px solid ${borderColor}`,
      }}
    >
      <strong style={{ color: "#234035" }}>{title}</strong>
      <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "rgba(35,64,53,0.75)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

