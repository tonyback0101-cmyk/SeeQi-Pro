/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { loadData, savePalmData, markSkipped, resetStatus, markInProgress } from "@/state/assessmentStorage";
import type { PalmRecordData } from "@/types/assessment";
import type { PalmHandType, PalmPrintData, PalmRegion } from "@/types/palmprint";
import ModuleNav from "@/components/assessment/ModuleNav";
import PalmFeatureAnnotator from "@/components/palm/PalmFeatureAnnotator";
import PalmBatchUploader from "@/components/palm/PalmBatchUploader";
import { enqueuePalmUpload, getPalmUploadQueue, removePalmUpload, updatePalmUpload, type PalmUploadQueueItem } from "@/lib/palmprints/offlineQueue";

const MobileCamera = dynamic(() => import("@/components/MobileCamera"), { ssr: false });

const handednessOptions = [
  { value: "left", zh: "左手为主", en: "Left hand focus" },
  { value: "right", zh: "右手为主", en: "Right hand focus" },
  { value: "both", zh: "双手采集", en: "Both hands" },
] as const;

const captureModes = [
  { value: "camera", zh: "使用摄像头拍摄", en: "Capture via camera" },
  { value: "upload", zh: "上传现有照片", en: "Upload existing photo" },
] as const;

const palmColors = [
  { value: "pale", zh: "泛白", en: "Pale" },
  { value: "pink", zh: "粉润", en: "Pink" },
  { value: "red", zh: "偏红", en: "Red" },
  { value: "yellow", zh: "蜡黄", en: "Yellow" },
  { value: "dark", zh: "暗紫", en: "Dark" },
] as const;

const palmTextures = [
  { value: "dry", zh: "偏干", en: "Dry" },
  { value: "moist", zh: "滋润", en: "Moist" },
  { value: "rough", zh: "粗糙", en: "Rough" },
  { value: "smooth", zh: "细腻", en: "Smooth" },
] as const;

const lifeLineOptions = [
  { value: "deep", zh: "深长", en: "Deep / long" },
  { value: "shallow", zh: "浅淡", en: "Shallow" },
  { value: "broken", zh: "断续", en: "Broken" },
  { value: "double", zh: "双重", en: "Double" },
] as const;

const heartLineOptions = [
  { value: "long", zh: "长且清晰", en: "Long" },
  { value: "short", zh: "短且靠前", en: "Short" },
  { value: "curved", zh: "弯曲明显", en: "Curved" },
  { value: "straight", zh: "平直", en: "Straight" },
] as const;

const headLineOptions = [
  { value: "clear", zh: "清晰有力", en: "Clear" },
  { value: "wavy", zh: "呈波浪状", en: "Wavy" },
  { value: "broken", zh: "断续不连", en: "Broken" },
  { value: "forked", zh: "末端分叉", en: "Forked" },
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
    zh: "如何拍摄掌纹",
    en: "How to capture palm prints",
  },
  intro: {
    zh: "保持光线柔和、手掌自然放松，使用主采集手贴近镜头拍摄。",
    en: "Use soft lighting, relax your palm and keep the focus hand close to the camera.",
  },
  steps: [
    {
      zh: "清洁双手并擦干，避免水滴或油光影响纹路。",
      en: "Clean and dry your hands to avoid glare or blur.",
    },
    {
      zh: "伸展手掌，确保掌心平整对着镜头。",
      en: "Open your palm fully and face the camera directly.",
    },
    {
      zh: "拍摄多张不同角度的照片，便于 AI 识别掌线。",
      en: "Capture multiple angles to help AI read the lines clearly.",
    },
  ],
};

