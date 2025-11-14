"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { COLORS } from "@/lib/colors";

type Locale = "zh" | "en";

type ShareState = "idle" | "loading" | "success" | "error";

export type ShareHeroCardStatus = {
  state: ShareState;
  message?: string | null;
};

type ShareHeroCardProps = {
  locale: Locale;
  constitution?: string | null;
  qiScore?: number | null;
  qiLevel?: string | null;
  qiTrend?: string | null;
  solarName?: string | null;
  highlight?: string | null;
  dreamSummary?: string | null;
  tags?: string[];
  unlocked: boolean;
  status: ShareHeroCardStatus;
  onShare?: () => void | Promise<void>;
};

const TEXT = {
  zh: {
    title: "可分享亮点",
    constitution: "体质",
    qiIndex: "气指数",
    solar: "节气关注点",
    dream: "梦境速记",
    tags: "标签",
    copy: "复制分享链接",
    copying: "生成分享链接…",
    success: "分享链接已复制",
    fallback: "链接复制失败，请稍后重试。",
    lockedBadge: "简版",
    unlockedBadge: "完整版",
  },
  en: {
    title: "Share Highlights",
    constitution: "Constitution",
    qiIndex: "Qi Index",
    solar: "Seasonal focus",
    dream: "Dream snapshot",
    tags: "Tags",
    copy: "Copy share link",
    copying: "Preparing share link…",
    success: "Share link copied",
    fallback: "Couldn’t copy link. Please try again later.",
    lockedBadge: "Lite",
    unlockedBadge: "Full",
  },
} as const;

const BADGE_COLORS = {
  lite: {
    bg: "rgba(198,169,105,0.18)",
    border: "rgba(198,169,105,0.35)",
    color: "#8C6B28",
  },
  full: {
    bg: "rgba(80,129,107,0.18)",
    border: "rgba(80,129,107,0.35)",
    color: "#1F3C2F",
  },
};

export default function ShareHeroCard({
  locale,
  constitution,
  qiScore,
  qiLevel,
  qiTrend,
  solarName,
  highlight,
  dreamSummary,
  tags = [],
  unlocked,
  status,
  onShare,
}: ShareHeroCardProps) {
  const t = TEXT[locale];
  const badge = unlocked ? BADGE_COLORS.full : BADGE_COLORS.lite;
  const statusLabel = useMemo(() => {
    if (status.state === "success") return status.message ?? t.success;
    if (status.state === "error") return status.message ?? t.fallback;
    if (status.state === "loading") return t.copying;
    return status.message ?? null;
  }, [status, t.copying, t.fallback, t.success]);

  return (
    <motion.section
      className="share-hero"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        borderRadius: "28px",
        padding: "1.8rem 2rem 2.1rem",
        background: "linear-gradient(155deg, rgba(233, 241, 238, 0.95), rgba(250, 248, 240, 0.95))",
        border: "1px solid rgba(141, 174, 146, 0.3)",
        boxShadow: "0 32px 48px rgba(42, 64, 53, 0.14)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "1.6rem",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: COLORS.text.darkGreen }}>{t.title}</h2>
          <span
            style={{
              padding: "0.25rem 0.85rem",
              borderRadius: 999,
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {unlocked ? t.unlockedBadge : t.lockedBadge}
          </span>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          <ShareItem title={t.constitution} value={constitution ?? "—"} />
          <ShareItem
            title={t.qiIndex}
            value={
              qiScore != null
                ? `${Math.round(qiScore)}`
                : locale === "zh"
                ? "完成测评以获取分数"
                : "Complete assessment to unlock"
            }
            meta={qiMeta(locale, qiLevel, qiTrend)}
          />
          <ShareItem title={t.solar} value={solarName ?? (locale === "zh" ? "今日节气" : "Current solar term")} meta={highlight ?? undefined} />
          {dreamSummary ? <ShareItem title={t.dream} value={dreamSummary} /> : null}
        </div>

        {tags.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            <strong style={{ color: "rgba(33, 54, 45, 0.75)", fontSize: "0.9rem" }}>{t.tags}</strong>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(141,174,146,0.4)",
                    color: "rgba(33,54,45,0.8)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "flex-end" }}>
        <button
          type="button"
          onClick={onShare}
          disabled={!onShare || status.state === "loading"}
          style={{
            borderRadius: 999,
            padding: "0.8rem 1.5rem",
            border: "none",
            background: "linear-gradient(135deg, #5E8D75, #C6A969)",
            boxShadow: "0 16px 28px rgba(42, 84, 65, 0.3)",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: onShare ? "pointer" : "not-allowed",
            opacity: status.state === "loading" ? 0.7 : 1,
            transition: "transform 0.2s ease",
          }}
        >
          {status.state === "loading" ? t.copying : t.copy}
        </button>
        {statusLabel ? (
          <span
            style={{
              fontSize: "0.85rem",
              color: status.state === "error" ? "#B45309" : "rgba(33, 54, 45, 0.75)",
            }}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
    </motion.section>
  );
}

function ShareItem({ title, value, meta }: { title: string; value: string; meta?: string }) {
  return (
    <div
      style={{
        padding: "1rem 1.1rem",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(141, 174, 146, 0.3)",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        minHeight: "104px",
        boxShadow: "0 18px 28px rgba(42, 64, 53, 0.08)",
      }}
    >
      <span style={{ fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(54, 70, 62, 0.65)" }}>
        {title}
      </span>
      <strong style={{ fontSize: "1.1rem", color: "rgba(33,54,45,0.88)", wordBreak: "break-word" }}>{value}</strong>
      {meta ? <span style={{ fontSize: "0.82rem", color: "rgba(33,54,45,0.65)", lineHeight: 1.45 }}>{meta}</span> : null}
    </div>
  );
}

function qiMeta(locale: Locale, level?: string | null, trend?: string | null) {
  if (!level && !trend) return undefined;
  if (locale === "zh") {
    const parts = [];
    if (level) parts.push(`等级：${level}`);
    if (trend) parts.push(`趋势：${trend}`);
    return parts.join(" · ");
  }
  const parts = [];
  if (level) parts.push(`Level: ${level}`);
  if (trend) parts.push(`Trend: ${trend}`);
  return parts.join(" · ");
}

