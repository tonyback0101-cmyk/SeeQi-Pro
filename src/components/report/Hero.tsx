"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface HeroProps {
  qiIndex?: number | null;
  onShare: () => void;
  onUnlock: () => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  shareLabel?: string;
  unlockLabel?: string;
}

type CounterState = {
  value: number;
  target: number;
};

export default function Hero({
  qiIndex = 0,
  onShare,
  onUnlock,
  disabled = false,
  title = "SeeQi 分析报告",
  subtitle = "东方智慧 · 气运与体质洞察",
  shareLabel = "生成分享卡",
  unlockLabel = "解锁完整版（$1）",
}: HeroProps) {
  const [counter, setCounter] = useState<CounterState>({ value: 0, target: Math.max(qiIndex ?? 0, 0) });

  useEffect(() => {
    const target = Math.max(Math.round(qiIndex ?? 0), 0);
    const frames = Math.max(Math.floor(600 / 16), 1);
    const increment = target / frames;
    let frame = 0;

    const id = window.setInterval(() => {
      frame += 1;
      const next = Math.min(target, Math.round(increment * frame));
      setCounter({ value: next, target });
      if (next >= target) window.clearInterval(id);
    }, 16);

    return () => window.clearInterval(id);
  }, [qiIndex]);

  return (
    <motion.section
      variants={fadeUp(0)}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm md:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="grow">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            SeeQi Insight
          </div>
          <h1 className="mt-3 text-2xl font-bold text-emerald-950 md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-emerald-700 md:text-base">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-inner md:h-24 md:w-24">
            <span className="text-xl font-semibold text-emerald-700 md:text-2xl">{counter.value}</span>
            <span className="absolute bottom-1 text-[10px] text-emerald-400 md:bottom-2">/100</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onShare}
              className="w-full rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:shadow-md sm:w-auto"
            >
              {shareLabel}
            </button>
            <button
              type="button"
              onClick={onUnlock}
              disabled={disabled}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {unlockLabel}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

