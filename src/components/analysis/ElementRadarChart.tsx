'use client';

import { useEffect, useRef } from "react";

export type ElementRadarChartProps = {
  locale: "zh" | "en";
  scores: Record<"wood" | "fire" | "earth" | "metal" | "water", number>;
};

const LABELS: Record<"zh" | "en", Record<string, string>> = {
  zh: {
    wood: "木",
    fire: "火",
    earth: "土",
    metal: "金",
    water: "水",
  },
  en: {
    wood: "Wood",
    fire: "Fire",
    earth: "Earth",
    metal: "Metal",
    water: "Water",
  },
};

export default function ElementRadarChart({ locale, scores }: ElementRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size / 2 - 20;
    const elements = ["wood", "fire", "earth", "metal", "water"] as const;
    const angleStep = (Math.PI * 2) / elements.length;

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(35, 64, 53, 0.18)";
    ctx.lineWidth = 1;
    for (let level = 1; level <= 3; level += 1) {
      ctx.beginPath();
      elements.forEach((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const r = (radius * level) / 3;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    elements.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(35, 64, 53, 0.75)";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[locale][key], x, y - 10);
    });

    ctx.beginPath();
    elements.forEach((key, index) => {
      const value = Math.max(0, Math.min(100, scores[key] ?? 0));
      const ratio = value / 100;
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * ratio * Math.cos(angle);
      const y = center + radius * ratio * Math.sin(angle);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(76, 95, 215, 0.2)";
    ctx.strokeStyle = "rgba(76, 95, 215, 0.8)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }, [locale, scores]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
      <canvas ref={canvasRef} />
      <span style={{ fontSize: "0.85rem", color: "rgba(44,62,48,0.7)" }}>
        {locale === "zh" ? "百分比越高说明该元素能量越旺" : "Higher percentage indicates a stronger element."}
      </span>
    </div>
  );
}






