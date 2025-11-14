"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface DreamCardProps {
  summary?: string | null;
  tip?: string | null;
  tags?: string[] | null;
  heading?: string;
  emptyText?: string;
  tipLabel?: string;
  delay?: number;
}

export default function DreamCard({
  summary,
  tip,
  tags,
  heading = "梦境提示",
  emptyText = "暂无记录，可前往解梦页体验",
  tipLabel = "建议",
  delay = 0.2,
}: DreamCardProps) {
  const displayTags = (tags ?? []).filter(Boolean).slice(0, 4);
  return (
    <motion.div variants={fadeUp(delay)} className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-indigo-900">{heading}</h3>
      <p className="mt-2 text-sm text-gray-700 leading-relaxed">{summary ?? emptyText}</p>
      {tip ? <p className="mt-2 text-xs text-gray-500">{tipLabel}：{tip}</p> : null}
      {displayTags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <span key={`tag-${tag}`} className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

