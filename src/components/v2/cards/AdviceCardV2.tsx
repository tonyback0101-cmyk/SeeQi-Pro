"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { V2PageTitle } from "@/components/v2/layout";

interface AdviceCardV2Props {
  items: string[];
  heading?: string;
  delay?: number;
}

export default function AdviceCardV2({
  items,
  heading = "今天可以这样照顾自己",
  delay = 0.5,
}: AdviceCardV2Props) {
  if (!items || items.length === 0) return null;

  return (
    <motion.div variants={fadeUp(delay)} className="v2-card space-y-4">
      <V2PageTitle level="card">{heading}</V2PageTitle>
      <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--v2-color-green-primary)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

