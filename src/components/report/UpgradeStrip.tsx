"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface UpgradeStripProps {
  onUnlock: () => void;
  message?: string;
  buttonLabel?: string;
}

export default function UpgradeStrip({ onUnlock, message, buttonLabel = "解锁完整版（$1）" }: UpgradeStripProps) {
  return (
    <motion.div
      variants={fadeUp(0.1)}
      initial="hidden"
      animate="visible"
      className="mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm"
    >
      <span className="text-sm md:text-base">
        {message ?? "已生成简版结果 · 解锁完整报告查看更多建议与解释"}
      </span>
      <button
        type="button"
        onClick={onUnlock}
        className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 md:text-sm"
      >
        {buttonLabel}
      </button>
    </motion.div>
  );
}

