"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStatuses } from "@/state/assessmentStorage";
import type { AssessmentModule, ModuleStatus } from "@/types/assessment";
import { useSession } from "next-auth/react";

const LABELS = {
  zh: {
    title: "综合报告中心",
    description: "查看各模块完成情况，并进入最新的综合报告。",
    openReport: "打开本机报告",
    toAssessment: "返回综合测评中心",
  },
  en: {
    title: "Report Hub",
    description: "Review module progress and open the latest combined report.",
    openReport: "Open local report",
    toAssessment: "Back to assessment hub",
  },
} as const;

const STATUS_LABELS = {
  zh: {
    not_started: "未开始",
    in_progress: "进行中",
    completed: "已完成",
    skipped: "已跳过",
  },
  en: {
    not_started: "Not started",
    in_progress: "In progress",
    completed: "Completed",
    skipped: "Skipped",
  },
} as const;

const MODULES: Array<{ id: AssessmentModule; zh: string; en: string }> = [
  { id: "palm", zh: "手相采集", en: "Palm capture" },
  { id: "tongue", zh: "舌相采集", en: "Tongue capture" },
  { id: "dream", zh: "梦境记录", en: "Dream record" },
  { id: "fengshui", zh: "五行风水填写", en: "Fengshui input" },
  { id: "iching", zh: "周易卦象推演", en: "I Ching casting" },
];

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function AnalysisHubPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const t = LABELS[locale];
  const statusMap = STATUS_LABELS[locale];
  const { data: session } = useSession();
  const isPro = Boolean((session as any)?.subscription?.active);
  const [statuses, setStatuses] = useState<Record<AssessmentModule, ModuleStatus>>({
    palm: "not_started",
    tongue: "not_started",
    dream: "not_started",
    fengshui: "not_started",
    iching: "not_started",
  });

  useEffect(() => {
    setStatuses(loadStatuses());
  }, []);

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.8rem",
      }}
    >
      <header
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "24px",
          padding: "2.2rem 2rem",
          boxShadow: "0 20px 36px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {!isPro && (
          <div
            style={{
              background: "rgba(255, 243, 205, 0.9)",
              borderRadius: "14px",
              padding: "0.8rem 1rem",
              color: "#8B5E00",
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            {locale === "zh"
              ? "专业版订阅可解锁云端综合报告与历史记录导出，现在升级即可享受推广返佣。"
              : "Upgrade to SeeQi Pro to unlock cloud-synced reports, history export, and affiliate rewards."}
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: "2.2rem", color: "#2C3E30" }}>{t.title}</h1>
        <p style={{ margin: 0, lineHeight: 1.7, color: "rgba(44, 62, 48, 0.72)" }}>{t.description}</p>
        {!isPro && (
          <Link
            href={`/${locale}/pricing`}
            style={{
              alignSelf: "flex-start",
              marginTop: "0.4rem",
              padding: "0.6rem 1.2rem",
              borderRadius: 999,
              background: "linear-gradient(135deg, #2C3E30, #4A7157)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {locale === "zh" ? "了解专业版" : "Explore Pro Plan"}
          </Link>
        )}
      </header>

      <section
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          padding: "1.8rem",
          boxShadow: "0 18px 32px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(44, 62, 48, 0.8)", lineHeight: 1.6 }}>
          {MODULES.map((module) => (
            <li key={module.id}>
              {locale === "zh" ? module.zh : module.en} · {statusMap[statuses[module.id]]}
            </li>
          ))}
        </ul>
      </section>

      <div
        style={{
          display: "flex",
          gap: "0.9rem",
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/${locale}/analysis-result/local`}
          style={{
            padding: "0.8rem 1.6rem",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 14px 26px rgba(122, 157, 127, 0.28)",
          }}
        >
          {t.openReport}
        </Link>
        <Link
          href={`/${locale}/assessment`}
          style={{
            padding: "0.75rem 1.4rem",
            borderRadius: "14px",
            border: "1px solid rgba(141, 174, 146, 0.4)",
            background: "rgba(255, 255, 255, 0.9)",
            color: "#2C3E30",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← {t.toAssessment}
        </Link>
      </div>
    </main>
  );
}