export default function PalmCollectionPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [handedness, setHandedness] = useState<PalmRecordData["handedness"]>("right");
  const [captureMode, setCaptureMode] = useState<PalmRecordData["captureMode"]>("camera");
  const [color, setColor] = useState<PalmRecordData["color"]>("pink");
  const [texture, setTexture] = useState<PalmRecordData["texture"]>("smooth");
  const [lifeLine, setLifeLine] = useState<PalmRecordData["lifeLine"]>();
  const [heartLine, setHeartLine] = useState<PalmRecordData["heartLine"]>();
  const [headLine, setHeadLine] = useState<PalmRecordData["headLine"]>();
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [guide, setGuide] = useState<{ title?: unknown; intro?: unknown; steps?: unknown[] } | null>(defaultGuide);
  const [records, setRecords] = useState<PalmPrintData[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [uploadHand, setUploadHand] = useState<"left" | "right">(handedness === "right" ? "right" : "left");
  const [palmRegion, setPalmRegion] = useState<"full" | "palm" | "fingers">("full");
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [annotatingRecord, setAnnotatingRecord] = useState<PalmPrintData | null>(null);
  const [offlineUploads, setOfflineUploads] = useState<PalmUploadQueueItem[]>([]);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  type UploadPayload = {
    file: Blob;
    fileName: string;
    handType: PalmHandType;
    palmRegion: PalmRegion;
    captureMethod: string;
    qualityRating: number | null;
  };

  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputId = useId();
  const cameraInputId = useId();
  const [cameraSupported, setCameraSupported] = useState(false);
  const [isPointerCoarse, setIsPointerCoarse] = useState(false);
  const [activeCameraMode, setActiveCameraMode] = useState<"palm" | null>(null);
  const cameraUnavailableText =
    locale === "zh"
      ? "当前设备暂不支持摄像头，请改用上传方式。"
      : "Camera is unavailable on this device. Please upload instead.";
  const cameraDesktopGuide =
    locale === "zh"
      ? "桌面浏览器会弹出带取景框的摄像窗口，请允许权限并点击“拍照”按钮完成采集。"
      : "Desktop browsers open a guided camera window—allow access and press Capture to take your photo.";
  const cameraFallbackText =
    locale === "zh"
      ? "若摄像头无法启动，可切换为“上传现有照片”或直接拖拽图片。"
      : "If the camera cannot start, switch to Upload existing photo or drag a file here.";
  const convertErrorText =
    locale === "zh"
      ? "暂时无法自动转换该图片，请先在本地另存为 JPG/PNG 后重新上传。"
      : "We couldn't convert this photo automatically. Please save it as JPG/PNG and upload again.";

  useEffect(() => {
    const stored = loadData().palm;
    if (stored) {
      setHandedness(stored.handedness);
      setCaptureMode(stored.captureMode);
       setColor(stored.color ?? "pink");
       setTexture(stored.texture ?? "smooth");
       setLifeLine(stored.lifeLine);
       setHeartLine(stored.heartLine);
       setHeadLine(stored.headLine);
      setNotes(stored.notes ?? "");
    }
    markInProgress("palm");
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [handedness, captureMode, color, texture, lifeLine, heartLine, headLine, notes]);

  useEffect(() => {
    if (handedness === "left" || handedness === "right") {
      setUploadHand(handedness);
    }
  }, [handedness]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    setCameraSupported(Boolean(window.isSecureContext !== false && navigator.mediaDevices?.getUserMedia));
    if (typeof window.matchMedia !== "function") {
      setIsPointerCoarse(false);
      return;
    }
    const media = window.matchMedia("(pointer: coarse)");
    const updatePointer = (event?: MediaQueryListEvent) => {
      setIsPointerCoarse(event ? event.matches : media.matches);
    };
    updatePointer();
    if (typeof media.addEventListener === "function") {
      const listener = (event: MediaQueryListEvent) => updatePointer(event);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    const legacyListener = (event: MediaQueryListEvent) => updatePointer(event);
    media.addListener(legacyListener);
    return () => media.removeListener(legacyListener);
  }, []);

  useEffect(() => {
    if (captureMode !== "camera") {
      setActiveCameraMode(null);
    }
  }, [captureMode]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings?keys=collection.guides")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !mounted) return;
        const guides = data.settings?.["collection.guides"] as Record<string, unknown> | undefined;
        if (guides && typeof guides === "object" && guides.palm) {
          setGuide(guides.palm as { title?: unknown; intro?: unknown; steps?: unknown[] });
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const loadOfflineUploads = useCallback(async () => {
    const items = await getPalmUploadQueue();
    setOfflineUploads(items);
  }, []);

  const refreshRecords = async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const response = await fetch("/api/palmprints");
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            locale === "zh"
              ? "请登录后查看已上传的掌纹记录。"
              : "Sign in to view your uploaded palmprints."
          );
        }
        throw new Error(locale === "zh" ? "掌纹记录获取失败" : "Failed to load palmprints");
      }
      const payload = await response.json();
      setRecords(Array.isArray(payload?.items) ? (payload.items as PalmPrintData[]) : []);
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : locale === "zh" ? "掌纹记录加载失败" : "Failed to load palmprints");
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    refreshRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: PalmRecordData = {
      handedness,
      captureMode,
      color,
      texture,
      lifeLine,
      heartLine,
      headLine,
      notes: notes.trim() ? notes.trim() : undefined,
      createdAt: Date.now(),
    };
    savePalmData(payload);
    setSaved(true);
  };

  const handleSkip = () => {
    markSkipped("palm");
    setSaved(false);
  };

  const handleRestore = () => {
    resetStatus("palm");
    setSaved(false);
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  useEffect(() => {
    loadOfflineUploads();
  }, [loadOfflineUploads]);

  const uploadPalmToServer = useCallback(
    async ({ file, fileName, handType, palmRegion, captureMethod, qualityRating }: UploadPayload) => {
      const formData = new FormData();
      formData.set("image", file, fileName);
      formData.set("handType", handType);
      formData.set("palmRegion", palmRegion);
      formData.set("captureMethod", captureMethod);
      if (qualityRating) {
        formData.set("qualityRating", String(qualityRating));
      }

      const response = await fetch("/api/palmprints/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || (locale === "zh" ? "上传失败" : "Upload failed"));
      }

      return response.json();
    },
    [locale]
  );

  const syncOfflineUploads = useCallback(async () => {
    const queue = await getPalmUploadQueue();
    if (queue.length === 0) {
      setOfflineUploads(queue);
      return;
    }
    if (syncingOffline) return;

    setSyncingOffline(true);
    let syncedCount = 0;
    let latestError: string | null = null;

    for (const item of queue) {
      try {
        await uploadPalmToServer({
          file: item.file,
          fileName: item.fileName,
          handType: item.handType,
          palmRegion: item.palmRegion,
          captureMethod: item.captureMethod,
          qualityRating: item.qualityRating,
        });
        await removePalmUpload(item.id);
        syncedCount += 1;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : locale === "zh"
            ? "离线上传失败"
            : "Failed to sync offline upload";
        latestError = message;
        await updatePalmUpload(item.id, {
          lastTriedAt: Date.now(),
          error: message,
        });
      }
    }

    await loadOfflineUploads();

    if (syncedCount > 0) {
      await refreshRecords();
      setOfflineMessage(
        locale === "zh" ? `有 ${syncedCount} 条掌纹已同步成功。` : `${syncedCount} offline palmprint(s) synced.`
      );
    }
    if (latestError) {
      setOfflineMessage((prev) =>
        prev ? `${prev} ${latestError}` : locale === "zh" ? `${latestError}，稍后将自动重试。` : `${latestError}. Will retry later.`
      );
    }

    setSyncingOffline(false);
  }, [locale, loadOfflineUploads, refreshRecords, syncingOffline, uploadPalmToServer]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(online);
      if (online) {
        syncOfflineUploads();
      }
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [syncOfflineUploads]);

  const normalizeToJpeg = async (incoming: File): Promise<File | null> => {
    if (typeof window === "undefined") return incoming;
    if (!incoming.type || incoming.type === "image/jpeg" || incoming.type === "image/png") {
      return incoming;
    }
    if (!incoming.type.startsWith("image/")) return incoming;
    try {
      const convertWithBitmap = async () => {
        const bitmap = await createImageBitmap(incoming);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(bitmap, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) return null;
        return new File(
          [blob],
          `${incoming.name.replace(/\.[^/.]+$/, "") || "palm"}-${Date.now()}.jpg`,
          { type: "image/jpeg" },
        );
      };

      const convertWithImage = async () => {
        const url = URL.createObjectURL(incoming);
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
          if (!blob) return null;
          return new File(
            [blob],
            `${incoming.name.replace(/\.[^/.]+$/, "") || "palm"}-${Date.now()}.jpg`,
            { type: "image/jpeg" },
          );
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      if ("createImageBitmap" in window) {
        const converted = await convertWithBitmap();
        if (converted) {
          return converted;
        }
      }
      return await convertWithImage();
    } catch {
      return null;
    }
  };

  const handleFileSelected = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!file) {
      clearSelectedFile();
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
    setUploadSuccess(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleInputFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      handleFileSelected(null);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }
    const processed = await normalizeToJpeg(file);
    if (!processed) {
      setUploadError(convertErrorText);
      handleFileSelected(null);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }
    handleFileSelected(processed);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleCameraConfirm = (file: File) => {
    normalizeToJpeg(file)
      .then((processed) => {
        if (!processed) {
          setUploadError(convertErrorText);
          return;
        }
        handleFileSelected(processed);
        setActiveCameraMode(null);
      })
      .catch(() => {
        setUploadError(convertErrorText);
      });
  };

  const handleCameraClose = () => {
    setActiveCameraMode(null);
  };

  const handleCameraRequest = () => {
    if (!cameraSupported) {
      setUploadError(cameraUnavailableText);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
        cameraInputRef.current.click();
      }
      return;
    }
    setUploadError(null);
    setActiveCameraMode("palm");
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) {
      handleFileSelected(null);
      return;
    }
    const processed = await normalizeToJpeg(file);
    if (!processed) {
      setUploadError(convertErrorText);
      handleFileSelected(null);
      return;
    }
    handleFileSelected(processed);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(locale === "zh" ? "请先选择或拍摄一张掌纹照片后再上传。" : "Please select or capture a palm image before uploading.");
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_SIZE) {
      setUploadError(locale === "zh" ? "图片超过 10MB，请压缩后再试。" : "Image exceeds 10MB. Please compress and try again.");
      return;
    }

    const payload: UploadPayload = {
      file: selectedFile,
      fileName: selectedFile.name || `palm-${Date.now()}.jpg`,
      handType: uploadHand,
      palmRegion,
      captureMethod: captureMode,
      qualityRating,
    };

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setOfflineMessage(null);

    const queueMessage =
      locale === "zh"
        ? "网络不可用，已保存至离线队列，联网后会自动上传。"
        : "Network unavailable. Saved to offline queue and will sync when online.";

    const storeOffline = async () => {
      await enqueuePalmUpload({
        file: payload.file,
        fileName: payload.fileName,
        handType: payload.handType,
        palmRegion: payload.palmRegion,
        captureMethod: payload.captureMethod,
        qualityRating: payload.qualityRating,
      });
      clearSelectedFile();
      setUploadSuccess(queueMessage);
      setOfflineMessage(queueMessage);
      await loadOfflineUploads();
    };

    try {
      if (!isOnline) {
        await storeOffline();
        return;
      }

      await uploadPalmToServer(payload);
      setUploadSuccess(locale === "zh" ? "掌纹上传成功。" : "Palmprint uploaded successfully.");
      clearSelectedFile();
      await refreshRecords();
    } catch (error) {
      const networkError = !navigator.onLine || error instanceof TypeError;
      if (networkError) {
        await storeOffline();
        setIsOnline(false);
      } else {
        const message =
          error instanceof Error
            ? error.message
            : locale === "zh"
            ? "上传失败，请稍后再试。"
            : "Upload failed. Please try again later.";
        setUploadError(message);
      }
    } finally {
      await loadOfflineUploads();
      setUploading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm(locale === "zh" ? "确定删除该掌纹记录？此操作不可恢复。" : "Delete this palmprint? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/palmprints/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshRecords();
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : locale === "zh" ? "删除失败，请稍后再试。" : "Failed to delete palmprint.");
    }
  };

  const handleBatchUploadComplete = useCallback(
    async (files: Array<{ file: File; handType: PalmHandType; palmRegion: PalmRegion; captureMethod: string; qualityRating: number | null }>) => {
      setUploadSuccess(null);
      setUploadError(null);

      const results = {
        success: 0,
        queued: 0,
        failed: 0,
      };

      for (const item of files) {
        const payload: UploadPayload = {
          file: item.file,
          fileName: item.file.name || `palm-${Date.now()}.jpg`,
          handType: item.handType,
          palmRegion: item.palmRegion,
          captureMethod: item.captureMethod,
          qualityRating: item.qualityRating,
        };

        if (!isOnline) {
          await enqueuePalmUpload(payload);
          results.queued += 1;
          continue;
        }

        try {
          await uploadPalmToServer(payload);
          results.success += 1;
        } catch (error) {
          const networkError = !navigator.onLine || error instanceof TypeError;
          if (networkError) {
            await enqueuePalmUpload(payload);
            results.queued += 1;
          } else {
            results.failed += 1;
          }
        }
      }

      await refreshRecords();
      await loadOfflineUploads();

      const summaryParts: string[] = [];
      if (results.success) {
        summaryParts.push(
          locale === "zh"
            ? `${results.success} 张已成功上传`
            : `${results.success} file${results.success > 1 ? "s" : ""} uploaded`
        );
      }
      if (results.queued) {
        summaryParts.push(
          locale === "zh"
            ? `${results.queued} 张暂存离线队列`
            : `${results.queued} file${results.queued > 1 ? "s" : ""} queued offline`
        );
      }
      if (results.failed) {
        summaryParts.push(
          locale === "zh"
            ? `${results.failed} 张上传失败`
            : `${results.failed} file${results.failed > 1 ? "s" : ""} failed`
        );
      }

      if (summaryParts.length > 0) {
        setUploadSuccess(summaryParts.join("，"));
      }
    },
    [isOnline, loadOfflineUploads, locale, refreshRecords, uploadPalmToServer]
  );

  return (
    <main
      style={{
        maxWidth: "980px",
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
          boxShadow: "0 20px 36px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "#8DAE92",
            fontWeight: 600,
          }}
        >
          {locale === "zh" ? "手相掌纹采集" : "Palm Capture"}
        </span>
        <h1 style={{ margin: 0, fontSize: "2.2rem", color: "#2C3E30" }}>
          {locale === "zh" ? "准备掌纹采集指引" : "Prepare your palm capture"}
        </h1>
        <p style={{ margin: 0, color: "#4A4A4A", lineHeight: 1.7 }}>
          {locale === "zh"
            ? "选择主要采集手与方式，未来将提供 AI 质量检测与实时提点。"
            : "Choose your focus hand and capture mode. AI quality checks and live overlays are coming soon."}
        </p>
      </header>

      <ModuleNav locale={locale} current="palm" />

      <section
        style={{
          borderRadius: "24px",
          padding: "1.8rem",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 20px 38px rgba(45,64,51,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#2C3E30" }}>
            {locale === "zh" ? "上传掌纹照片" : "Upload palm image"}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.66)" }}>
            {locale === "zh"
              ? "选择对应手掌与区域，拍摄或上传清晰的掌纹图片，然后点击上传即可同步到云端。"
              : "Select the hand and region, capture or upload a clear palm image, then upload to sync it to the cloud."}
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44,62,48,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            <li>
              {locale === "zh"
                ? "首次使用摄像头会弹出权限请求，如误拒绝，可在浏览器地址栏旁的“相机”图标中重新授予权限。"
                : "On the first camera use you'll see a permission prompt—if you dismissed it, re-enable access via the browser’s camera icon."}
            </li>
            <li>
              {locale === "zh"
                ? "建议使用自然光或柔光，避免强烈背光，保持掌心与镜头平行、占满取景框。"
                : "Use natural or soft lighting, avoid strong backlight, and keep the palm parallel to the lens filling the frame."}
            </li>
            <li>
              {locale === "zh"
                ? "若上传提示需要登录或网络异常，请刷新页面重新尝试，并确认网络稳定。"
                : "If the upload fails due to authentication or connectivity, refresh the page, ensure you're signed in, and try again."}
            </li>
          </ul>
        </header>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label style={{ fontWeight: 600, color: "#2C3E30" }}>
              {locale === "zh" ? "本次上传手掌" : "Hand for this upload"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {(["left", "right"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setUploadHand(value)}
                  style={{
                    borderRadius: "999px",
                    padding: "0.55rem 1.1rem",
                    border: uploadHand === value ? "1px solid rgba(141, 174, 146, 0.85)" : "1px solid rgba(141, 174, 146, 0.35)",
                    background: uploadHand === value ? "rgba(141, 174, 146, 0.18)" : "transparent",
                    color: "#2C3E30",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {value === "left"
                    ? locale === "zh"
                      ? "左手"
                      : "Left"
                    : locale === "zh"
                    ? "右手"
                    : "Right"}
                </button>
              ))}
            </div>
            {handedness === "both" ? (
              <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>
                {locale === "zh" ? "提示：当前设置为双手采集，请分别上传左右手。" : "Tip: preferences set to both hands. Upload left and right separately."}
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label style={{ fontWeight: 600, color: "#2C3E30" }}>
              {locale === "zh" ? "掌纹区域" : "Palm region"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { value: "full", zh: "整掌", en: "Full hand" },
                { value: "palm", zh: "掌心", en: "Palm" },
                { value: "fingers", zh: "手指", en: "Fingers" },
              ].map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setPalmRegion(option.value as typeof palmRegion)}
                  style={{
                    borderRadius: "999px",
                    padding: "0.55rem 1.1rem",
                    border:
                      palmRegion === option.value ? "1px solid rgba(76, 95, 215, 0.6)" : "1px solid rgba(76, 95, 215, 0.25)",
                    background: palmRegion === option.value ? "rgba(76, 95, 215, 0.12)" : "transparent",
                    color: "#2C3E30",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {locale === "zh" ? option.zh : option.en}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label style={{ fontWeight: 600, color: "#2C3E30" }}>
              {locale === "zh" ? "质量自评（可选）" : "Quality rating (optional)"}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={qualityRating ?? 3}
              onChange={(event) => setQualityRating(parseInt(event.target.value, 10))}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(44,62,48,0.6)" }}>
              <span>{locale === "zh" ? "1 分（待改进）" : "1 (needs work)"}</span>
              <span>{locale === "zh" ? "5 分（清晰）" : "5 (excellent)"}</span>
            </div>
          </div>
        </div>

        <label
          htmlFor={captureMode === "camera" ? cameraInputId : uploadInputId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(event) => {
            if (captureMode === "camera" && cameraSupported && !isPointerCoarse) {
              event.preventDefault();
              handleCameraRequest();
            }
          }}
          style={{
            borderRadius: "16px",
            border: dragActive ? "2px dashed rgba(76, 95, 215, 0.5)" : "2px dashed rgba(141, 174, 146, 0.4)",
            padding: "1.5rem",
            background: "rgba(255,255,255,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <span style={{ fontWeight: 600, color: "#2C3E30" }}>
            {locale === "zh" ? "点击选择或拖拽掌纹图片" : "Click to choose or drag palm image"}
          </span>
          <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.9rem" }}>
            {locale === "zh"
              ? captureMode === "camera"
                ? "移动端会直接唤起摄像头进行拍照。"
                : "支持 JPG、PNG、HEIC 格式，大小不超过 10MB。"
              : captureMode === "camera"
              ? "On mobile, the camera will open automatically."
              : "Supports JPG, PNG, HEIC up to 10MB."}
          </span>
          {captureMode === "camera" && cameraSupported && !isPointerCoarse ? (
            <span style={{ color: "rgba(44,62,48,0.68)", fontSize: "0.85rem", lineHeight: 1.5 }}>
              {cameraDesktopGuide}
            </span>
          ) : null}
          {captureMode === "camera" ? (
            <span style={{ color: "rgba(44,62,48,0.62)", fontSize: "0.82rem", lineHeight: 1.5 }}>
              {cameraFallbackText}
            </span>
          ) : null}
          {selectedFile ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                width: "100%",
                alignItems: "center",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={locale === "zh" ? "掌纹预览图" : "Palm preview"}
                  style={{
                    width: "min(320px, 100%)",
                    borderRadius: "12px",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                  }}
                />
              ) : null}
              <span style={{ color: "rgba(44,62,48,0.65)" }}>
                {locale === "zh" ? "文件：" : "File:"} {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                type="button"
                onClick={clearSelectedFile}
                style={{
                  borderRadius: "999px",
                  padding: "0.45rem 1rem",
                  border: "1px solid rgba(141, 174, 146, 0.6)",
                  background: "transparent",
                  color: "#2C3E30",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {locale === "zh" ? "重新选择" : "Choose another"}
              </button>
            </div>
          ) : null}
        </label>
        <input
          id={uploadInputId}
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleInputFileChange}
        />
        <input
          id={cameraInputId}
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleInputFileChange}
        />

        {uploadError ? (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(220, 70, 70, 0.3)",
              background: "rgba(220, 70, 70, 0.08)",
              padding: "0.9rem 1rem",
              color: "#9b2c2c",
            }}
          >
            {uploadError}
          </div>
        ) : null}

        {uploadSuccess ? (
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(125, 178, 135, 0.35)",
              background: "rgba(125, 178, 135, 0.12)",
              padding: "0.9rem 1rem",
              color: "#1f7a37",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <span>{uploadSuccess}</span>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  clearSelectedFile();
                  setUploadSuccess(null);
                }}
                style={{
                  borderRadius: "999px",
                  padding: "0.5rem 1.2rem",
                  border: "1px solid rgba(141, 174, 146, 0.6)",
                  background: "#fff",
                  color: "#2C3E30",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {locale === "zh" ? "继续上传" : "Upload another"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (records.length > 0) {
                    setAnnotatingRecord(records[0]);
                  }
                }}
                disabled={records.length === 0}
                style={{
                  borderRadius: "999px",
                  padding: "0.5rem 1.2rem",
                  border: "none",
                  background: records.length > 0 ? "linear-gradient(135deg,#4C5FD7,#6C7AE0)" : "rgba(120,130,200,0.3)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: records.length > 0 ? "pointer" : "not-allowed",
                }}
              >
                {locale === "zh" ? "为刚上传图片标注" : "Annotate latest"}
              </button>
              <Link
                href={`/${locale}/reports/palm`}
                style={{
                  borderRadius: "999px",
                  padding: "0.5rem 1.2rem",
                  border: "1px solid rgba(76,95,215,0.35)",
                  background: "rgba(76,95,215,0.1)",
                  color: "#4C5FD7",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {locale === "zh" ? "查看掌纹报告" : "View palm report"}
              </Link>
            </div>
          </div>
        ) : null}
        {offlineUploads.length > 0 || offlineMessage ? (
          <section
            style={{
              borderRadius: "20px",
              padding: "1.5rem",
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 16px 28px rgba(45,64,51,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#2C3E30" }}>
                  {locale === "zh" ? "离线上传队列" : "Offline upload queue"}
                </h3>
                <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.9rem" }}>
                  {locale === "zh"
                    ? "在无网络时提交的掌纹会暂存于此，联网后自动重试。"
                    : "Palmprints captured offline are stored here and synced once online."}
                </span>
              </div>
              <button
                type="button"
                onClick={syncOfflineUploads}
                disabled={offlineUploads.length === 0 || syncingOffline || !isOnline}
                style={{
                  borderRadius: "999px",
                  padding: "0.45rem 1.1rem",
                  border: "1px solid rgba(76,95,215,0.35)",
                  background: isOnline ? "rgba(76,95,215,0.1)" : "rgba(120,130,180,0.2)",
                  color: "#4C5FD7",
                  fontWeight: 600,
                  cursor: offlineUploads.length > 0 && isOnline && !syncingOffline ? "pointer" : "not-allowed",
                }}
              >
                {syncingOffline
                  ? locale === "zh"
                    ? "同步中..."
                    : "Syncing..."
                  : locale === "zh"
                  ? "立即同步"
                  : "Sync now"}
              </button>
            </header>
            {offlineMessage ? (
              <div
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(76,95,215,0.25)",
                  background: "rgba(76,95,215,0.08)",
                  color: "#36417c",
                  padding: "0.75rem 0.9rem",
                }}
              >
                {offlineMessage}
              </div>
            ) : null}
            {offlineUploads.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {offlineUploads.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: "14px",
                      border: "1px solid rgba(44,62,48,0.12)",
                      padding: "0.8rem 1rem",
                      background: "rgba(255,255,255,0.95)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    <strong style={{ color: "#2C3E30" }}>{item.fileName}</strong>
                    <span style={{ color: "rgba(44,62,48,0.65)", fontSize: "0.9rem" }}>
                      {locale === "zh" ? "手型" : "Hand"}：
                      {item.handType === "left"
                        ? locale === "zh"
                          ? "左手"
                          : "Left"
                        : locale === "zh"
                        ? "右手"
                        : "Right"}
                      ，{locale === "zh" ? "区域" : "Region"}：
                      {item.palmRegion === "palm"
                        ? locale === "zh"
                          ? "掌心"
                          : "Palm"
                        : item.palmRegion === "fingers"
                        ? locale === "zh"
                          ? "手指"
                          : "Fingers"
                        : locale === "zh"
                        ? "整掌"
                        : "Full"}
                    </span>
                    <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>
                      {locale === "zh" ? "加入队列" : "Queued"}：{new Date(item.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                    </span>
                    {item.error ? (
                      <span style={{ color: "#b83232", fontSize: "0.85rem" }}>
                        {locale === "zh" ? "最近错误" : "Last error"}：{item.error}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "rgba(44,62,48,0.6)" }}>
                {locale === "zh" ? "暂无离线任务。" : "No offline jobs at the moment."}
              </p>
            )}
            {!isOnline ? (
              <span style={{ color: "#b35f0b", fontSize: "0.9rem" }}>
                {locale === "zh" ? "当前处于离线状态，恢复网络后将自动同步。" : "You are offline. Pending uploads will sync once connection returns."}
              </span>
            ) : null}
          </section>
        ) : null}

        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            style={{
              borderRadius: "14px",
              padding: "0.85rem 1.4rem",
              background: uploading ? "rgba(141, 174, 146, 0.4)" : "linear-gradient(135deg, #8DAE92, #7A9D7F)",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: uploading ? "not-allowed" : "pointer",
              minWidth: "160px",
            }}
          >
            {uploading
              ? locale === "zh"
                ? "上传中..."
                : "Uploading..."
              : locale === "zh"
              ? "上传掌纹"
              : "Upload palmprint"}
          </button>
          <button
            type="button"
            onClick={refreshRecords}
            disabled={recordsLoading}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.2rem",
              border: "1px solid rgba(76, 95, 215, 0.35)",
              background: "rgba(76, 95, 215, 0.08)",
              color: "#4C5FD7",
              fontWeight: 600,
              cursor: recordsLoading ? "wait" : "pointer",
            }}
          >
            {recordsLoading
              ? locale === "zh"
                ? "刷新中..."
                : "Refreshing..."
              : locale === "zh"
              ? "刷新记录"
              : "Refresh list"}
          </button>
          <Link
            href={`/${locale}/reports/palm`}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.2rem",
              border: "1px solid rgba(44,62,48,0.2)",
              color: "#2C3E30",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {locale === "zh" ? "查看掌纹报告" : "Go to palm report"}
          </Link>
        </div>
        <PalmBatchUploader locale={locale} onBatchSubmit={handleBatchUploadComplete} />

      </section>

      <section
        style={{
          borderRadius: "24px",
          padding: "1.8rem",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 18px 32px rgba(45,64,51,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#2C3E30" }}>
            {locale === "zh" ? "已上传掌纹记录" : "Uploaded palmprints"}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.66)" }}>
            {locale === "zh"
              ? "稍后将支持特征标注与质量评分，目前可查看与删除已上传的掌纹。"
              : "Feature annotations and quality scoring coming soon. For now you can review or delete uploaded palmprints."}
          </p>
        </header>

        {recordsLoading ? (
          <p style={{ margin: 0, color: "rgba(44,62,48,0.66)" }}>
            {locale === "zh" ? "正在加载掌纹记录..." : "Loading palmprints..."}
          </p>
        ) : null}

        {recordsError ? (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(220, 70, 70, 0.3)",
              background: "rgba(220, 70, 70, 0.08)",
              padding: "1rem",
              color: "#9b2c2c",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.8rem",
              justifyContent: "space-between",
            }}
          >
            <span>{recordsError}</span>
            <button
              type="button"
              onClick={refreshRecords}
              style={{
                borderRadius: "999px",
                padding: "0.45rem 1rem",
                border: "1px solid rgba(220, 70, 70, 0.4)",
                background: "rgba(220, 70, 70, 0.12)",
                color: "#9b2c2c",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {locale === "zh" ? "重试" : "Retry"}
            </button>
          </div>
        ) : null}

        {!recordsLoading && !recordsError && records.length === 0 ? (
          <div
            style={{
              borderRadius: "16px",
              border: "1px dashed rgba(141, 174, 146, 0.4)",
              padding: "1.4rem",
              textAlign: "center",
              color: "rgba(44,62,48,0.6)",
            }}
          >
            {locale === "zh" ? "暂无掌纹记录，完成上传后将显示在此。" : "No palmprint records yet. They will appear here after upload."}
          </div>
        ) : null}

        {records.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {records.map((record, index) => (
              <article
                key={record.id}
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(141, 174, 146, 0.35)",
                  background: "#fff",
                  padding: "1rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "#2C3E30" }}>
                  {record.handType === "left"
                    ? locale === "zh"
                      ? "左手掌纹"
                      : "Left hand"
                    : locale === "zh"
                    ? "右手掌纹"
                    : "Right hand"}
                  {record.palmRegion === "palm"
                    ? locale === "zh"
                      ? " · 掌心"
                      : " · Palm"
                    : record.palmRegion === "fingers"
                    ? locale === "zh"
                      ? " · 手指"
                      : " · Fingers"
                    : ""}
                </span>
                <span style={{ color: "rgba(44,62,48,0.65)" }}>
                  {locale === "zh" ? "上传时间" : "Uploaded at"}：{new Date(record.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                </span>
                <span style={{ color: "rgba(44,62,48,0.65)", wordBreak: "break-all" }}>
                  {locale === "zh" ? "图片路径" : "Image path"}：{record.imagePath}
                </span>
                <span style={{ color: "rgba(44,62,48,0.65)" }}>
                  {locale === "zh" ? "特征数量" : "Feature count"}：{record.features?.length ?? 0}
                </span>
                {record.metadata?.captureMethod ? (
                  <span style={{ color: "rgba(44,62,48,0.6)" }}>
                    {locale === "zh" ? "采集方式" : "Capture method"}：
                    {record.metadata.captureMethod === "upload"
                      ? locale === "zh"
                        ? "上传照片"
                        : "Upload"
                      : locale === "zh"
                      ? "摄像头拍摄"
                      : "Camera"}
                  </span>
                ) : null}
                <span style={{ color: "rgba(44,62,48,0.6)" }}>
                  {locale === "zh" ? "质量评分" : "Quality"}：
                  {record.qualityRating ? `${record.qualityRating}/5` : locale === "zh" ? "未评" : "N/A"}
                </span>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(record.id)}
                    style={{
                      borderRadius: "12px",
                      padding: "0.55rem 0.9rem",
                      border: "1px solid rgba(220, 70, 70, 0.35)",
                      background: "rgba(220, 70, 70, 0.05)",
                      color: "#b83232",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {locale === "zh" ? "删除" : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnotatingRecord(record)}
                    style={{
                      borderRadius: "12px",
                      padding: "0.55rem 0.9rem",
                      border: "1px solid rgba(76, 95, 215, 0.35)",
                      background: "rgba(76,95,215,0.1)",
                      color: "#4C5FD7",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {locale === "zh" ? "标注特征" : "Annotate"}
                  </button>
                  {index === 0 ? (
                    <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.8rem" }}>
                      {locale === "zh" ? "最新上传" : "Most recent"}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {guide && (
        <section
          style={{
            borderRadius: "24px",
            padding: "1.6rem 1.8rem",
            background: "rgba(140, 122, 230, 0.08)",
            boxShadow: "0 18px 32px rgba(76, 95, 215, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#4C5FD7" }}>
            {resolveLocalizedText(guide.title, locale) ?? (locale === "zh" ? "采集提示" : "Capture tips")}
          </h2>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.72)", lineHeight: 1.65 }}>
            {resolveLocalizedText(guide.intro, locale) ?? (locale === "zh" ? "保持光线柔和，掌心正对镜头。" : "Keep soft lighting and face the camera directly.")}
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
            boxShadow: "0 18px 32px rgba(45, 64, 51, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "采集手与掌纹特征" : "Focus hand & palm traits"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <strong>{locale === "zh" ? "采集手选择" : "Select focus hand"}</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {handednessOptions.map((option) => (
                <label
                  key={option.value}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid rgba(141, 174, 146, 0.4)",
                    padding: "0.75rem 1rem",
                    background: handedness === option.value ? "rgba(141, 174, 146, 0.18)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="handedness"
                    value={option.value}
                    checked={handedness === option.value}
                    onChange={() => setHandedness(option.value)}
                    style={{ marginRight: "0.75rem" }}
                  />
                  {locale === "zh" ? option.zh : option.en}
                </label>
              ))}
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <strong>{locale === "zh" ? "手掌颜色" : "Palm color"}</strong>
            <select
              value={color}
              onChange={(event) => setColor(event.target.value as PalmRecordData["color"])}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(141, 174, 146, 0.4)",
                padding: "0.65rem 1rem",
                background: "#fff",
              }}
            >
              {palmColors.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "zh" ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <strong>{locale === "zh" ? "手掌质地" : "Palm texture"}</strong>
            <select
              value={texture}
              onChange={(event) => setTexture(event.target.value as PalmRecordData["texture"])}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(141, 174, 146, 0.4)",
                padding: "0.65rem 1rem",
                background: "#fff",
              }}
            >
              {palmTextures.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "zh" ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <strong>{locale === "zh" ? "生命线" : "Life line"}</strong>
              <select
                value={lifeLine ?? ""}
                onChange={(event) => setLifeLine(event.target.value ? (event.target.value as PalmRecordData["lifeLine"]) : undefined)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(141, 174, 146, 0.35)",
                  padding: "0.65rem 1rem",
                }}
              >
                <option value="">{locale === "zh" ? "未观察" : "Not observed"}</option>
                {lifeLineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {locale === "zh" ? option.zh : option.en}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <strong>{locale === "zh" ? "感情线" : "Heart line"}</strong>
              <select
                value={heartLine ?? ""}
                onChange={(event) => setHeartLine(event.target.value ? (event.target.value as PalmRecordData["heartLine"]) : undefined)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(141, 174, 146, 0.35)",
                  padding: "0.65rem 1rem",
                }}
              >
                <option value="">{locale === "zh" ? "未观察" : "Not observed"}</option>
                {heartLineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {locale === "zh" ? option.zh : option.en}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <strong>{locale === "zh" ? "智慧线" : "Head line"}</strong>
              <select
                value={headLine ?? ""}
                onChange={(event) => setHeadLine(event.target.value ? (event.target.value as PalmRecordData["headLine"]) : undefined)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(141, 174, 146, 0.35)",
                  padding: "0.65rem 1rem",
                }}
              >
                <option value="">{locale === "zh" ? "未观察" : "Not observed"}</option>
                {headLineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {locale === "zh" ? option.zh : option.en}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section
          style={{
            borderRadius: "24px",
            padding: "1.75rem",
            background: "rgba(141, 174, 146, 0.12)",
            boxShadow: "0 18px 36px rgba(141, 174, 146, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "采集方式" : "Capture mode"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {captureModes.map((mode) => (
              <label
                key={mode.value}
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(141, 174, 146, 0.4)",
                  padding: "0.75rem 1rem",
                  background: captureMode === mode.value ? "#fff" : "rgba(255, 255, 255, 0.65)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="captureMode"
                  value={mode.value}
                  checked={captureMode === mode.value}
                  onChange={() => setCaptureMode(mode.value)}
                  style={{ marginRight: "0.75rem" }}
                />
                {locale === "zh" ? mode.zh : mode.en}
              </label>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder={
              locale === "zh"
                ? "补充说明（例如：已准备自然光环境、需要 AI 指引等）"
                : "Add notes (e.g. natural lighting prepared, need AI guidance, etc.)"
            }
            style={{
              borderRadius: "16px",
              border: "1px solid rgba(141, 174, 146, 0.3)",
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
            boxShadow: "0 18px 32px rgba(122, 157, 127, 0.18)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#2C3E30" }}>
            {locale === "zh" ? "操作" : "Actions"}
          </h2>
          <button
            type="submit"
            style={{
              borderRadius: "14px",
              padding: "0.85rem 1.4rem",
              background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            {locale === "zh" ? "保存采集偏好" : "Save capture preferences"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              borderRadius: "14px",
              padding: "0.75rem 1.3rem",
              border: "1px dashed rgba(141, 174, 146, 0.6)",
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
              {locale === "zh" ? "已保存至本地，可随时返回继续采集。" : "Saved locally. You can return anytime."}
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

      {annotatingRecord ? (
        <PalmFeatureAnnotator
          record={annotatingRecord}
          locale={locale}
          onClose={() => setAnnotatingRecord(null)}
          onSaved={async () => {
            await refreshRecords();
            setAnnotatingRecord(null);
          }}
        />
      ) : null}
      {!isOnline ? (
        <div
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(220, 120, 60, 0.45)",
            background: "rgba(220, 120, 60, 0.12)",
            padding: "0.85rem 1rem",
            color: "#8c3f12",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span>
            {locale === "zh"
              ? "当前处于离线状态，掌纹会暂存队列，联网后将自动同步。"
              : "You are offline. Captured palmprints will queue and sync once connection returns."}
          </span>
          <button
            type="button"
            onClick={syncOfflineUploads}
            disabled={syncingOffline || offlineUploads.length === 0}
            style={{
              borderRadius: "999px",
              padding: "0.45rem 1rem",
              border: "1px solid rgba(220, 120, 60, 0.4)",
              background: "rgba(220, 120, 60, 0.15)",
              color: "#8c3f12",
              fontWeight: 600,
              cursor: offlineUploads.length > 0 && !syncingOffline ? "pointer" : "not-allowed",
            }}
          >
            {syncingOffline
              ? locale === "zh"
                ? "同步中..."
                : "Syncing..."
              : locale === "zh"
              ? "尝试同步"
              : "Sync now"}
          </button>
        </div>
      ) : null}
      {activeCameraMode ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 24, 18, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            zIndex: 1300,
          }}
          onClick={handleCameraClose}
        >
          <div
            style={{ width: "min(720px, 100%)", maxWidth: "100%", pointerEvents: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <MobileCamera mode="palm" locale={locale} onCancel={handleCameraClose} onConfirm={handleCameraConfirm} />
          </div>
        </div>
      ) : null}
    </main>
  );
}

