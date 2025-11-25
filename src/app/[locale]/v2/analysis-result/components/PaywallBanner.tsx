"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface PaywallBannerProps {
  onClick: () => void;
  delay?: number;
  locale?: "zh" | "en";
}

export default function PaywallBanner({
  onClick,
  delay = 0.35,
  locale = "zh",
}: PaywallBannerProps) {
  const t =
    locale === "zh"
      ? {
          description: "解锁完整报告：掌纹财富线 + 舌象调理 + 全面气运节奏",
          button: "解锁完整报告：掌纹财富线 + 舌象调理 + 全面气运节奏",
        }
      : {
          description: "Unlock Full Report: Wealth Line + Tongue Care + Comprehensive Qi Rhythm",
          button: "Unlock Full Report: Wealth Line + Tongue Care + Comprehensive Qi Rhythm",
        };

  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-3"
    >
      <p className="text-center text-sm text-[var(--v2-color-text-secondary)]">
        {t.description}
      </p>
      <button
        onClick={onClick}
        className="GreenButton"
        style={{
          padding: "16px 32px",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        {t.button}
      </button>
    </motion.div>
  );
}

