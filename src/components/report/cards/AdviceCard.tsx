"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface AdviceCardProps {
  food?: string[] | null;
  action?: string[] | null;
  acupoint?: string[] | null;
  labels?: {
    heading?: string;
    food?: string;
    action?: string;
    acupoint?: string;
    empty?: string;
  };
  delay?: number;
}

const renderGroup = (items: string[] | null | undefined, empty: string, max = 1) => {
  const list = (items ?? []).filter(Boolean).slice(0, max);
  if (list.length === 0) {
    return <p className="text-xs text-gray-400">{empty}</p>;
  }
  return (
    <ul className="mt-1 list-disc pl-4 text-sm text-gray-600">
      {list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default function AdviceCard({
  food,
  action,
  acupoint,
  labels,
  delay = 0.16,
}: AdviceCardProps) {
  const copy = {
    heading: labels?.heading ?? "今日建议",
    food: labels?.food ?? "食材",
    action: labels?.action ?? "调理动作",
    acupoint: labels?.acupoint ?? "穴位",
    empty: labels?.empty ?? "暂无",
  };

  return (
    <motion.div variants={fadeUp(delay)} className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-emerald-900">{copy.heading}</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{copy.food}</p>
          {renderGroup(food, copy.empty, 3)}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{copy.action}</p>
          {renderGroup(action, copy.empty, 1)}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">{copy.acupoint}</p>
          {renderGroup(acupoint, copy.empty, 1)}
        </div>
      </div>
    </motion.div>
  );
}

