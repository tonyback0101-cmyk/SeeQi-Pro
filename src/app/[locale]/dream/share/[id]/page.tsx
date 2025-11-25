"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Locale = "zh" | "en";

const COPY = {
  zh: {
    title: "梦境签图",
    subtitle: "保存或分享今天的梦境洞察。",
    missing: "未检测到签图，请返回重新生成。",
    regenerate: "返回梦境解析",
    download: "保存 PNG",
    tags: "关键词",
  },
  en: {
    title: "Dream Insight Card",
    subtitle: "Save or share tonight's dream snapshot.",
    missing: "No card found. Please regenerate from the dream page.",
    regenerate: "Back to dream page",
    download: "Save PNG",
    tags: "Tags",
  },
} as const;

type PageProps = {
  params: { locale: Locale; id: string };
};

export default function DreamShareViewer({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const id = params.id;
  const copy = COPY[locale];
  const searchParams = useSearchParams();
  const tags = useMemo(() => {
    const raw = searchParams?.get("tags");
    if (!raw) return [];
    return raw.split(",").filter(Boolean);
  }, [searchParams]);

  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `seeqi-dream-share-${id}`;
    const stored = sessionStorage.getItem(storageKey);
    setImageData(stored);
  }, [id]);

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `seeqi-dream-card-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main
      style={{
        maxWidth: "940px",
        margin: "0 auto",
        padding: "3.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.8rem",
        alignItems: "center",
      }}
    >
      <header style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem", color: "#234035" }}>{copy.title}</h1>
        <p style={{ margin: 0, color: "rgba(35,64,53,0.72)" }}>{copy.subtitle}</p>
      </header>

      {imageData ? (
        <section
          style={{
            borderRadius: "28px",
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(141,174,146,0.25)",
            boxShadow: "0 28px 48px rgba(35,64,53,0.16)",
            padding: "1.8rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "min(620px, 100%)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid rgba(35,64,53,0.12)",
            }}
          >
            <Image src={imageData} alt="SeeQi dream share card" width={1240} height={1600} unoptimized priority style={{ width: "100%", height: "auto" }} />
          </div>

          {tags.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <strong style={{ color: "#234035" }}>{copy.tags}:</strong>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    borderRadius: "999px",
                    padding: "0.3rem 0.75rem",
                    background: "rgba(76,95,215,0.14)",
                    color: "#4C5FD7",
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.8rem" }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                borderRadius: "999px",
                padding: "0.7rem 1.6rem",
                border: "none",
                background: "linear-gradient(135deg,#4F7B63,#C4A469)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copy.download}
            </button>
            <Link
              href={`/${locale}/dream`}
              style={{
                borderRadius: "999px",
                padding: "0.7rem 1.6rem",
                border: "1px solid rgba(141,174,146,0.4)",
                background: "rgba(255,255,255,0.85)",
                color: "#234035",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {copy.regenerate}
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(141,174,146,0.25)",
            background: "rgba(255,255,255,0.94)",
            padding: "2rem",
            textAlign: "center",
            color: "rgba(35,64,53,0.7)",
          }}
        >
          <p>{copy.missing}</p>
          <Link
            href={`/${locale}/dream`}
            style={{
              marginTop: "1rem",
              display: "inline-block",
              borderRadius: "999px",
              padding: "0.75rem 1.6rem",
              border: "none",
              background: "linear-gradient(135deg,#4F7B63,#C4A469)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {copy.regenerate}
          </Link>
        </section>
      )}
    </main>
  );
}

