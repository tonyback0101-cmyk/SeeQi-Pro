"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";

interface FiveElementsOverviewCardProps {
  qi?: "高" | "中" | "低" | "中+" | "中-" | null;
  shen?: "高" | "中" | "低" | "中+" | "中-" | null;
  xing?: "高" | "中" | "低" | "中+" | "中-" | null;
  ming?: "高" | "中" | "低" | "中+" | "中-" | null;
  cai?: "高" | "中" | "低" | "中+" | "中-" | null;
  delay?: number;
  locale?: "zh" | "en";
}

export default function FiveElementsOverviewCard({
  qi = "中",
  shen = "中",
  xing = "中-",
  ming = "中+",
  cai = "中",
  delay = 0.1,
  locale = "zh",
}: FiveElementsOverviewCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "五象总览",
          labels: {
            qi: "气",
            shen: "神",
            xing: "形",
            ming: "命",
            cai: "财",
          },
        }
      : {
          title: "Five Elements Overview",
          labels: {
            qi: "Qi",
            shen: "Spirit",
            xing: "Form",
            ming: "Life",
            cai: "Wealth",
          },
        };

  const items = [
    { label: t.labels.qi, value: qi ?? "中" },
    { label: t.labels.shen, value: shen ?? "中" },
    { label: t.labels.xing, value: xing ?? "中-" },
    { label: t.labels.ming, value: ming ?? "中+" },
    { label: t.labels.cai, value: cai ?? "中" },
  ];

  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="v2-card space-y-4"
    >
      <V2PageTitle level="card">{t.title}</V2PageTitle>
      <div className="flex flex-wrap justify-center gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 rounded-lg border border-[var(--v2-color-border)] bg-[var(--v2-color-surface-secondary)] px-4 py-2"
          >
            <span className="text-xs text-[var(--v2-color-text-secondary)]">{item.label}</span>
            <span className="text-sm font-semibold text-[var(--v2-color-text-primary)]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <V2Text variant="note" className="text-center text-xs text-[var(--v2-color-text-tertiary)]">
        {locale === "zh"
          ? "注：只展示大致档位，不展示细节解释（细节锁在付费版）"
          : "Note: Only showing general levels, detailed explanations are locked in paid version"}
      </V2Text>
    </motion.div>
  );
}

