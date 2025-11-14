"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface ConstitutionCardProps {
  title?: string | null;
  brief?: string | null;
  full?: string | null;
  heading?: string;
  delay?: number;
}

export default function ConstitutionCard({ title, brief, full, heading = "体质洞察", delay = 0.1 }: ConstitutionCardProps) {
  return (
    <motion.div
      variants={fadeUp(delay)}
      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-emerald-900">{heading}</h3>
      <p className="mt-2 text-emerald-700 font-medium">{title ?? "体质待识别"}</p>
      {brief ? <p className="mt-2 text-sm text-gray-600 leading-relaxed">{brief}</p> : null}
      {full ? <p className="mt-2 text-sm text-gray-600 leading-relaxed">{full}</p> : null}
    </motion.div>
  );
}

