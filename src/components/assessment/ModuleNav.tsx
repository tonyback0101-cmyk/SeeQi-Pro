'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadStatuses } from "@/state/assessmentStorage";
import type { AssessmentModule, ModuleStatus } from "@/types/assessment";

const MODULES: Array<{
  id: AssessmentModule;
  zh: string;
  en: string;
  href: string;
}> = [
  { id: "palm", zh: "手相采集", en: "Palm", href: "/palm-collection" },
  { id: "tongue", zh: "舌相采集", en: "Tongue", href: "/tongue-collection" },
  { id: "dream", zh: "梦境记录", en: "Dream", href: "/dream-record" },
  { id: "fengshui", zh: "风水填写", en: "Fengshui", href: "/fengshui-input" },
  { id: "iching", zh: "易经推演", en: "I Ching", href: "/iching-cast" },
];

const STATUS_LABEL: Record<"zh" | "en", Record<ModuleStatus, string>> = {
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
};

export type ModuleNavProps = {
  locale: "zh" | "en";
  current: AssessmentModule;
};

export default function ModuleNav({ locale, current }: ModuleNavProps) {
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

  const completedCount = useMemo(
    () => Object.values(statuses).filter((status) => status === "completed").length,
    [statuses]
  );

  return (
    <aside className="module-nav">
      <div className="module-nav__header">
        <span>{locale === "zh" ? "测评进度" : "Progress"}</span>
        <strong>
          {completedCount}/{MODULES.length}
        </strong>
      </div>
      <ul>
        {MODULES.map((module) => {
          const status = statuses[module.id];
          return (
            <li key={module.id} className={module.id === current ? "module-nav__item module-nav__item--active" : "module-nav__item"}>
              <Link href={`/${locale}${module.href}`}>
                <span>{locale === "zh" ? module.zh : module.en}</span>
                <span className={`status status--${status}`}>{STATUS_LABEL[locale][status]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <style jsx>{`
        .module-nav {
          border-radius: 20px;
          border: 1px solid rgba(141, 174, 146, 0.25);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 32px rgba(35, 64, 53, 0.08);
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .module-nav__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #234035;
          font-size: 0.95rem;
          font-weight: 600;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .module-nav__item a {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 14px;
          padding: 0.65rem 0.85rem;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          color: #234035;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .module-nav__item a:hover {
          border-color: rgba(141, 174, 146, 0.4);
          background: rgba(141, 174, 146, 0.12);
        }

        .module-nav__item--active a {
          border-color: rgba(76, 95, 215, 0.4);
          background: rgba(76, 95, 215, 0.1);
        }

        .status {
          font-size: 0.82rem;
          border-radius: 999px;
          padding: 0.25rem 0.65rem;
          font-weight: 600;
        }

        .status--completed {
          background: rgba(13, 148, 136, 0.18);
          color: #0f766e;
        }

        .status--in_progress {
          background: rgba(59, 130, 246, 0.18);
          color: #2563eb;
        }

        .status--not_started {
          background: rgba(148, 163, 184, 0.18);
          color: #475569;
        }

        .status--skipped {
          background: rgba(244, 63, 94, 0.18);
          color: #be123c;
        }
      `}</style>
    </aside>
  );
}






