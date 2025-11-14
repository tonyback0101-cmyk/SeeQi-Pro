import { useState } from "react";
import type { PalmHandType, PalmRegion } from "@/types/palmprint";

interface PalmBatchUploaderProps {
  locale: "zh" | "en";
  onBatchSubmit: (
    items: Array<{
      file: File;
      handType: PalmHandType;
      palmRegion: PalmRegion;
      captureMethod: "camera" | "upload";
      qualityRating: number | null;
    }>
  ) => void;
}

interface PendingItem {
  id: string;
  file: File;
  handType: PalmHandType;
  palmRegion: PalmRegion;
  captureMethod: "camera" | "upload";
  qualityRating: number | null;
}

function defaultHandOptions(locale: "zh" | "en") {
  return [
    { value: "left", label: locale === "zh" ? "左手" : "Left" },
    { value: "right", label: locale === "zh" ? "右手" : "Right" },
  ];
}

function defaultRegionOptions(locale: "zh" | "en") {
  return [
    { value: "full", label: locale === "zh" ? "整掌" : "Full" },
    { value: "palm", label: locale === "zh" ? "掌心" : "Palm" },
    { value: "fingers", label: locale === "zh" ? "手指" : "Fingers" },
  ];
}

export default function PalmBatchUploader({ locale, onBatchSubmit }: PalmBatchUploaderProps) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [defaultHand, setDefaultHand] = useState<PalmHandType>("left");
  const [defaultRegion, setDefaultRegion] = useState<PalmRegion>("full");
  const [defaultCapture, setDefaultCapture] = useState<"camera" | "upload">("upload");
  const [defaultQuality, setDefaultQuality] = useState<number | null>(null);

  const createId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const items: PendingItem[] = Array.from(files).map((file) => ({
      id: createId(),
      file,
      handType: defaultHand,
      palmRegion: defaultRegion,
      captureMethod: defaultCapture,
      qualityRating: defaultQuality,
    }));
    setPending((prev) => [...prev, ...items]);
  };

  const updateItem = (id: string, updates: Partial<PendingItem>) => {
    setPending((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setPending((prev) => prev.filter((item) => item.id !== id));
  };

  const submitBatch = () => {
    if (pending.length === 0) return;
    onBatchSubmit(pending);
    setPending([]);
  };

  const handOptions = defaultHandOptions(locale);
  const regionOptions = defaultRegionOptions(locale);

  return (
    <section
      style={{
        borderRadius: "20px",
        padding: "1.75rem",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 18px 36px rgba(45,64,51,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#2C3E30" }}>
            {locale === "zh" ? "批量上传" : "Batch upload"}
          </h3>
          <p style={{ margin: 0, color: "rgba(44,62,48,0.65)", fontSize: "0.9rem" }}>
            {locale === "zh"
              ? "一次选择多张掌纹照片，逐张核对左右手、区域与质量评级后统一上传。"
              : "Select multiple palm images and adjust metadata before uploading them as a batch."}
          </p>
        </div>
        <label
          style={{
            borderRadius: "999px",
            padding: "0.55rem 1.2rem",
            border: "1px solid rgba(76,95,215,0.35)",
            background: "rgba(76,95,215,0.08)",
            color: "#4C5FD7",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {locale === "zh" ? "选择文件" : "Select files"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleFilesSelected(event.target.files)}
            style={{ display: "none" }}
          />
        </label>
      </header>

      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#2C3E30" }}>{locale === "zh" ? "默认手型" : "Default hand"}</span>
          <select
            value={defaultHand}
            onChange={(event) => setDefaultHand(event.target.value as PalmHandType)}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(44,62,48,0.2)",
              padding: "0.55rem 0.8rem",
            }}
          >
            {handOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#2C3E30" }}>{locale === "zh" ? "默认区域" : "Default region"}</span>
          <select
            value={defaultRegion}
            onChange={(event) => setDefaultRegion(event.target.value as PalmRegion)}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(44,62,48,0.2)",
              padding: "0.55rem 0.8rem",
            }}
          >
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#2C3E30" }}>{locale === "zh" ? "默认方式" : "Capture method"}</span>
          <select
            value={defaultCapture}
            onChange={(event) => setDefaultCapture(event.target.value as "camera" | "upload")}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(44,62,48,0.2)",
              padding: "0.55rem 0.8rem",
            }}
          >
            <option value="camera">{locale === "zh" ? "摄像头" : "Camera"}</option>
            <option value="upload">{locale === "zh" ? "上传" : "Upload"}</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600, color: "#2C3E30" }}>{locale === "zh" ? "默认质量" : "Default quality"}</span>
          <input
            type="number"
            min={1}
            max={5}
            value={defaultQuality ?? ""}
            placeholder={locale === "zh" ? "留空表示未评分" : "Leave empty"}
            onChange={(event) => {
              const value = event.target.value;
              setDefaultQuality(value ? Math.max(1, Math.min(5, Number(value))) : null);
            }}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(44,62,48,0.2)",
              padding: "0.55rem 0.8rem",
            }}
          />
        </label>
      </div>

      {pending.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {pending.map((item, index) => (
            <div
              key={item.id}
              style={{
                borderRadius: "16px",
                border: "1px solid rgba(44,62,48,0.12)",
                padding: "0.85rem 1rem",
                background: "rgba(255,255,255,0.95)",
                display: "grid",
                gap: "0.6rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                alignItems: "center",
              }}
            >
              <strong style={{ color: "#2C3E30" }}>
                {index + 1}. {item.file.name || (locale === "zh" ? "未命名" : "Unnamed")}
              </strong>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>{locale === "zh" ? "手型" : "Hand"}</span>
                <select
                  value={item.handType}
                  onChange={(event) => updateItem(item.id, { handType: event.target.value as PalmHandType })}
                  style={{ borderRadius: "10px", border: "1px solid rgba(44,62,48,0.2)", padding: "0.45rem 0.7rem" }}
                >
                  {handOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>{locale === "zh" ? "区域" : "Region"}</span>
                <select
                  value={item.palmRegion}
                  onChange={(event) => updateItem(item.id, { palmRegion: event.target.value as PalmRegion })}
                  style={{ borderRadius: "10px", border: "1px solid rgba(44,62,48,0.2)", padding: "0.45rem 0.7rem" }}
                >
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>{locale === "zh" ? "方式" : "Method"}</span>
                <select
                  value={item.captureMethod}
                  onChange={(event) => updateItem(item.id, { captureMethod: event.target.value as "camera" | "upload" })}
                  style={{ borderRadius: "10px", border: "1px solid rgba(44,62,48,0.2)", padding: "0.45rem 0.7rem" }}
                >
                  <option value="camera">{locale === "zh" ? "摄像头" : "Camera"}</option>
                  <option value="upload">{locale === "zh" ? "上传" : "Upload"}</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>{locale === "zh" ? "质量" : "Quality"}</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={item.qualityRating ?? ""}
                  placeholder={locale === "zh" ? "留空" : "Optional"}
                  onChange={(event) =>
                    updateItem(item.id, {
                      qualityRating: event.target.value ? Math.max(1, Math.min(5, Number(event.target.value))) : null,
                    })
                  }
                  style={{ borderRadius: "10px", border: "1px solid rgba(44,62,48,0.2)", padding: "0.45rem 0.7rem" }}
                />
              </label>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  borderRadius: "10px",
                  padding: "0.45rem 0.8rem",
                  border: "1px solid rgba(220,70,70,0.35)",
                  background: "rgba(220,70,70,0.08)",
                  color: "#b83232",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {locale === "zh" ? "移除" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "rgba(44,62,48,0.6)" }}>
          {locale === "zh" ? "尚未添加批量上传文件。" : "No batch files selected yet."}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setPending([])}
          disabled={pending.length === 0}
          style={{
            borderRadius: "999px",
            padding: "0.55rem 1.2rem",
            border: "1px solid rgba(44,62,48,0.2)",
            background: "transparent",
            color: "#2C3E30",
            fontWeight: 600,
            cursor: pending.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          {locale === "zh" ? "清空" : "Clear"}
        </button>
        <button
          type="button"
          onClick={submitBatch}
          disabled={pending.length === 0}
          style={{
            borderRadius: "999px",
            padding: "0.55rem 1.4rem",
            border: "none",
            background: pending.length > 0 ? "linear-gradient(135deg,#4C5FD7,#6C7AE0)" : "rgba(120,130,200,0.3)",
            color: "#fff",
            fontWeight: 600,
            cursor: pending.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          {locale === "zh" ? "批量上传" : "Upload batch"}
        </button>
      </div>
    </section>
  );
}
