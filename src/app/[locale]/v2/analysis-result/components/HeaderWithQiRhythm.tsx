"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface HeaderWithQiRhythmProps {
  title?: string;
  subtitle?: string;
  solarTerm?: string | null;
  dayGanzhi?: string | null;
  delay?: number;
  locale?: "zh" | "en";
}

export default function HeaderWithQiRhythm({
  title,
  subtitle,
  solarTerm,
  dayGanzhi,
  delay = 0,
  locale = "zh",
}: HeaderWithQiRhythmProps) {
  const t =
    locale === "zh"
      ? {
          title: title ?? "综合测评报告",
          subtitle: subtitle ?? "基于掌纹、舌象、体质、梦境与气运的综合分析",
          qiRhythm: "今日气运节奏",
          solarTermLabel: "今日节气为",
          dayGanzhiLabel: "当天干支为",
        }
      : {
          title: title ?? "Comprehensive Report",
          subtitle: subtitle ?? "Integrated analysis based on palmistry, tongue, constitution, dreams, and qi rhythm",
          qiRhythm: "Today's Qi Rhythm",
          solarTermLabel: "Solar Term",
          dayGanzhiLabel: "Day Ganzhi",
        };

  return (
    <motion.header
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-2xl font-serif font-bold text-light-primary mb-2">{t.title}</h1>
      {subtitle && (
        <p className="text-sm text-light-secondary leading-relaxed">{t.subtitle}</p>
      )}
      
      <div className="mt-4 p-4 card bg-card-bg-dark rounded-lg border border-card-border-light flex justify-between items-center">
        <div>
          <div className="text-xs text-light-secondary mb-1">{t.qiRhythm}</div>
          {dayGanzhi && (
            <div className="font-serif font-bold text-light-highlight">
              {locale === "zh" ? `当天干支为「${dayGanzhi}」` : `Day Ganzhi: ${dayGanzhi}`}
            </div>
          )}
          {!dayGanzhi && solarTerm && (
            <div className="font-serif font-bold text-light-highlight">
              {locale === "zh" ? `今日节气为「${solarTerm}」` : `Solar Term: ${solarTerm}`}
            </div>
          )}
          {!dayGanzhi && !solarTerm && (
            <div className="font-serif font-bold text-light-highlight">
              {locale === "zh" ? "节气与干支信息暂未生成" : "Solar term and ganzhi information not available"}
            </div>
          )}
        </div>
        <div className="text-2xl opacity-30 text-light-highlight">☯</div>
      </div>
    </motion.header>
  );
}



