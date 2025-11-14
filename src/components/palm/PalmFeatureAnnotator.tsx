import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useIsSmallScreen from "@/hooks/useIsSmallScreen";
import type { PalmFeature, PalmFeatureType, PalmPrintData } from "@/types/palmprint";

type PalmFeatureAnnotatorProps = {
  record: PalmPrintData;
  locale: "zh" | "en";
  onClose: () => void;
  onSaved: () => void;
};

const featureLabels: Record<PalmFeatureType, { zh: string; en: string }> = {
  mainLine: { zh: "主线", en: "Main line" },
  wrinkle: { zh: "皱褶", en: "Wrinkle" },
  minutiae: { zh: "细节特征", en: "Minutiae" },
};

const typeOptions: PalmFeatureType[] = ["mainLine", "wrinkle", "minutiae"];

export default function PalmFeatureAnnotator({ record, locale, onClose, onSaved }: PalmFeatureAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [workingFeatures, setWorkingFeatures] = useState<PalmFeature[]>(
    (record.features ?? []).map((feature) => ({
      id: feature.id,
      type: feature.type,
      position: feature.position,
      description: feature.description,
      metadata: feature.metadata,
    }))
  );
  const [qualityRating, setQualityRating] = useState<number | null>(record.qualityRating ?? null);
  const [activeType, setActiveType] = useState<PalmFeatureType>("mainLine");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [dragging, setDragging] = useState<{ index: number; pointerId: number }>({ index: -1, pointerId: -1 });
  const isSmallScreen = useIsSmallScreen(640);
  const [zoom, setZoom] = useState(() => (isSmallScreen ? 1.35 : 1.2));
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const instructions = useMemo(
    () =>
      locale === "zh"
        ? {
            heading: "特征标注",
            clickHint: "在掌纹图上点击即可添加标注点，标注点支持拖动调整位置，可在列表中编辑描述。",
            mobileHint: "移动端可双指缩放并拖动图像预览，点击标注点可拖动位置。",
            typeLabel: "标注类型",
            notesLabel: "备注",
            deleteLabel: "删除",
            none: "尚未添加标注，可点击图片开始。",
            qualityLabel: "质量评分（1-5，可选）",
            cancel: "取消",
            save: "保存标注",
            saving: "保存中...",
            errorPrefix: "保存失败：",
            successMessage: "标注已更新。",
          }
        : {
            heading: "Feature Annotation",
            clickHint: "Click the image to add markers. Drag markers to reposition and edit details in the list.",
            mobileHint: "On mobile, pinch to zoom and drag markers to adjust positions.",
            typeLabel: "Feature type",
            notesLabel: "Notes",
            deleteLabel: "Remove",
            none: "No annotations yet. Click on the image to begin.",
            qualityLabel: "Quality rating (1-5, optional)",
            cancel: "Cancel",
            save: "Save annotations",
            saving: "Saving...",
            errorPrefix: "Failed to save: ",
            successMessage: "Annotation saved.",
          },
    [locale]
  );

  useEffect(() => {
    setZoom(isSmallScreen ? 1.35 : 1.2);
  }, [isSmallScreen]);

  useEffect(() => {
    let aborted = false;
    async function fetchImageUrl() {
      if (record.imagePath.startsWith("http")) {
        setImageUrl(record.imagePath);
        return;
      }
      setLoadingImage(true);
      try {
        const response = await fetch(`/api/palmprints/${record.id}/image-url`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = await response.json();
        if (!aborted) {
          setImageUrl(typeof data?.url === "string" ? data.url : null);
        }
      } catch (err) {
        if (!aborted) {
          setError(
            instructions.errorPrefix +
              (err instanceof Error ? err.message : locale === "zh" ? "无法获取图片地址。" : "Cannot load image URL.")
          );
        }
      } finally {
        if (!aborted) {
          setLoadingImage(false);
        }
      }
    }

    fetchImageUrl();
    return () => {
      aborted = true;
    };
  }, [instructions.errorPrefix, locale, record.id, record.imagePath]);

  const addFeature = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !imageUrl || dragging.index !== -1) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (Number.isNaN(x) || Number.isNaN(y)) return;

      setWorkingFeatures((prev) => [
        ...prev,
        {
          type: activeType,
          position: { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) },
          description: "",
        },
      ]);
    },
    [activeType, dragging.index, imageUrl]
  );

  const updateFeature = useCallback((index: number, updates: Partial<PalmFeature>) => {
    setWorkingFeatures((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const removeFeature = useCallback(
    (index: number) => {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(locale === "zh" ? "确定删除该标注点？" : "Remove this annotation?")
          : true;
      if (!confirmed) return;
      setWorkingFeatures((prev) => prev.filter((_, i) => i !== index));
    },
    [locale]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!containerRef.current || !imageUrl) return;
      event.stopPropagation();
      const rect = containerRef.current.getBoundingClientRect();
      const feature = workingFeatures[index];
      dragOffset.current = {
        x: event.clientX - (rect.left + feature.position.x * rect.width),
        y: event.clientY - (rect.top + feature.position.y * rect.height),
      };
      setDragging({ index, pointerId: event.pointerId });
      containerRef.current.setPointerCapture(event.pointerId);
    },
    [imageUrl, workingFeatures]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragging.index === -1 || dragging.pointerId !== event.pointerId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - dragOffset.current.x) / rect.width;
      const y = (event.clientY - rect.top - dragOffset.current.y) / rect.height;
      updateFeature(dragging.index, {
        position: {
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
        },
      });
    },
    [dragging, updateFeature]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragging.index === -1 || dragging.pointerId !== event.pointerId || !containerRef.current) return;
      try {
        containerRef.current.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      setDragging({ index: -1, pointerId: -1 });
    },
    [dragging]
  );

  const handleZoomChange = useCallback((value: number) => {
    setZoom(Math.max(1, Math.min(3, value)));
  }, []);

  const handleViewportPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || zoom <= 1.01) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (Number.isNaN(x) || Number.isNaN(y)) return;
      setZoomPosition({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
    },
    [zoom]
  );

  const saveFeatures = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/palmprints/${record.id}/features`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: workingFeatures.map((feature) => ({
            type: feature.type,
            position: feature.position,
            description: feature.description,
          })),
          qualityRating,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Request failed");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        instructions.errorPrefix +
          (err instanceof Error ? err.message : locale === "zh" ? "请稍后重试。" : "Please try again later.")
      );
    } finally {
      setIsSaving(false);
    }
  }, [instructions.errorPrefix, locale, onClose, onSaved, qualityRating, record.id, workingFeatures]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 20, 15, 0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={instructions.heading}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "95vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 60%) minmax(260px, 1fr)",
          gap: "1.5rem",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#2C3E30" }}>{instructions.heading}</h2>
              <p style={{ margin: 0, color: "rgba(44,62,48,0.7)", lineHeight: 1.6 }}>{instructions.clickHint}</p>
              {isSmallScreen ? (
                <p style={{ margin: 0, color: "rgba(44,62,48,0.6)", fontSize: "0.85rem" }}>{instructions.mobileHint}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                border: "1px solid rgba(44,62,48,0.15)",
                background: "#fff",
                color: "#2C3E30",
                cursor: "pointer",
                fontSize: "1rem",
                flexShrink: 0,
              }}
              aria-label={instructions.cancel}
            >
              ×
            </button>
          </header>

          <div
            ref={containerRef}
            style={{
              position: "relative",
              width: "100%",
              paddingTop: "75%",
              background: "rgba(245,245,245,0.8)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(44,62,48,0.08)",
              cursor: imageUrl ? "crosshair" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
            onClick={addFeature}
            onPointerMove={(event) => {
              handlePointerMove(event);
              handleViewportPointerMove(event);
            }}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={locale === "zh" ? "掌纹图片" : "Palm image"}
              style={{
                position: "absolute",
                inset: 0,
                width: `${zoom * 100}%`,
                height: `${zoom * 100}%`,
                objectFit: "contain",
                transform: `translate(${(0.5 - zoomPosition.x) * (zoom - 1) * 100}%, ${(0.5 - zoomPosition.y) * (zoom - 1) * 100}%)`,
                transition: "transform 0.08s ease-out",
              }}
            />
            {zoom > 1.01 ? (
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  width: "120px",
                  height: "120px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(44,62,48,0.2)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                  background: "rgba(255,255,255,0.85)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: "cover",
                    transform: `scale(${zoom}) translate(${(0.5 - zoomPosition.x) * 100}%, ${(0.5 - zoomPosition.y) * 100}%)`,
                    transformOrigin: "center",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${zoomPosition.x * 100}%`,
                    top: `${zoomPosition.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 0 0 2px rgba(76,95,215,0.5)",
                  }}
                />
              </div>
            ) : null}
          </>
        ) : (
          <span style={{ color: "rgba(44,62,48,0.6)", fontSize: "0.9rem", padding: "0 1rem", textAlign: "center" }}>
            {loadingImage
              ? locale === "zh"
                ? "正在加载图片..."
                : "Loading image..."
              : locale === "zh"
              ? "无法加载图片，请稍后重试。"
              : "Unable to load image. Please try again later."}
          </span>
        )}
            {workingFeatures.map((feature, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${feature.position.x * 100}%`,
                  top: `${feature.position.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${isSmallScreen ? 20 : 16}px`,
                  height: `${isSmallScreen ? 20 : 16}px`,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  background:
                    feature.type === "mainLine" ? "#4C5FD7" : feature.type === "wrinkle" ? "#8DAE92" : "#E6A23C",
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.2)",
                  pointerEvents: "auto",
                  cursor: "grab",
                }}
                onPointerDown={(event) => handlePointerDown(event, index)}
              />
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600, color: "#2C3E30" }}>{instructions.typeLabel}</span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {typeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  style={{
                    borderRadius: "999px",
                    padding: "0.45rem 1rem",
                    border:
                      activeType === type ? "1px solid rgba(76, 95, 215, 0.6)" : "1px solid rgba(76, 95, 215, 0.2)",
                    background: activeType === type ? "rgba(76,95,215,0.12)" : "transparent",
                    color: "#2C3E30",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {featureLabels[type][locale]}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600, color: "#2C3E30" }}>{instructions.qualityLabel}</span>
            <input
              type="number"
              min={1}
              max={5}
              value={qualityRating ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setQualityRating(value ? Math.max(1, Math.min(5, Number(value))) : null);
              }}
              placeholder={locale === "zh" ? "如无评估可留空" : "Leave empty if not assessed"}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(44,62,48,0.2)",
                padding: "0.65rem 0.9rem",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              borderRadius: "16px",
              border: "1px solid rgba(44,62,48,0.1)",
              padding: "1rem",
              maxHeight: "40vh",
              overflowY: "auto",
            }}
          >
            {workingFeatures.length === 0 ? (
              <p style={{ margin: 0, color: "rgba(44,62,48,0.6)", lineHeight: 1.6 }}>{instructions.none}</p>
            ) : (
              workingFeatures.map((feature, index) => (
                <div
                  key={`feature-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    borderBottom: index === workingFeatures.length - 1 ? "none" : "1px solid rgba(44,62,48,0.08)",
                    paddingBottom: index === workingFeatures.length - 1 ? 0 : "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#2C3E30" }}>
                      {featureLabels[feature.type][locale]} ·{" "}
                      {`${Math.round(feature.position.x * 100)}%, ${Math.round(feature.position.y * 100)}%`}
                    </strong>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#c0392b",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {instructions.deleteLabel}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label>
                      <span style={{ display: "block", color: "rgba(44,62,48,0.6)", fontSize: "0.8rem" }}>
                        {instructions.typeLabel}
                      </span>
                      <select
                        value={feature.type}
                        onChange={(event) => updateFeature(index, { type: event.target.value as PalmFeatureType })}
                        style={{
                          borderRadius: "10px",
                          border: "1px solid rgba(44,62,48,0.18)",
                          padding: "0.5rem 0.8rem",
                        }}
                      >
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {featureLabels[type][locale]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span style={{ display: "block", color: "rgba(44,62,48,0.6)", fontSize: "0.8rem" }}>
                        {instructions.notesLabel}
                      </span>
                      <textarea
                        rows={2}
                        value={feature.description ?? ""}
                        placeholder={locale === "zh" ? "描述该特征..." : "Describe this feature..."}
                        onChange={(event) => updateFeature(index, { description: event.target.value })}
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          border: "1px solid rgba(44,62,48,0.18)",
                          padding: "0.5rem 0.8rem",
                          resize: "vertical",
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          {error ? (
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(220,70,70,0.3)",
                background: "rgba(220,70,70,0.08)",
                color: "#8c2f39",
                padding: "0.8rem 0.9rem",
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                borderRadius: "12px",
                padding: "0.75rem 1.2rem",
                border: "1px solid rgba(44,62,48,0.2)",
                background: "#fff",
                color: "#2C3E30",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {instructions.cancel}
            </button>
            <button
              type="button"
              onClick={saveFeatures}
              disabled={isSaving}
              style={{
                borderRadius: "12px",
                padding: "0.75rem 1.4rem",
                border: "none",
                background: isSaving ? "rgba(76,95,215,0.4)" : "linear-gradient(135deg,#4C5FD7,#6C7AE0)",
                color: "#fff",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? instructions.saving : instructions.save}
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: "0 0 140px" }}>
              <span style={{ fontWeight: 600, color: "#2C3E30" }}>Zoom ×{zoom.toFixed(2)}</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => handleZoomChange(1)}
              style={{
                borderRadius: "999px",
                padding: "0.45rem 1rem",
                border: "1px solid rgba(44,62,48,0.2)",
                background: "transparent",
                color: "#2C3E30",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {locale === "zh" ? "重置缩放" : "Reset zoom"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}


