"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle, V2Text } from "@/components/v2/layout";

interface ActionGuidelineCardProps {
  overallReview?: string | null;
  todayYi?: string[]; // 今日宜（三条）
  todayJi?: string[]; // 今日忌（三条）
  protectionTip?: string | null; // 小护运法（一条）
  healthCareTip?: string | null; // 今日身体调养建议（一条）
  delay?: number;
  locale?: "zh" | "en";
}

export default function ActionGuidelineCard({
  overallReview,
  todayYi = [],
  todayJi = [],
  protectionTip,
  healthCareTip,
  delay = 0.4,
  locale = "zh",
}: ActionGuidelineCardProps) {
  const t =
    locale === "zh"
      ? {
          title: "今日行动总纲",
          overallReview: "今日总评",
          todayYi: "今日宜",
          todayJi: "今日忌",
          protectionTip: "小护运法",
          healthCareTip: "今日身体调养建议",
        }
      : {
          title: "Today's Action Guideline",
          overallReview: "Overall Review",
          todayYi: "Today's Do's",
          todayJi: "Today's Don'ts",
          protectionTip: "Protection Tip",
          healthCareTip: "Today's Health Care Suggestion",
        };

  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="v2-card space-y-4 border-2 border-[var(--v2-color-green-primary)] bg-gradient-to-br from-[var(--v2-color-green-primary)]/5 to-[var(--v2-color-green-primary)]/10"
    >
      <div className="flex items-center gap-2">
        <V2PageTitle level="card" className="text-[var(--v2-color-green-primary)]">
          {t.title}
        </V2PageTitle>
        <span className="rounded-full bg-[var(--v2-color-green-primary)] px-2 py-0.5 text-xs font-semibold text-white">
          {locale === "zh" ? "付费专享" : "Pro"}
        </span>
      </div>

      {/* 今日总评 */}
      {overallReview && (
        <div className="rounded-xl border-2 border-[var(--v2-color-green-primary)]/30 bg-white/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--v2-color-green-primary)]">
            {t.overallReview}
          </p>
          <p className="mt-2 text-base font-medium leading-relaxed text-[var(--v2-color-text-primary)]">
            {overallReview}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 今日宜 */}
        {todayYi.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              {t.todayYi}
            </p>
            <ul className="mt-2 space-y-2">
              {todayYi.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 今日忌 */}
        {todayJi.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              {t.todayJi}
            </p>
            <ul className="mt-2 space-y-2">
              {todayJi.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 小护运法 */}
      {protectionTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {t.protectionTip}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">{protectionTip}</p>
        </div>
      )}

      {/* 今日身体调养建议 */}
      {healthCareTip && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {t.healthCareTip}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-blue-800">{healthCareTip}</p>
        </div>
      )}
    </motion.div>
  );
}



