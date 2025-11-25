"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";

interface ConstitutionCardV2Props {
  type?: string | null;
  name?: string | null;
  name_en?: string | null;
  descriptionParagraphs?: string[] | null;
  constitutionAdvice?: string[] | null;
  feature?: string[] | null;
  adviceSummary?: string | null;
  delay?: number;
  locale?: "zh" | "en";
}

export default function ConstitutionCardV2({
  type,
  name,
  name_en,
  descriptionParagraphs,
  constitutionAdvice,
  feature,
  adviceSummary,
  delay = 0.2,
  locale = "zh",
}: ConstitutionCardV2Props) {
  // 安全地处理空值，使用 fallback
  const paragraphs = descriptionParagraphs ?? feature ?? [];
  const adviceList = constitutionAdvice ?? [];
  const displayType = type ?? (locale === "zh" ? "未知体质" : "Unknown Constitution");
  const displayName = locale === "zh" 
    ? (name ?? name_en ?? (locale === "zh" ? "未知体质" : "Unknown Constitution"))
    : (name_en ?? name ?? "Unknown Constitution");

  const t =
    locale === "zh"
      ? { title: "今日状态体质", advice: "调养提示" }
      : { title: "Today's Constitution", advice: "Care Suggestions" };

  return (
    <motion.div variants={fadeUp(delay)} className="v2-card space-y-4">
      <div className="space-y-1">
        <V2PageTitle level="card">{t.title}</V2PageTitle>
        {displayName && displayName !== (locale === "zh" ? "未知体质" : "Unknown Constitution") ? (
          <p className="text-base font-semibold text-[var(--v2-color-green-primary)]">{displayName}</p>
        ) : (
          <p className="text-base font-semibold text-gray-500">{displayName}</p>
        )}
        {displayType && displayType !== (locale === "zh" ? "未知体质" : "Unknown Constitution") ? (
          <p className="text-xs uppercase tracking-wide text-gray-500">{displayType}</p>
        ) : null}
      </div>

      {paragraphs.length > 0 ? (
        <div className="space-y-2">
          {paragraphs.map((paragraph, idx) => (
            <V2Text key={idx} className="text-gray-800">
              {paragraph}
            </V2Text>
          ))}
        </div>
      ) : null}

      {adviceList.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">{t.advice}</p>
          <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
            {adviceList.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {adviceSummary ? (
        <V2Text className="rounded-xl border border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-4 py-3 text-[var(--v2-color-text-primary)]">
          {adviceSummary}
        </V2Text>
      ) : null}

      <V2Text variant="note" className="rounded-xl bg-slate-50 px-4 py-2">
        {locale === "zh"
          ? "说明：这些“状态体质”属于中医保健视角，不构成医疗建议。"
          : "Note: These state constitutions are wellness-oriented, not medical diagnoses."}
      </V2Text>
    </motion.div>
  );
}

