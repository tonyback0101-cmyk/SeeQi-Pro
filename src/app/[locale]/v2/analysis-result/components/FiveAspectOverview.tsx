"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface FiveAspectOverviewProps {
  qi?: "高" | "中" | "低" | "中+" | "中-" | null;
  shen?: "高" | "中" | "低" | "中+" | "中-" | null;
  xing?: "高" | "中" | "低" | "中+" | "中-" | null;
  ming?: "高" | "中" | "低" | "中+" | "中-" | null;
  cai?: "高" | "中" | "低" | "中+" | "中-" | null;
  delay?: number;
  locale?: "zh" | "en";
}

export default function FiveAspectOverview({
  qi = "中",
  shen = "中",
  xing = "中-",
  ming = "中+",
  cai = "中",
  delay = 0.1,
  locale = "zh",
}: FiveAspectOverviewProps) {
  const t =
    locale === "zh"
      ? {
          title: "五象总览",
          labels: {
            zhong: "中气",
            ming: "命气",
            yin: "阴气",
            xing: "形气",
            yong: "用气",
          },
        }
      : {
          title: "Five Aspects Overview",
          labels: {
            zhong: "Zhong Qi",
            ming: "Ming Qi",
            yin: "Yin Qi",
            xing: "Xing Qi",
            yong: "Yong Qi",
          },
        };

  const icons = {
    zhong: "☯",
    ming: "✦",
    yin: "☾",
    xing: "✧",
    yong: "⚡",
  };

  const items = [
    { key: "zhong", label: t.labels.zhong, value: qi ?? "中" },
    { key: "ming", label: t.labels.ming, value: ming ?? "中+" },
    { key: "yin", label: t.labels.yin, value: shen ?? "中" },
    { key: "xing", label: t.labels.xing, value: xing ?? "中-" },
    { key: "yong", label: t.labels.yong, value: cai ?? "中" },
  ];

  const getValueClass = (value: string) => {
    if (value.includes("+")) return "text-accent-red";
    if (value.includes("-")) return "text-accent-blue";
    return "text-text-light-highlight";
  };

  return (
    <motion.section
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="report-section"
    >
      <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-text-light-primary">
        <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
        {t.title}
      </h2>
      <motion.div
        variants={fadeUp(delay + 0.05)}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="report-content relative overflow-hidden"
      >
        <div className="absolute inset-y-0 right-0 w-1/3 pointer-events-none opacity-20 bg-gradient-to-l from-accent-gold/30 to-transparent" />
        <div className="space-y-4 mb-4">
          {items.map((item, index) => (
            <motion.div
              key={item.key}
              variants={fadeUp(delay + 0.08 + index * 0.04)}
              className="flex items-center gap-5 rounded-lg px-4 py-3 bg-gradient-to-r from-transparent via-transparent to-card-bg-dark/40 md:px-6 whitespace-nowrap"
            >
              <span className="text-4xl md:text-5xl flex-shrink-0 flex items-center" aria-hidden>
                {icons[item.key as keyof typeof icons]}
              </span>
              <div className="flex items-center gap-3 text-base md:text-lg text-text-light-secondary whitespace-nowrap tracking-wide">
                <span>{item.label}</span>
                <span className="text-text-light-secondary/60">·</span>
                <span className={`font-bold ${getValueClass(item.value)}`}>{item.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}

