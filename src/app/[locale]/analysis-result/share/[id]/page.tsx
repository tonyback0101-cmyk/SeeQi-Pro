"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Locale = "zh" | "en";

const COPY = {
  zh: {
    title: "分享签图",
    description: "已生成的签图仅保存在本地会话内，可直接保存或转发。",
    missing: "未检测到签图，请返回报告页面重新生成。",
    regenerate: "返回报告页面",
    download: "保存 PNG",
    shareLink: "复制分享链接",
    copying: "复制中…",
    copied: "分享链接已复制",
    copyFailed: "复制失败，请手动复制。",
  },
  en: {
    title: "Shareable Qi Card",
    description: "Generated card is stored locally. Save or forward it directly.",
    missing: "No card detected. Go back to the report page to regenerate.",
    regenerate: "Back to report",
    download: "Save PNG",
    shareLink: "Copy share link",
    copying: "Copying…",
    copied: "Link copied",
    copyFailed: "Copy failed, please use manual copy.",
  },
} as const;

type PageProps = {
  params: { locale: Locale; id: string };
};

export default function ShareCardViewer({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const id = params.id;
  const t = COPY[locale];
  const [imageData, setImageData] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "success" | "error">("idle");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams?.get("ref") ?? null;

  useEffect(() => {
    const storageKey = `seeqi-share-card-${id}`;
    const stored = sessionStorage.getItem(storageKey);
    setImageData(stored);
  }, [id]);

  const shareLink = useMemo(() => {
    const base = `/share/${id}`;
    if (ref) {
      return `${base}?ref=${encodeURIComponent(ref)}`;
    }
    return base;
  }, [id, ref]);

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `seeqi-qi-card-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyShareLink = async () => {
    setCopyState("copying");
    setCopyMessage(t.copying);
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(`${window.location.origin}${shareLink}`);
      setCopyState("success");
      setCopyMessage(t.copied);
    } catch (error) {
      console.error("share-link-copy", error);
      setCopyState("error");
      setCopyMessage(t.copyFailed);
    } finally {
      setTimeout(() => {
        setCopyState("idle");
      }, 2400);
    }
  };

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "3.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.6rem",
        alignItems: "center",
      }}
    >
      <header style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <h1 style={{ margin: 0, fontSize: "2.1rem", color: "#234035" }}>{t.title}</h1>
        <p style={{ margin: 0, color: "rgba(35,64,53,0.72)" }}>{t.description}</p>
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
            gap: "1rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "min(600px, 100%)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid rgba(35,64,53,0.12)",
            }}
          >
            <Image
              src={imageData}
              alt="SeeQi shareable qi card"
              width={1200}
              height={1600}
              unoptimized
              style={{ width: "100%", height: "auto", display: "block" }}
              priority
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.8rem" }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                borderRadius: 999,
                padding: "0.7rem 1.6rem",
                border: "none",
                background: "linear-gradient(135deg,#4F7B63,#C4A469)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.download}
            </button>
            <button
              type="button"
              onClick={handleCopyShareLink}
              style={{
                borderRadius: 999,
                padding: "0.7rem 1.6rem",
                border: "1px solid rgba(141,174,146,0.4)",
                background: "rgba(255,255,255,0.85)",
                color: "#234035",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copyState === "copying" ? t.copying : t.shareLink}
            </button>
          </div>
          {copyMessage ? <span style={{ color: "rgba(35,64,53,0.7)" }}>{copyMessage}</span> : null}
          <Link
            href={`/${locale}/analysis-result/${id}`}
            style={{
              color: "#4C5FD7",
              fontWeight: 600,
              textDecoration: "none",
              marginTop: "0.5rem",
            }}
          >
            {t.regenerate}
          </Link>
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
          <p>{t.missing}</p>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/analysis-result/${id}`)}
            style={{
              marginTop: "1rem",
              borderRadius: 999,
              padding: "0.75rem 1.6rem",
              border: "none",
              background: "linear-gradient(135deg,#4F7B63,#C4A469)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.regenerate}
          </button>
        </section>
      )}
    </main>
  );
}

