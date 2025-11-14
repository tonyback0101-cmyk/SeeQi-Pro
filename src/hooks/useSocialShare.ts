import { useCallback, useMemo } from "react";

const SOCIAL_TARGETS = ["web", "wechat", "weibo", "instagram"] as const;

type SocialPlatform = (typeof SOCIAL_TARGETS)[number];

export type SharePayload = {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
};

export type SocialShareStatus = "idle" | "unsupported" | "sharing" | "error";

type UseSocialShareOptions = {
  locale?: "zh" | "en";
  onTrackShare?: (info: { platform: SocialPlatform; status: SocialShareStatus }) => void;
};

const messages = {
  zh: {
    unsupported: "当前浏览器不支持直接分享，已复制链接。",
    error: "分享时出现问题，请稍后重试。",
    copied: "链接已复制，可粘贴至社交媒体。",
    filter: "增强滤镜",
  },
  en: {
    unsupported: "Share API is not supported. Link copied to clipboard.",
    error: "Something went wrong while sharing. Please try again.",
    copied: "Link copied. You can paste it into social media now.",
    filter: "Enhance filter",
  },
};

type ShareImagePayload = {
  userName: string;
  resultSummary: string;
  detail?: string;
  locale?: "zh" | "en";
  branding?: {
    title?: string;
    subtitle?: string;
  };
};

type ShareResult = {
  status: SocialShareStatus;
  message?: string;
};

export function useSocialShare({ locale = "zh", onTrackShare }: UseSocialShareOptions = {}) {
  const t = useMemo(() => messages[locale], [locale]);

  const share = useCallback(
    async (payload: SharePayload) => {
      const { title, text, url = window.location.href, files } = payload;
      const result: ShareResult = {
        status: "idle",
      };

      onTrackShare?.({ platform: "web", status: "sharing" });
      if (navigator.share) {
        try {
          result.status = "sharing";
          await navigator.share({ title, text, url, files });
          result.status = "idle";
          onTrackShare?.({ platform: "web", status: "idle" });
          return result;
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            onTrackShare?.({ platform: "web", status: "idle" });
            return { status: "idle" };
          }
          console.error("[useSocialShare] navigator.share error:", error);
          onTrackShare?.({ platform: "web", status: "error" });
          return { status: "error", message: t.error };
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        onTrackShare?.({ platform: "web", status: "unsupported" });
        return { status: "unsupported", message: t.copied };
      } catch (error) {
        console.error("[useSocialShare] clipboard.writeText error:", error);
        onTrackShare?.({ platform: "web", status: "error" });
        return { status: "error", message: t.unsupported };
      }
    },
    [onTrackShare, t.copied, t.error, t.unsupported],
  );

  const generateShareUrl = useCallback(
    (baseUrl: string, params: Record<string, string | number | undefined>) => {
      const url = new URL(baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
      return url.toString();
    },
    [],
  );

  const generateShareImage = useCallback(async ({ userName, resultSummary, detail, branding }: ShareImagePayload) => {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#F9F7F3";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#8DAE92";
    ctx.fillRect(0, 0, width, 420);

    ctx.font = "bold 64px 'Arial'";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(branding?.title ?? "SeeQi Wellness", width / 2, 160);

    ctx.font = "32px 'Arial'";
    ctx.fillText(userName, width / 2, 260);

    ctx.fillStyle = "#ffffffcc";
    ctx.font = "28px 'Arial'";
    ctx.fillText(branding?.subtitle ?? "东方体质洞察", width / 2, 320);

    ctx.fillStyle = "#2C3E30";
    ctx.textAlign = "left";
    ctx.font = "bold 48px 'Arial'";
    ctx.fillText(resultSummary, 120, 560);

    if (detail) {
      ctx.font = "32px 'Arial'";
      const lines = detail.split("\n");
      lines.forEach((line, index) => {
        ctx.fillText(line, 120, 640 + index * 48);
      });
    }

    ctx.fillStyle = "#8DAE92";
    ctx.fillRect(120, height - 260, width - 240, 140);
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px 'Arial'";
    ctx.textAlign = "center";
    ctx.fillText(locale === "zh" ? "扫描体验更多东方智慧" : "Scan to explore Eastern wellness", width / 2, height - 188);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve(new File([blob], `seeqi-share-${Date.now()}.png`, { type: "image/png" }));
        },
        "image/png",
        0.92,
      );
    });
  }, [locale]);

  const downloadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const shareToPlatform = useCallback(
    async (platform: SocialPlatform, payload: SharePayload & { imageFile?: File }) => {
      const baseShare = { ...payload };
      switch (platform) {
        case "wechat":
          baseShare.text = `${payload.text ?? ""}\n#SeeQi ${payload.url ?? ""}`;
          break;
        case "weibo":
          baseShare.text = `${payload.title} ${payload.text ?? ""} ${payload.url ?? ""} #SeeQi东方体质洞察#`;
          break;
        case "instagram":
          // Instagram requires image upload; fallback to download prompt
          if (payload.files?.length || payload.imageFile) {
            onTrackShare?.({ platform, status: "unsupported" });
            if (payload.imageFile) downloadImage(payload.imageFile);
            return { status: "unsupported", message: t.copied };
          }
          break;
        default:
          break;
      }
      const response = await share(baseShare);
      onTrackShare?.({ platform, status: response.status as SocialShareStatus });
      return response;
    },
    [downloadImage, onTrackShare, share, t.copied],
  );

  return {
    share,
    generateShareUrl,
    generateShareImage,
    downloadImage,
    shareToPlatform,
  };
}

