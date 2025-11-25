"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useIsSmallScreen from "@/hooks/useIsSmallScreen";
import styles from "./MobileCamera.module.css";

type CameraMode = "palm" | "tongue";

type MobileCameraProps = {
  mode: CameraMode;
  onConfirm: (file: File) => void;
  onCancel?: () => void;
  locale?: "zh" | "en";
};

const copy = {
  zh: {
    palm: {
      title: "手相拍摄",
      info: "请摊开手掌，保持在取景框内并光线均匀。",
    },
    tongue: {
      title: "舌相拍摄",
      info: "自然伸出舌头，使用自然光拍摄，避免遮挡。",
    },
    switchCamera: "切换前后摄像头",
    takePhoto: "拍照",
    retry: "重拍",
    confirm: "确定使用",
    close: "返回",
    filter: "画面增强",
    permissionDenied: "无法访问摄像头，请在浏览器或系统设置中启用权限。",
    rotateHint: "横屏拍摄可获得更宽视角，建议旋转设备。",
    quality: {
      lowLight: "光线偏暗，请调整光源。",
      tooBright: "光线过强，请避开直射光。",
      notSharp: "画面模糊，请保持稳定并靠近取景框。",
    },
  },
  en: {
    palm: {
      title: "Palm Capture",
      info: "Open your palm fully, keep it inside the frame with even lighting.",
    },
    tongue: {
      title: "Tongue Capture",
      info: "Extend your tongue naturally under good lighting, avoid obstructions.",
    },
    switchCamera: "Switch Camera",
    takePhoto: "Capture",
    retry: "Retake",
    confirm: "Use Photo",
    close: "Close",
    filter: "Enhance",
    permissionDenied: "Camera access denied. Please enable permissions in your browser or device settings.",
    rotateHint: "Rotate your device to landscape for a wider capture.",
    quality: {
      lowLight: "Lighting is low, please move to a brighter area.",
      tooBright: "Lighting is too strong, avoid direct light.",
      notSharp: "Image looks blurry, hold steady and move closer.",
    },
  },
};

export default function MobileCamera({ mode, onConfirm, onCancel, locale = "zh" }: MobileCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isSmallScreen = useIsSmallScreen(720);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const t = copy[locale];
  const labels = t[mode];
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);
  const [filterStrength, setFilterStrength] = useState(0.2);
  const animationFrameRef = useRef<number>();
  const [isLandscape, setIsLandscape] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const initCamera = useCallback(async () => {
    try {
      stopStream();
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setError(t.permissionDenied);
    }
  }, [facingMode, stopStream, t.permissionDenied]);

  useEffect(() => {
    initCamera();
    return () => {
      stopStream();
    };
  }, [initCamera, stopStream]);

  // Basic AI-assisted quality hints (lightweight heuristic)
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    let totalLuminance = 0;
    let focusScore = 0;
    for (let i = 0; i < data.length; i += 4 * 20) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      totalLuminance += luminance;

      const contrast = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      focusScore += contrast;
    }

    const avgLuminance = totalLuminance / (data.length / (4 * 20));
    const avgFocus = focusScore / (data.length / (4 * 20));

    if (avgLuminance < 60) {
      setQualityMessage(t.quality.lowLight);
    } else if (avgLuminance > 200) {
      setQualityMessage(t.quality.tooBright);
    } else if (avgFocus < 60) {
      setQualityMessage(t.quality.notSharp);
    } else {
      setQualityMessage(null);
    }

    animationFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [t.quality.lowLight, t.quality.notSharp, t.quality.tooBright]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [analyzeFrame]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const media = window.matchMedia("(orientation: landscape)");
    const update = () => setIsLandscape(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const handleSwitchCamera = async () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };


  const filterStyles = useMemo(() => {
    if (mode === "palm") {
      return {
        WebkitFilter: `contrast(${1.2 + filterStrength}) saturate(${1 + filterStrength})`,
        filter: `contrast(${1.2 + filterStrength}) saturate(${1 + filterStrength})`,
      };
    }
    return {
      WebkitFilter: `contrast(${1.1 + filterStrength}) saturate(${1.3 + filterStrength})`,
      filter: `contrast(${1.1 + filterStrength}) saturate(${1.3 + filterStrength})`,
    };
  }, [filterStrength, mode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileType = blob.type && blob.type.length > 0 ? blob.type : "image/png";
      const extension = fileType === "image/jpeg" ? "jpg" : "png";
      const file = new File([blob], `${mode}-${Date.now()}.${extension}`, { type: fileType });
      setCapturedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
    }, "image/png");
  };

  const handleRetake = () => {
    setCapturedFile(null);
    setPreviewUrl(null);
  };

  const handleConfirm = () => {
    if (!capturedFile) return;
    onConfirm(capturedFile);
    stopStream();
    onCancel?.();
  };

  const handleClose = () => {
    stopStream();
    onCancel?.();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>{labels.title}</h2>
        <div className={styles.topActions}>
          <div className={styles.controls}>
            <button type="button" onClick={handleSwitchCamera} className={styles.switchButton}>
              {t.switchCamera}
            </button>
            <label className={styles.sliderLabel}>
              {t.filter}
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.05}
                value={filterStrength}
                onChange={(event) => setFilterStrength(parseFloat(event.target.value))}
              />
            </label>
          </div>
          <button type="button" onClick={handleClose} className={styles.closeButton}>
            {t.close}
          </button>
        </div>
      </div>

      <p className={styles.hint}>{labels.info}</p>
      {isSmallScreen && !isLandscape ? <div className={styles.orientationHint}>{t.rotateHint}</div> : null}

      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      <div className={styles.viewport}>
        {!previewUrl ? (
          <video
            ref={videoRef}
            playsInline
            muted
            style={filterStyles}
            className={styles.preview}
          />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className={styles.preview}
          />
        )}
        {!previewUrl && (
          <div className={`${styles.overlay} ${styles[mode]}`}>
            <div className={styles.guide} />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />

      {qualityMessage && <p className={styles.quality}>{qualityMessage}</p>}

      <div className={styles.actionBar}>
        {!previewUrl ? (
          <button type="button" onClick={handleCapture} className={styles.captureButton}>
            {t.takePhoto}
          </button>
        ) : (
          <>
            <button type="button" onClick={handleRetake} className={styles.retryButton}>
              {t.retry}
            </button>
            <button type="button" onClick={handleConfirm} className={styles.confirmButton}>
              {t.confirm}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

