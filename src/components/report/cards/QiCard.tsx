"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface QiCardProps {
  score?: number | null;
  phrase?: string | null;
  warning?: string | null;
  heading?: string;
  warningLabel?: string;
  fallbackPhrase?: string;
  delay?: number;
}

export default function QiCard({
  score = null,
  phrase,
  warning,
  heading = "今日气运",
  warningLabel = "提醒",
  fallbackPhrase = "保持平和的心态，适时调息。",
  delay = 0.12,
}: QiCardProps) {
  const displayScore = typeof score === "number" && Number.isFinite(score) ? Math.round(score) : "--";

  return (
    <motion.div
      variants={fadeUp(delay)}
      className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-teal-900">{heading}</h3>
      <div className="mt-3 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-bold text-teal-700 shadow-inner">
          {displayScore}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{phrase ?? fallbackPhrase}</p>
      </div>
      {warning ? <p className="mt-3 text-xs text-amber-700">{warningLabel}：{warning}</p> : null}
    </motion.div>
  );
}

