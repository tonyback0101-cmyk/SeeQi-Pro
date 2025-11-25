"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

export interface SharePosterHandle {
  generate: () => Promise<void>;
}

interface SharePosterProps {
  report: {
    id: string;
    qi_index?: number | null;
    qi_phrase?: string | null;
    solar_term?: string | null;
    advice?: { food?: string[] | null } | null;
  };
}

function dataURLtoFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

const SharePoster = forwardRef<SharePosterHandle, SharePosterProps>(({ report }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const posterData = useMemo(() => ({
    score: typeof report.qi_index === "number" ? Math.round(report.qi_index) : "--",
    phrase: report.qi_phrase ?? "保持平和，顺势而为",
    solar: report.solar_term ?? "今日气运",
    food: (report.advice?.food ?? []).filter(Boolean).slice(0, 2),
  }), [report]);

  const drawQr = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = typeof window !== "undefined" ? window.location.href : "https://www.seeqicloud.com";
    await QRCode.toCanvas(canvas, url, { margin: 0, width: 124 });
  }, []);

  const capture = useCallback(async () => {
    if (!containerRef.current) return;
    await drawQr();
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const dataUrl = canvas.toDataURL("image/png");

    if (typeof navigator !== "undefined" && navigator.share && (navigator as any).canShare?.({ files: [] })) {
      try {
        const file = dataURLtoFile(dataUrl, `seeqicloud-${report.id}.png`);
        await navigator.share({
          title: "SeeQi 报告",
          files: [file],
          text: "来自 SeeQi 的今日气运签",
        });
        return;
      } catch (error) {
        console.warn("share poster", error);
      }
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `seeqicloud-${report.id}.png`;
    link.click();
  }, [drawQr, report.id]);

  useImperativeHandle(ref, () => ({
    generate: capture,
  }));

  return (
    <div className="pointer-events-none fixed left-[-9999px] top-0 z-[-1] w-[620px]" ref={containerRef}>
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-emerald-900">SeeQi 今日签 · {posterData.solar}</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{posterData.score}/100</p>
          </div>
          <canvas ref={canvasRef} width={124} height={124} className="rounded-xl border border-emerald-100 bg-white" />
        </div>
        <p className="mt-4 text-base text-gray-700 leading-relaxed">{posterData.phrase}</p>
        {posterData.food.length ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-gray-400">建议食材</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
              {posterData.food.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-6 text-xs text-gray-400">SeeQi · 东方智慧与健康能量 · www.seeqicloud.com</p>
      </div>
    </div>
  );
});

SharePoster.displayName = "SharePoster";

export default SharePoster;

