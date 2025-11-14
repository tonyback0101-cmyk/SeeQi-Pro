"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveDreamFeedback } from "@/utils/dreamFeedbackStore";
import { findDreamKeywordFallback } from "@/data/dreamKeywordsLite";

type Locale = "zh" | "en";

const HOT_TAGS = ["水/雨", "牙齿", "飞行", "追逐", "蛇", "考试", "孩子", "坠落", "房屋", "镜子"] as const;

const COPY = {
  zh: {
    title: "梦境即时解析",
    subtitle: "写下你记得的梦境片段（50–300字），也可直接选择关键词",
    placeholder: "写下你记得的梦境片段（50–300字），也可直接选择关键词",
    tagLabel: "热门标签",
    selectedLabel: "已选择",
    charCount: (count: number) => `当前字数：${count}（建议 50–300 字）`,
    submit: "立即解梦 ✨",
    analyzing: "解梦中…",
    summary: "梦境速记",
    keywords: "关键词",
    advice: "调理建议",
    tip: "补充提示",
    insight: "潜意识洞察",
    healthCue: "健康启示",
    emotion: "情绪氛围",
    qiLink: "今日气运指数",
    liteBanner: "查看更多梦境含义 + 与体质的关系（$1 解锁）",
    feedbackTitle: "今晚觉得准吗？",
    feedbackOptions: [
      { key: "accurate", label: "✅ 很准" },
      { key: "neutral", label: "🤔 一般" },
      { key: "inaccurate", label: "❌ 不准" },
    ] as const,
    shareButton: "生成梦境签图",
    emptyAdvice: "AI 尚未找到具体建议，请补充更多细节。",
    errorTooShort: "梦境描述至少需要 50 字。",
    errorTooLong: "梦境描述需在 300 字以内。",
    errorGeneric: "解析失败，请稍后再试。",
    backLink: "← 返回梦境解析首页",
    addToText: "写入描述",
    shareSuccess: "签图已生成，新页面中打开。",
    shareError: "生成失败，请稍后再试。",
  },
  en: {
    title: "Instant Dream Decoder",
    subtitle: "Describe the dream you remember (50–300 chars) or pick keywords below.",
    placeholder: "Describe the dream snippet (50–300 chars) or pick keywords.",
    tagLabel: "Popular tags",
    selectedLabel: "Selected",
    charCount: (count: number) => `Characters: ${count} (ideal 50–300)`,
    submit: "Decode my dream ✨",
    analyzing: "Analyzing…",
    summary: "Dream snapshot",
    keywords: "Keywords",
    advice: "Care suggestions",
    tip: "Extra note",
    insight: "Symbolism",
    healthCue: "Health cue",
    emotion: "Emotional tone",
    qiLink: "Qi index today",
    liteBanner: "Unlock full symbolism + constitution linkage ($1)",
    feedbackTitle: "Did it resonate tonight?",
    feedbackOptions: [
      { key: "accurate", label: "✅ Accurate" },
      { key: "neutral", label: "🤔 So-so" },
      { key: "inaccurate", label: "❌ Not really" },
    ] as const,
    shareButton: "Generate dream card",
    emptyAdvice: "AI couldn't find specific suggestions yet. Try adding more detail.",
    errorTooShort: "Please enter at least 50 characters.",
    errorTooLong: "Dream text must stay within 300 characters.",
    errorGeneric: "Interpretation failed. Please try again later.",
    backLink: "← Back to dream overview",
    addToText: "Insert",
    shareSuccess: "Dream card generated in a new tab.",
    shareError: "Generation failed. Please retry later.",
  },
} as const;

type CopySet = (typeof COPY)[Locale];

type DreamAnalysis = {
  summary?: string | null;
  interpretation?: string | null;
  advice?: string[] | null;
  keywords?: string[] | null;
  tip?: string | null;
  tags?: string[] | null;
  mood?: string | null;
};

type SolarLite = {
  qi_luck_index?: number | null;
  qi_phrase?: string | null;
  emoji?: string | null;
  name?: string | null;
};

