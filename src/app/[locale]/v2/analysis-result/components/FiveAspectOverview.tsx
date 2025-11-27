"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

type AspectValue = {
  tag?: string | null;
  preview?: string | null;
  detail?: string | null;
};

export type FiveAspectData = {
  summary?: AspectValue | null;
  palm?: {
    life?: AspectValue | null;
    emotion?: AspectValue | null;
    wealth?: AspectValue | null;
  } | null;
  tongue?: AspectValue | null;
  dream?: AspectValue | null;
  qi?: AspectValue | null;
};

interface FiveAspectOverviewProps {
  data: FiveAspectData;
  delay?: number;
  locale?: "zh" | "en";
  unlocked: boolean;
}

type FiveAspectItem = {
  key: string;
  label: string;
  icon: string;
  value?: AspectValue | null;
  sections?: Array<{ label: string; value?: AspectValue | null }>;
};

const COPY = {
  zh: {
    title: "五象总览",
    badgeUnlocked: "已解锁",
    badgePreview: "预览",
    placeholder: "",
    labels: {
      summary: "象局",
      palm: "掌象",
      tongue: "舌象",
      dream: "梦象",
      qi: "气运",
    },
    sections: {
      life: "生命纹",
      emotion: "情绪纹",
      wealth: "财富纹",
    },
  },
  en: {
    title: "Five Aspects Overview",
    badgeUnlocked: "Unlocked",
    badgePreview: "Preview",
    placeholder: "",
    labels: {
      summary: "Essence",
      palm: "Palm",
      tongue: "Tongue",
      dream: "Dream",
      qi: "Qi Rhythm",
    },
    sections: {
      life: "Life Line",
      emotion: "Emotion Line",
      wealth: "Wealth Line",
    },
  },
} as const;

const SUMMARY_ICON = "☯";

export default function FiveAspectOverview({
  data,
  delay = 0.1,
  locale = "zh",
  unlocked,
}: FiveAspectOverviewProps) {
  const t = COPY[locale];

  const renderValue = (value?: AspectValue | null, emphasizeDetail = false) => {
    if (!value || (!value.preview && !value.detail)) {
      return null;
    }
    // 预览版：只显示1行摘要、标签：预览、一句提示，绝不能显示完整版内容
    if (!unlocked) {
      const previewText = value.preview;
      if (!previewText) return null;
      return (
        <div>
          <span className="mr-2 text-xs uppercase tracking-wide text-amber-400/70">预览</span>
          {value.tag && <span className="mr-2 text-xs uppercase tracking-wide text-accent-gold">{value.tag}</span>}
          <p className="text-sm text-text-light-primary line-clamp-1">{previewText}</p>
        </div>
      );
    }
    // 完整版：展示完整版描述，去除所有预览按钮
    const detailText = value.detail ?? value.preview;
    if (!detailText) return null;
    return (
      <div className="space-y-1">
        {value.tag && <span className="text-xs uppercase tracking-wide text-accent-gold">{value.tag}</span>}
        <p className={`text-sm leading-relaxed text-text-light-primary ${emphasizeDetail ? "font-medium" : ""}`}>
          {detailText}
        </p>
      </div>
    );
  };

  const summaryItem: FiveAspectItem = {
    key: "summary",
    label: t.labels.summary,
    icon: SUMMARY_ICON,
    value: data.summary ?? null,
  };

  const showSummary = summaryItem.value && (summaryItem.value.preview || summaryItem.value.detail);

  return (
    <motion.section
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="report-section"
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2 className="text-lg font-serif font-bold flex items-center gap-2 text-text-light-primary">
          <span className="w-1 h-4 bg-accent-gold rounded-full" />
          {t.title}
        </h2>
        <span
          className={`px-2.5 py-0.5 text-xs rounded-full ${
            unlocked ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"
          }`}
        >
          {unlocked ? t.badgeUnlocked : t.badgePreview}
        </span>
      </div>
      {showSummary && (
        <motion.div
          variants={fadeUp(delay + 0.05)}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="report-content relative overflow-hidden"
        >
          <div className="absolute inset-y-0 right-0 w-1/3 pointer-events-none opacity-20 bg-gradient-to-l from-accent-gold/30 to-transparent" />
          <motion.div
            variants={fadeUp(delay + 0.08)}
            className="rounded-lg px-4 py-3 md:px-5 border border-card-border-light/40 bg-card-bg-dark/40 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-text-light-secondary/70">
                  {summaryItem.label}
                </p>
                <div className="mt-1">
                  {renderValue(summaryItem.value, true)}
                </div>
              </div>
              <span className="text-3xl md:text-4xl opacity-60 text-light-highlight">
                {summaryItem.icon}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.section>
  );
}

