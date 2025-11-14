'use client';

import { useMemo, useState } from "react";

type Props = {
  link: string;
  locale: "zh" | "en";
  refCode?: string | null;
  primaryColor: string;
  secondaryColor: string;
  title: string;
  description: string;
};

type Messages = {
  copySuccess: string;
  copyError: string;
  downloadSuccess: string;
  downloadError: string;
  copyButton: string;
  downloadButton: string;
  refLabel: string;
  linkLabel: string;
  previewLabel: string;
};

const localeMessages: Record<Props["locale"], Messages> = {
  zh: {
    copySuccess: "已复制推广链接",
    copyError: "复制失败，请手动复制",
    downloadSuccess: "二维码已下载",
    downloadError: "下载失败，请稍后再试",
    copyButton: "复制链接",
    downloadButton: "下载二维码",
    refLabel: "专属邀请码",
    linkLabel: "推广链接",
    previewLabel: "二维码预览",
  },
  en: {
    copySuccess: "Link copied",
    copyError: "Copy failed, please copy manually",
    downloadSuccess: "QR code downloaded",
    downloadError: "Download failed, retry later",
    copyButton: "Copy Link",
    downloadButton: "Download QR",
    refLabel: "Referral Code",
    linkLabel: "Referral Link",
    previewLabel: "QR Preview",
  },
};

export default function AffiliateShareTools({
  link,
  locale,
  refCode,
  primaryColor,
  secondaryColor,
  title,
  description,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const messages = localeMessages[locale];

  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(link)}`;
  }, [link]);

  const handleCopy = async () => {
    setStatus(null);
    setStatusType(null);
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setStatus(messages.copySuccess);
      setStatusType("success");
    } catch (error) {
      console.error("AffiliateShareTools copy error", error);
      setStatus(messages.copyError);
      setStatusType("error");
    }
  };

  const handleDownload = async () => {
    setStatus(null);
    setStatusType(null);
    setIsDownloading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `seeqi-ref-${refCode || "qr"}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
      setStatus(messages.downloadSuccess);
      setStatusType("success");
    } catch (error) {
      console.error("AffiliateShareTools download error", error);
      setStatus(messages.downloadError);
      setStatusType("error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: "24px",
        border: "1px solid rgba(141, 174, 146, 0.25)",
        background: "rgba(255, 255, 255, 0.92)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#23362D",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "rgba(34, 48, 44, 0.7)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            style={{
              borderRadius: "999px",
              border: `1px solid ${primaryColor}`,
              background: primaryColor,
              color: "#fff",
              padding: "0.65rem 1.6rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {messages.copyButton}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              borderRadius: "999px",
              border: `1px solid ${secondaryColor}`,
              background: "#fff",
              color: secondaryColor,
              padding: "0.65rem 1.6rem",
              fontWeight: 600,
              cursor: isDownloading ? "default" : "pointer",
              opacity: isDownloading ? 0.75 : 1,
            }}
          >
            {isDownloading ? `${messages.downloadButton}…` : messages.downloadButton}
          </button>
        </div>
        <div
          style={{
            border: "1px dashed rgba(141, 174, 146, 0.4)",
            borderRadius: "16px",
            padding: "1rem",
            fontSize: "0.95rem",
            color: "rgba(34, 48, 44, 0.7)",
            wordBreak: "break-all",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.35rem" }}>{messages.linkLabel}</strong>
          {link}
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: "rgba(34, 48, 44, 0.6)",
          }}
        >
          {messages.refLabel}：{refCode || (locale === "zh" ? "暂未分配" : "N/A")}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "rgba(34, 48, 44, 0.6)",
            }}
          >
            {messages.previewLabel}
          </div>
          <div
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              border: "1px solid rgba(141, 174, 146, 0.2)",
              width: "180px",
              height: "180px",
            }}
          >
            <img
              src={qrUrl}
              alt="SeeQi referral QR"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
        {status && (
          <div
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1rem",
              background: statusType === "success" ? "rgba(236, 253, 245, 0.9)" : "rgba(254, 226, 226, 0.9)",
              color: statusType === "success" ? "#065F46" : "#7F1D1D",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