type PageProps = {
  params: { locale: Locale };
};

export default function DreamEntryPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const copy = COPY[locale];
  const router = useRouter();

  const [dreamText, setDreamText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [fallbackDetails, setFallbackDetails] = useState<ReturnType<typeof findDreamKeywordFallback> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solar, setSolar] = useState<SolarLite | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "saved">("idle");
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/solar?locale=${locale}&tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        if (data) {
          setSolar({
            qi_luck_index: data.qi_luck_index ?? null,
            qi_phrase: data.qi_phrase ?? null,
            emoji: data.emoji ?? null,
            name: data.name ?? null,
          });
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [locale]);

  const charCount = useMemo(() => dreamText.trim().length, [dreamText]);
  const isTooShort = charCount > 0 && charCount < 50;
  const isTooLong = charCount > 300;
  const canSubmit = !loading && charCount >= 50 && charCount <= 300;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const handleInsertTag = (tag: string) => {
    const cleaned = tag.replace(/\s+/g, "");
    if (!cleaned) return;
    setDreamText((prev) => {
      const trimmed = prev.trim();
      const separator = trimmed.length === 0 ? "" : trimmed.endsWith("，") || trimmed.endsWith("。") ? "" : "，";
      const appended = `${trimmed}${separator}${cleaned}`;
      return appended.slice(0, 300);
    });
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const fallbackWithKeywords = (text: string) => {
    const lowered = text.toLowerCase();
    const allKeywords = [...selectedTags, ...(analysis?.keywords ?? [])];
    for (const keyword of allKeywords) {
      const fallback = findDreamKeywordFallback(keyword, locale);
      if (fallback) return fallback;
    }
    const textFallbacks = ["牙齿", "teeth", "蛇", "snake", "飞行", "flying", "考试", "exam", "坠落", "falling", "水", "rain"];
    for (const word of textFallbacks) {
      if (lowered.includes(word.toLowerCase())) {
        const fallback = findDreamKeywordFallback(word, locale);
        if (fallback) return fallback;
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      if (isTooShort) {
        setError(copy.errorTooShort);
      } else if (isTooLong) {
        setError(copy.errorTooLong);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const response = await fetch("/api/dream/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dream_text: dreamText.trim(),
          locale,
          emotion: "unknown",
          tags: selectedTags,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload.error === "string" ? payload.error : copy.errorGeneric);
      }
      const result = (await response.json()) as DreamAnalysis;
      setAnalysis(result);
      setFallbackDetails(null);
    } catch (err) {
      const fallback = fallbackWithKeywords(dreamText);
      if (fallback) {
        setAnalysis({
          summary: null,
          interpretation: fallback.symbolism,
          advice: fallback.advice ? [fallback.advice] : null,
          keywords: [fallback.keyword],
          tip: fallback.healthCue ?? null,
          mood: fallback.emotion ?? null,
        });
        setFallbackDetails(fallback);
        setError(typeof err === "string" ? err : null);
      } else {
        setFallbackDetails(null);
        setError(err instanceof Error ? err.message : copy.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (value: "accurate" | "neutral" | "inaccurate") => {
    if (!dreamText.trim()) return;
    await saveDreamFeedback(dreamText, value);
    setFeedbackStatus("saved");
  };

  const handleShare = async () => {
    if (!analysis) return;
    if (typeof window === "undefined") return;
    const card = document.getElementById("dream-share-card");
    if (!card) {
      setShareStatus("error");
      setShareMessage(copy.shareError);
      return;
    }
    setShareStatus("loading");
    setShareMessage(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(card, {
        backgroundColor: "#F6F4EC",
        scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const token = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `dream-${Date.now()}`;
      sessionStorage.setItem(`seeqi-dream-share-${token}`, dataUrl);
      const query = selectedTags.length > 0 ? `?tags=${encodeURIComponent(selectedTags.join(","))}` : "";
      setShareStatus("success");
      setShareMessage(copy.shareSuccess);
      router.push(`/${locale}/dream/share/${token}${query}`);
    } catch (err) {
      console.error("dream-share", err);
      setShareStatus("error");
      setShareMessage(copy.shareError);
    }
  };

  const liteAdvice = analysis?.advice?.[0] ?? fallbackDetails?.advice ?? null;
  const symbolText = analysis?.interpretation ?? fallbackDetails?.symbolism ?? null;
  const healthCue = analysis?.tip ?? fallbackDetails?.healthCue ?? null;
  const keywords = analysis?.keywords ?? (fallbackDetails ? [fallbackDetails.keyword] : selectedTags);
  const mood = analysis?.mood ?? fallbackDetails?.emotion ?? null;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "5rem 1.5rem 4rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header
        style={{
          borderRadius: "28px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "2.6rem 2.2rem",
          boxShadow: "0 24px 48px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
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
          SeeQi · Dream Lab
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "2.5rem",
            lineHeight: 1.2,
            color: "#2C3E30",
          }}
        >
          {copy.title}
        </h1>
        <p style={{ margin: 0, lineHeight: 1.8, color: "#484235" }}>{copy.subtitle}</p>
        <Link
          href={`/${locale}/dream-analysis`}
          style={{
            alignSelf: "flex-start",
            color: "#8DAE92",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {copy.backLink}
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "1.8rem",
        }}
      >
        <section
          style={{
            borderRadius: "26px",
            padding: "1.8rem 2rem",
            background: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 22px 44px rgba(35, 64, 53, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
          }}
        >
          <textarea
            value={dreamText}
            onChange={(event) => setDreamText(event.target.value.slice(0, 320))}
            rows={8}
            placeholder={copy.placeholder}
            style={{
              width: "100%",
              borderRadius: "18px",
              border: "1px solid rgba(141, 174, 146, 0.35)",
              padding: "1.2rem 1.3rem",
              minHeight: "220px",
              resize: "vertical",
              fontSize: "1rem",
              lineHeight: 1.7,
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
            <span style={{ color: "rgba(44,62,48,0.65)", fontSize: "0.9rem" }}>{copy.charCount(charCount)}</span>
            {isTooShort || isTooLong ? (
              <span style={{ color: "#B45309", fontSize: "0.9rem" }}>{isTooShort ? copy.errorTooShort : copy.errorTooLong}</span>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ color: "#2C3E30" }}>{copy.tagLabel}</strong>
              {selectedTags.length > 0 ? (
                <span style={{ color: "rgba(44,62,48,0.65)", fontSize: "0.88rem" }}>
                  {copy.selectedLabel}：{selectedTags.join(" / ")}
                </span>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {HOT_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      borderRadius: "999px",
                      padding: "0.4rem 0.9rem",
                      border: active ? "none" : "1px solid rgba(141, 174, 146, 0.45)",
                      background: active ? "linear-gradient(135deg,#8DAE92,#7A9D7F)" : "rgba(255,255,255,0.85)",
                      color: active ? "#fff" : "#2C3E30",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>{tag}</span>
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        handleInsertTag(tag);
                      }}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.1rem 0.5rem",
                        borderRadius: "999px",
                        background: active ? "rgba(255,255,255,0.25)" : "rgba(141,174,146,0.15)",
                        color: active ? "#fff" : "#2C3E30",
                      }}
                    >
                      {copy.addToText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: "26px",
            padding: "1.8rem 2rem",
            background: "rgba(140, 122, 230, 0.08)",
            boxShadow: "0 22px 44px rgba(76, 95, 215, 0.14)",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              borderRadius: "18px",
              padding: "0.95rem 1.6rem",
              border: "none",
              background: canSubmit ? "linear-gradient(135deg,#8DAE92,#4C5FD7)" : "rgba(141,174,146,0.3)",
              color: canSubmit ? "#fff" : "rgba(44,62,48,0.6)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "transform 0.2s ease",
            }}
          >
            {loading ? copy.analyzing : copy.submit}
          </button>

          {error ? (
            <div
              style={{
                borderRadius: "16px",
                padding: "0.9rem 1.1rem",
                background: "rgba(220, 38, 38, 0.12)",
                color: "#991B1B",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}

          <DreamResultLite
            locale={locale}
            copy={copy}
            analysis={analysis}
            keywords={keywords}
            symbolText={symbolText}
            healthCue={healthCue}
            mood={mood}
            qi={solar?.qi_luck_index ?? null}
            qiPhrase={solar?.qi_phrase ?? null}
            emoji={solar?.emoji ?? null}
            liteAdvice={liteAdvice}
          />

          <div
            style={{
              borderRadius: "16px",
              padding: "0.85rem 1.2rem",
              background: "rgba(198,169,105,0.18)",
              color: "#8C6B28",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.8rem",
              flexWrap: "wrap",
            }}
          >
            <span>{copy.liteBanner}</span>
            <button
              type="button"
              style={{
                borderRadius: "999px",
                padding: "0.5rem 1.1rem",
                border: "none",
                background: "#8C6B28",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              $1 Unlock
            </button>
          </div>
        </section>
      </form>

      {analysis ? (
        <footer
          style={{
            borderRadius: "26px",
            padding: "1.8rem 2.1rem",
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 22px 44px rgba(35, 64, 53, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1.4rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ color: "#2C3E30" }}>{copy.feedbackTitle}</strong>
            {copy.feedbackOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleFeedback(item.key)}
                style={{
                  borderRadius: "999px",
                  padding: "0.45rem 1rem",
                  border: "1px solid rgba(141,174,146,0.45)",
                  background: "rgba(255,255,255,0.85)",
                  color: "#2C3E30",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
            {feedbackStatus === "saved" ? (
              <span style={{ color: "rgba(44,62,48,0.65)" }}>{locale === "zh" ? "已记录，谢谢反馈！" : "Thanks for the feedback!"}</span>
            ) : null}
          </div>

          <div
            id="dream-share-card"
            style={{
              borderRadius: "26px",
              padding: "1.8rem",
              background: "linear-gradient(135deg, rgba(246,244,236,0.95), rgba(222,233,227,0.95))",
              border: "1px solid rgba(141,174,146,0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "#234035", fontSize: "1.4rem" }}>{copy.summary}</h3>
                {solar?.name ? (
                  <span style={{ color: "rgba(35,64,53,0.65)", fontSize: "0.95rem" }}>
                    {solar.emoji ?? "🌤️"} {solar.name}
                  </span>
                ) : null}
              </div>
              <span style={{ color: "#8DAE92", fontWeight: 700 }}>SeeQi</span>
            </div>
            {symbolText ? <p style={{ margin: 0, color: "#2C3E30" }}>{symbolText}</p> : null}
            {keywords && keywords.length > 0 ? (
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                {keywords.slice(0, 4).map((keyword) => (
                  <span
                    key={`share-${keyword}`}
                    style={{
                      borderRadius: "999px",
                      padding: "0.3rem 0.75rem",
                      background: "rgba(76,95,215,0.14)",
                      color: "#4C5FD7",
                      fontWeight: 600,
                    }}
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            ) : null}
            {solar?.qi_luck_index != null ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ color: "#234035", fontWeight: 600 }}>{copy.qiLink}</span>
                <strong style={{ fontSize: "1.35rem", color: "#234035" }}>{Math.round(solar.qi_luck_index)}</strong>
                {solar.qi_phrase ? <span style={{ color: "rgba(35,64,53,0.65)" }}>{solar.qi_phrase}</span> : null}
              </div>
            ) : null}
            {liteAdvice ? (
              <div
                style={{
                  borderRadius: "14px",
                  padding: "0.75rem 1rem",
                  background: "rgba(198,169,105,0.18)",
                  color: "#8C6B28",
                  fontWeight: 600,
                }}
              >
                {liteAdvice}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleShare}
              style={{
                borderRadius: "999px",
                padding: "0.65rem 1.5rem",
                border: "none",
                background: "linear-gradient(135deg,#4F7B63,#C4A469)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copy.shareButton}
            </button>
            {shareMessage ? <span style={{ color: "rgba(44,62,48,0.7)" }}>{shareMessage}</span> : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

type DreamResultLiteProps = {
  locale: Locale;
  copy: CopySet;
  analysis: DreamAnalysis | null;
  keywords: string[];
  symbolText: string | null;
  healthCue: string | null;
  mood: string | null;
  qi: number | null;
  qiPhrase: string | null;
  emoji: string | null;
  liteAdvice: string | null;
};

function DreamResultLite({
  locale,
  copy,
  analysis,
  keywords,
  symbolText,
  healthCue,
  mood,
  qi,
  qiPhrase,
  emoji,
  liteAdvice,
}: DreamResultLiteProps) {
  if (!analysis) {
    return (
      <div
        style={{
          borderRadius: "20px",
          padding: "1.4rem 1.6rem",
          background: "rgba(255,255,255,0.9)",
          minHeight: "220px",
          border: "1px dashed rgba(140, 122, 230, 0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
          color: "#2C3E30",
        }}
      >
        <p style={{ color: "rgba(44,62,48,0.6)", margin: 0 }}>
          {locale === "zh"
            ? "输入梦境并点击“立即解梦 ✨”，AI 将生成梦境关键词、象征含义、健康启示与建议。"
            : "Describe your dream and tap “Decode my dream ✨” to surface keywords, symbolism, health cues, and advice."}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "1.4rem 1.6rem",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(140, 122, 230, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        color: "#2C3E30",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <strong style={{ color: "#4C5FD7" }}>{copy.keywords}</strong>
        {keywords.length > 0 ? (
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {keywords.slice(0, 5).map((keyword) => (
              <span
                key={`lite-${keyword}`}
                style={{
                  borderRadius: "999px",
                  background: "rgba(76,95,215,0.12)",
                  color: "#4C5FD7",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.92rem" }}>
            {locale === "zh" ? "暂无关键词，请补充梦境细节。" : "No keywords yet, try adding more detail."}
          </span>
        )}
      </div>

      {symbolText ? (
        <InfoRow title={copy.insight} content={symbolText} accent="rgba(76,95,215,0.12)" />
      ) : null}
      {healthCue ? <InfoRow title={copy.healthCue} content={healthCue} accent="rgba(141,174,146,0.16)" /> : null}
      {mood ? <InfoRow title={copy.emotion} content={mood} accent="rgba(198,169,105,0.15)" /> : null}

      {qi != null ? (
        <div
          style={{
            borderRadius: "16px",
            padding: "0.8rem 1rem",
            background: "rgba(198,169,105,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
        >
          <strong style={{ color: "#8C6B28" }}>{copy.qiLink}</strong>
          <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#8C6B28" }}>{Math.round(qi)}</span>
          {emoji ? <span style={{ fontSize: "1.3rem" }}>{emoji}</span> : null}
          {qiPhrase ? <span style={{ color: "rgba(140,109,40,0.78)" }}>{qiPhrase}</span> : null}
        </div>
      ) : null}

      {liteAdvice ? (
        <div
          style={{
            borderRadius: "16px",
            padding: "0.85rem 1.1rem",
            background: "rgba(141,174,146,0.18)",
            color: "#234035",
            fontWeight: 600,
          }}
        >
          {liteAdvice}
        </div>
      ) : (
        <span style={{ color: "rgba(44,62,48,0.6)" }}>{copy.emptyAdvice}</span>
      )}
    </div>
  );
}

function InfoRow({ title, content, accent }: { title: string; content: string; accent: string }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "0.85rem 1.1rem",
        background: accent,
        color: "#2C3E30",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <strong>{title}</strong>
      <span>{content}</span>
    </div>
  );
}

