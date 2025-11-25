import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

const IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

type Template = {
  background?: string;
  primary?: string;
  accent?: string;
  subtitleColor?: string;
  summaryBackground?: string;
};

const DEFAULT_TEMPLATE: Template = {
  background: "#f6f4f0",
  primary: "#234035",
  accent: "#c6a969",
  subtitleColor: "#4b5a55",
  summaryBackground: "rgba(35, 64, 53, 0.08)",
};

function decodeParam(value: string | null, fallback = "") {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function loadTemplate(origin: string, locale: string): Promise<Template> {
  try {
    const response = await fetch(`${origin}/api/settings?keys=share.templates`, { cache: "no-store" });
    if (!response.ok) return DEFAULT_TEMPLATE;
    const data = await response.json();
    const templates = data?.settings?.["share.templates"];
    const template = templates?.[locale] ?? templates?.default;
    if (template && typeof template === "object") {
      return { ...DEFAULT_TEMPLATE, ...template.styles };
    }
  } catch (error) {
    console.error("share-card-template", error);
  }
  return DEFAULT_TEMPLATE;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const title = decodeParam(searchParams.get("title"), "SeeQi Insight");
  const subtitle = decodeParam(searchParams.get("subtitle"), "Holistic Wellness Snapshot");
  const summary = decodeParam(searchParams.get("summary"), "Palm · Tongue · Dream · I Ching · Seasonal Guidance");
  const ref = decodeParam(searchParams.get("ref"), "");
  const locale = decodeParam(searchParams.get("locale"), "zh");

  const template = await loadTemplate(origin, locale);
  const background = template.background ?? DEFAULT_TEMPLATE.background;
  const primary = template.primary ?? DEFAULT_TEMPLATE.primary;
  const accent = template.accent ?? DEFAULT_TEMPLATE.accent;
  const subtitleColor = template.subtitleColor ?? DEFAULT_TEMPLATE.subtitleColor;
  const summaryBackground = template.summaryBackground ?? DEFAULT_TEMPLATE.summaryBackground;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background,
          padding: "64px 72px",
          fontFamily: "'Noto Sans SC', 'PingFang SC', 'Segoe UI', sans-serif",
          color: primary,
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: accent }}>SeeQi Wellness</div>
        <div style={{ marginTop: 24, fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 18, fontSize: 28, color: subtitleColor, maxWidth: 800 }}>{subtitle}</div>
        <div
          style={{
            marginTop: 42,
            padding: "28px 32px",
            background: summaryBackground,
            borderRadius: 24,
            fontSize: 26,
            color: primary,
            maxWidth: 860,
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {summary.split("|").map((line) => (
            <div key={line.trim()}>{line.trim()}</div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>www.seeqicloud.com</span>
            <span style={{ fontSize: 18, color: subtitleColor }}>Oriental wisdom · AI-powered wellness insights</span>
          </div>
          {ref && (
            <div
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                background: "rgba(35, 64, 53, 0.12)",
                color: primary,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              REF · {ref}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: IMAGE_SIZE.width,
      height: IMAGE_SIZE.height,
    }
  );
}


