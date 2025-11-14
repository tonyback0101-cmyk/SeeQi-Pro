"use client";

import { useMemo, useState, useEffect, useRef, useId } from "react";
import { motion } from "framer-motion";
import zh from "../../../locales/zh/analyze.json";
import en from "../../../locales/en/analyze.json";
import { offlineService } from "@/services/offlineService";
import { saveLatestReport } from "@/services/reportCache";
import { useRouter } from "next/navigation";
import { DREAM_TYPES, DREAM_EMOTIONS, DREAM_TAGS } from "@/data/dreamOptions";
import dynamic from "next/dynamic";

const MobileCamera = dynamic(() => import("@/components/MobileCamera"), { ssr: false });

type Locale = "zh" | "en";
type PageProps = {
  params: { locale: Locale };
};

const translations: Record<Locale, typeof zh> = {
  zh,
  en,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

type FieldErrorKey = "hand" | "tongue" | "privacy" | "dream";

type CaptureCopy = typeof zh.capture;

function normalizeAnalyzeResponse(data: any, locale: Locale) {
  if (!data || typeof data !== "object") return null;
  const advice = data.advice ?? null;
  const adviceCounts = {
    diet: Array.isArray(advice?.diet) ? advice.diet.length : 0,
    lifestyle: Array.isArray(advice?.lifestyle) ? advice.lifestyle.length : 0,
    exercise: Array.isArray(advice?.exercise) ? advice.exercise.length : 0,
    acupoints: Array.isArray(advice?.acupoints) ? advice.acupoints.length : 0,
  };
  return {
    id: data.report_id,
    constitution: data.constitution ?? null,
    palm_result: data.palm ?? null,
    tongue_result: data.tongue ?? null,
    dream: data.dream ?? null,
    advice,
    advice_counts: adviceCounts,
    solar_term: data.solar?.name ?? data.solar_term ?? null,
    quote: data.quote ?? null,
    created_at: data.created_at ?? new Date().toISOString(),
    unlocked: Boolean(data.unlocked),
    locale: data.locale ?? locale,
    constitution_detail: data.constitution_detail ?? undefined,
    qi_index: data.qi_index ?? null,
    matched_rules: Array.isArray(data.matched_rules) ? data.matched_rules : [],
    access: data.unlocked ? "full" : "lite",
  };
}

export default function AnalyzePage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const router = useRouter();
  const t = useMemo(() => translations[locale], [locale]);

  const [handFile, setHandFile] = useState<File | null>(null);
  const [tongueFile, setTongueFile] = useState<File | null>(null);
  const [dreamText, setDreamText] = useState("");
  const [dreamType, setDreamType] = useState<string | null>(null);
  const [dreamEmotion, setDreamEmotion] = useState<string | null>(null);
  const [dreamTags, setDreamTags] = useState<string[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "retry">("idle");
  const [cameraSupported, setCameraSupported] = useState(false);
  const [isPointerCoarse, setIsPointerCoarse] = useState(false);
  const [activeCameraMode, setActiveCameraMode] = useState<null | "palm" | "tongue">(null);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatusMessage("");
    setCameraMessage(null);
  }, [locale]);

  useEffect(() => {
    if (typeof navigator === "undefined" || typeof window === "undefined") {
      return;
    }
    const supported = Boolean(window.isSecureContext !== false && navigator.mediaDevices?.getUserMedia);
    setCameraSupported(supported);
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

  const dreamOptions = useMemo(
    () => ({
      types: DREAM_TYPES.map((option) => ({ value: option.value, label: option.label[locale] })),
      emotions: DREAM_EMOTIONS.map((option) => ({ value: option.value, label: option.label[locale] })),
      tags: DREAM_TAGS.map((option) => ({ value: option.value, label: option.label[locale] })),
    }),
    [locale],
  );
  const dreamSectionCopy = t.form?.dreamSection;

  const maxDreamTags = 5;

  const toggleDreamTag = (value: string) => {
    setDreamTags((prev) => {
      if (prev.includes(value)) {
        return prev.filter((tag) => tag !== value);
      }
      if (prev.length >= maxDreamTags) {
        return prev;
      }
      return [...prev, value];
    });
  };

  const makeFileSelector =
    (field: FieldErrorKey, setter: (file: File | null) => void) =>
    (file: File | null): boolean => {
      if (!file) {
        setter(null);
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        return true;
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setter(null);
        setErrors((prev) => ({ ...prev, [field]: t.errors.fileType }));
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setter(null);
        setErrors((prev) => ({ ...prev, [field]: t.errors.fileTooLarge }));
        return false;
      }

      setter(file);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    };

  const selectHandFile = makeFileSelector("hand", setHandFile);
  const selectTongueFile = makeFileSelector("tongue", setTongueFile);

  const handleRequestCamera = (mode: "palm" | "tongue"): boolean => {
    if (isPointerCoarse) {
      setCameraMessage(null);
      return false;
    }
    if (!cameraSupported) {
      setCameraMessage(t.capture.cameraUnavailable);
      return false;
    }
    setCameraMessage(null);
    setActiveCameraMode(mode);
    return true;
  };

  const handleCameraClose = () => {
    setActiveCameraMode(null);
  };

  const handleCameraConfirm = (mode: "palm" | "tongue") => (file: File) => {
    const success = mode === "palm" ? selectHandFile(file) : selectTongueFile(file);
    if (!success) {
      setCameraMessage(t.errors.fileType);
      return;
    }
    setCameraMessage(null);
  };

  const validate = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (!handFile) {
      nextErrors.hand = t.errors.handRequired;
    }
    if (!tongueFile) {
      nextErrors.tongue = t.errors.tongueRequired;
    }
    if (!privacyAccepted) {
      nextErrors.privacy = t.errors.privacyRequired;
    }
    if (dreamText.length > 300) {
      nextErrors.dream = t.errors.dreamTooLong;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const isValid = validate();
    if (!isValid) {
      setButtonState("retry");
      return;
    }

    if (!handFile || !tongueFile) return;

    setSubmitting(true);
    setStatusMessage(t.progress.uploading);
    setButtonState("loading");

    try {
      const formData = new FormData();
      formData.append("palm_image", handFile);
      formData.append("tongue_image", tongueFile);
      if (dreamText.trim()) {
        formData.append("dream_text", dreamText.trim());
      }
    if (dreamType) {
      formData.append("dream_type", dreamType);
    }
    if (dreamEmotion) {
      formData.append("emotion", dreamEmotion);
    }
    if (dreamTags.length > 0) {
      formData.append("dream_tags", JSON.stringify(dreamTags.slice(0, maxDreamTags)));
    }
      formData.append("locale", locale);
      formData.append("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai");
      formData.append("privacy_accepted", privacyAccepted ? "true" : "false");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error || t.errors.server;
        setStatusMessage(message);
        setButtonState("retry");
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      const reportId = data.report_id as string | undefined;
      if (!reportId) {
        setStatusMessage(t.errors.unexpected);
        setButtonState("retry");
        setSubmitting(false);
        return;
      }

      const normalized = normalizeAnalyzeResponse(data, locale);
      if (!normalized || !normalized.id) {
        setStatusMessage(t.errors.unexpected);
        setButtonState("retry");
        setSubmitting(false);
        return;
      }

      const payload = { id: reportId, generatedAt: Date.now(), payload: normalized };
      offlineService.saveReport(payload);
      saveLatestReport({ id: reportId, locale, payload: normalized, savedAt: Date.now() });

      router.push(`/${locale}/loading?report=${reportId}`);
    } catch (error) {
      console.error("analyze-submit", error);
      setStatusMessage(t.errors.server);
      setButtonState("retry");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadComplete = Boolean(handFile && tongueFile);
  const resultReady = uploadComplete && privacyAccepted;
  const stepStatuses = [uploadComplete, privacyAccepted, resultReady && !submitting];

  return (
    <div
      style={{
        padding: "6rem 1.5rem 3rem",
        maxWidth: "1080px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h1 style={{ margin: 0, fontSize: "2.4rem" }}>{t.title}</h1>
        <p style={{ margin: 0, color: "#4a5a50", lineHeight: 1.6 }}>{t.description}</p>
      </header>

      <StepIndicator steps={t.steps} statuses={stepStatuses} />

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "2rem",
        }}
      >
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{t.steps[0]}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <UploadField
              label={t.handUpload.label}
              hint={t.handUpload.hint}
              file={handFile}
              error={errors.hand}
              locale={locale}
              mode="palm"
              capture={t.capture}
              onSelectFile={selectHandFile}
              onRequestCamera={() => handleRequestCamera("palm")}
              cameraMessage={cameraMessage}
              convertErrorMessage={t.errors.fileConvert}
              cameraGuide={!isPointerCoarse && cameraSupported ? t.capture.desktopGuide : null}
              cameraFallback={t.capture.fallbackHint}
            />
            <UploadField
              label={t.tongueUpload.label}
              hint={t.tongueUpload.hint}
              file={tongueFile}
              error={errors.tongue}
              locale={locale}
              mode="tongue"
              capture={t.capture}
              onSelectFile={selectTongueFile}
              onRequestCamera={() => handleRequestCamera("tongue")}
              cameraMessage={cameraMessage}
              convertErrorMessage={t.errors.fileConvert}
              cameraGuide={!isPointerCoarse && cameraSupported ? t.capture.desktopGuide : null}
              cameraFallback={t.capture.fallbackHint}
            />
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>{t.form.title}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <Field
              label={t.form.dreamLabel}
              error={errors.dream}
              input={
                <textarea
                  value={dreamText}
                  onChange={(event) => setDreamText(event.target.value)}
                  style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                  maxLength={300}
                  placeholder={t.form.dreamPlaceholder}
                />
              }
            />
          </div>

        {dreamSectionCopy && (
          <div style={dreamSectionStyle}>
            <div style={dreamOptionBlockStyle}>
              <span style={optionLabelStyle}>{dreamSectionCopy.typeLabel}</span>
              <p style={optionHintStyle}>{dreamSectionCopy.typeDescription}</p>
              <div style={optionGridStyle}>
                {dreamOptions.types.map((option) => {
                  const active = dreamType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDreamType(active ? null : option.value)}
                      aria-pressed={active}
                      style={{
                        ...optionButtonStyle,
                        ...(active ? optionButtonActiveStyle : {}),
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={dreamOptionBlockStyle}>
              <span style={optionLabelStyle}>{dreamSectionCopy.emotionLabel}</span>
              <p style={optionHintStyle}>{dreamSectionCopy.emotionDescription}</p>
              <div style={optionGridStyle}>
                {dreamOptions.emotions.map((option) => {
                  const active = dreamEmotion === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDreamEmotion(active ? null : option.value)}
                      aria-pressed={active}
                      style={{
                        ...optionButtonStyle,
                        ...(active ? optionButtonActiveStyle : {}),
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={dreamOptionBlockStyle}>
              <span style={optionLabelStyle}>{dreamSectionCopy.keywordsLabel}</span>
              <p style={optionHintStyle}>{dreamSectionCopy.keywordsDescription}</p>
              <div style={tagGridStyle}>
                {dreamOptions.tags.map((option) => {
                  const active = dreamTags.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleDreamTag(option.value)}
                      aria-pressed={active}
                      style={{
                        ...tagButtonStyle,
                        ...(active ? tagButtonActiveStyle : {}),
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p style={tagCountStyle}>
                {locale === "zh"
                  ? `已选择 ${dreamTags.length} / ${maxDreamTags}`
                  : `Selected ${dreamTags.length} / ${maxDreamTags}`}
              </p>
            </div>
          </div>
        )}

          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
            />
            <span style={{ color: "#2C3E30" }}>
              {t.form.privacyPrefix}
              <a href={`/${locale}/privacy`} style={{ color: "#4C5FD7" }} target="_blank" rel="noopener noreferrer">
                {t.form.privacyLink}
              </a>
            </span>
          </label>
          {errors.privacy && <p style={errorStyle}>{errors.privacy}</p>}
        </section>

        {statusMessage && (
          <div
            style={{
              background: "rgba(141, 174, 146, 0.15)",
              border: "1px solid rgba(141, 174, 146, 0.4)",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              color: "#2C3E30",
            }}
          >
            {statusMessage}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <motion.button
            type="submit"
            style={{
              ...submitButtonStyle,
              ...(buttonState === "retry" ? retryButtonStyle : {}),
              ...(buttonState === "loading" ? loadingButtonStyle : {}),
            }}
            disabled={buttonState === "loading"}
            whileHover={
              buttonState === "loading"
                ? undefined
                : { boxShadow: "0 16px 36px rgba(141,174,146,0.32)", y: -2 }
            }
            whileTap={buttonState === "loading" ? undefined : { scale: 0.98 }}
          >
            {buttonState === "loading" ? (
              <motion.span
                style={loadingTextStyle}
                animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse" }}
              >
                {t.form.buttonLoading}
              </motion.span>
            ) : buttonState === "retry" ? (
              t.form.buttonRetry
            ) : (
              t.form.buttonStart
            )}
          </motion.button>
        </div>
      </form>
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
            <MobileCamera
              mode={activeCameraMode}
              locale={locale}
              onCancel={handleCameraClose}
              onConfirm={(file) => handleCameraConfirm(activeCameraMode)(file)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

type StepIndicatorProps = {
  steps: string[];
  statuses: boolean[];
};

function StepIndicator({ steps, statuses }: StepIndicatorProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: "rgba(255,255,255,0.85)",
        borderRadius: "16px",
        boxShadow: "0 12px 20px rgba(0,0,0,0.08)",
      }}
    >
      {steps.map((step, index) => {
        const isCurrent = statuses[index] || (index === 0 && !statuses.some(Boolean));
        const isCompleted = statuses[index];
        return (
          <div
            key={step}
            style={{
              flex: 1,
              textAlign: "center",
              position: "relative",
              padding: "0.4rem 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                minWidth: "80px",
                padding: "0.4rem 0.8rem",
                borderRadius: "999px",
                background: isCompleted ? "#8DAE92" : isCurrent ? "#C6A969" : "#ECE9E3",
                color: isCurrent || isCompleted ? "#fff" : "#2C3E30",
                fontWeight: 600,
              }}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "-10%",
                  width: "20%",
                  height: "2px",
                  background: statuses[index] ? "#8DAE92" : "#D9D3C9",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type UploadFieldProps = {
  label: string;
  hint: string;
  file: File | null;
  error?: string;
  locale: Locale;
  mode: "palm" | "tongue";
  capture: CaptureCopy;
  onSelectFile: (file: File | null) => boolean;
  onRequestCamera?: () => boolean;
  cameraMessage?: string | null;
  convertErrorMessage: string;
  cameraGuide?: string | null;
  cameraFallback?: string | null;
};

function UploadField({
  label,
  hint,
  file,
  error,
  locale,
  mode,
  capture,
  onSelectFile,
  onRequestCamera,
  cameraMessage,
  convertErrorMessage,
  cameraGuide,
  cameraFallback,
}: UploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();
  const cameraInputId = useId();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setConvertError(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

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
          `${incoming.name.replace(/\.[^/.]+$/, "") || mode}-${Date.now()}.jpg`,
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
            `${incoming.name.replace(/\.[^/.]+$/, "") || mode}-${Date.now()}.jpg`,
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

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setConvertError(null);
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      onSelectFile(null);
      return;
    }
    const processed = await normalizeToJpeg(nextFile);
    if (!processed) {
      setConvertError(convertErrorMessage);
      onSelectFile(null);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }
    const success = onSelectFile(processed);
    if (!success && event.target) {
      event.target.value = "";
    }
  };

  const handleRemove = () => {
    setConvertError(null);
    onSelectFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleOpenCamera = () => {
    setConvertError(null);
    const handled = onRequestCamera?.();
    if (handled) {
      return;
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const displayMessage = convertError ?? error ?? cameraMessage ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", position: "relative" }}>
      <label style={{ fontWeight: 600, color: "#2C3E30" }}>{label}</label>
      <div style={dropZoneStyle}>
        {previewUrl ? (
          <div style={previewContainerStyle}>
            <img src={previewUrl} alt={label} style={previewImageStyle} />
            <p style={previewInfoStyle}>
              {capture.preview}
              {file ? ` · ${(file.size / 1024 / 1024).toFixed(2)}MB` : ""}
            </p>
          </div>
        ) : (
          <p style={emptyHintStyle}>{hint}</p>
        )}

        <div style={buttonRowStyle}>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          <input
            id={cameraInputId}
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          <label htmlFor={fileInputId} style={primaryActionButtonStyle as React.CSSProperties}>
            {capture.upload}
          </label>
          <button type="button" onClick={handleOpenCamera} style={secondaryActionButtonStyle as React.CSSProperties}>
            {capture.open}
          </button>
          {file ? (
            <button type="button" style={dangerButtonStyle} onClick={handleRemove}>
              {capture.remove}
            </button>
          ) : null}
        </div>
        {cameraGuide ? <p style={cameraGuideStyle}>{cameraGuide}</p> : null}
        {cameraFallback ? <p style={cameraFallbackStyle}>{cameraFallback}</p> : null}
      </div>
      {displayMessage && <p style={errorStyle}>{displayMessage}</p>}
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  input: React.ReactNode;
};

function Field({ label, error, input }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontWeight: 600, color: "#2C3E30" }}>{label}</label>
      {input}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  borderRadius: "20px",
  padding: "2rem",
  boxShadow: "0 14px 28px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.6rem",
  color: "#2C3E30",
};

const inputStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid #D9D3C9",
  padding: "0.65rem 0.9rem",
  fontSize: "1rem",
  color: "#2C3E30",
};

const errorStyle: React.CSSProperties = {
  color: "#F44336",
  margin: 0,
  fontSize: "0.9rem",
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: "#8DAE92",
  color: "#fff",
  fontWeight: 700,
  border: "none",
  borderRadius: "999px",
  padding: "0.85rem 2.5rem",
  fontSize: "1rem",
  cursor: "pointer",
  boxShadow: "0 12px 22px rgba(141, 174, 146, 0.25)",
};

const retryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.32))",
  color: "#C62828",
};

const loadingButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(141, 174, 146, 0.95), rgba(198, 169, 105, 0.85))",
  boxShadow: "0 16px 36px rgba(141, 174, 146, 0.35)",
  position: "relative",
  overflow: "hidden",
};

const loadingTextStyle: React.CSSProperties = {
  backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4), rgba(255,255,255,0.95))",
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  color: "transparent",
  display: "inline-block",
};

const dreamSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.4rem",
};

const dreamOptionBlockStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const optionLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#2C3E30",
};

const optionHintStyle: React.CSSProperties = {
  margin: 0,
  color: "#4E5A4C",
  fontSize: "0.9rem",
};

const optionGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
};

const optionButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "0.55rem 1.4rem",
  border: "1px solid rgba(44, 62, 48, 0.25)",
  background: "rgba(255, 255, 255, 0.9)",
  color: "#2C3E30",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const optionButtonActiveStyle: React.CSSProperties = {
  borderColor: "rgba(141, 174, 146, 0.85)",
  background: "linear-gradient(135deg, #8DAE92, #C6A969)",
  color: "#fff",
  boxShadow: "0 10px 20px rgba(141, 174, 146, 0.25)",
};

const tagGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const tagButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "0.45rem 1.2rem",
  border: "1px solid rgba(70, 86, 74, 0.25)",
  background: "rgba(255, 255, 255, 0.85)",
  color: "#2C3E30",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const tagButtonActiveStyle: React.CSSProperties = {
  borderColor: "rgba(76, 95, 215, 0.6)",
  background: "rgba(76, 95, 215, 0.15)",
  color: "#36417C",
  boxShadow: "0 8px 16px rgba(76, 95, 215, 0.18)",
};

const tagCountStyle: React.CSSProperties = {
  margin: "0.35rem 0 0",
  color: "rgba(44, 62, 48, 0.65)",
  fontSize: "0.85rem",
};

const dropZoneStyle: React.CSSProperties = {
  border: "2px dashed rgba(198, 169, 105, 0.6)",
  borderRadius: "16px",
  padding: "1.5rem",
  background: "rgba(249, 247, 243, 0.65)",
  textAlign: "center",
  minHeight: "220px",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
  justifyContent: "center",
};

const previewContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  alignItems: "center",
};

const previewImageStyle: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "240px",
  borderRadius: "14px",
  objectFit: "cover",
  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.16)",
};

const previewInfoStyle: React.CSSProperties = {
  margin: 0,
  color: "#2C3E30",
  fontWeight: 500,
};

const emptyHintStyle: React.CSSProperties = {
  margin: 0,
  color: "#4E5A4C",
  lineHeight: 1.6,
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const buttonBaseStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "0.6rem 1.6rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
};

const primaryActionButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "linear-gradient(135deg, #8DAE92, #C6A969)",
  color: "#fff",
  border: "none",
  boxShadow: "0 12px 22px rgba(141, 174, 146, 0.25)",
};

const secondaryActionButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "rgba(141, 174, 146, 0.18)",
  color: "#2C3E30",
  border: "1px solid rgba(141, 174, 146, 0.4)",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: "rgba(244, 67, 54, 0.08)",
  color: "#C62828",
  border: "1px solid rgba(244, 67, 54, 0.35)",
};

const cameraGuideStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(44,62,48,0.68)",
  fontSize: "0.85rem",
  lineHeight: 1.5,
  textAlign: "center",
};

const cameraFallbackStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(44,62,48,0.6)",
  fontSize: "0.82rem",
  lineHeight: 1.5,
  textAlign: "center",
};








