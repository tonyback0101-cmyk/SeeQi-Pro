"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2Text } from "@/components/v2/layout";

interface HeavenlyHintCardProps {
  hint?: string | null;
  delay?: number;
  locale?: "zh" | "en";
}

export default function HeavenlyHintCard({
  hint,
  delay = 0.05,
  locale = "zh",
}: HeavenlyHintCardProps) {
  const displayHint = hint ?? (locale === "zh" ? "今日气机略收，适合整理旧事，不宜强攻新局。" : "Today's qi is slightly converging; suitable for organizing old matters, not for aggressively pursuing new ventures.");

  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="v2-card text-center"
    >
      <V2Text variant="body" className="text-lg font-medium text-[var(--v2-color-text-primary)] italic">
        {displayHint}
      </V2Text>
    </motion.div>
  );
}

