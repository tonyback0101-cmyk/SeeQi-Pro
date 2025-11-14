/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AssessmentModule, ModuleStatus } from "@/types/assessment";
import { loadStatuses, markSkipped, markInProgress, resetStatus } from "@/state/assessmentStorage";

const STATUS_LABEL_ZH: Record<ModuleStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  completed: "已完成",
  skipped: "已跳过",
};

const STATUS_LABEL_EN: Record<ModuleStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
};

const modulesMeta = [
  {
    id: "palm" as AssessmentModule,
    route: "/palm-collection",
    titleZh: "手相掌纹鉴识",
    titleEn: "Palm Insight",
    estimatedMinutes: 3,
    pro: false,
  },
  {
    id: "tongue" as AssessmentModule,
    route: "/tongue-collection",
    titleZh: "舌相健康分析",
    titleEn: "Tongue Health Scan",
    estimatedMinutes: 3,
    pro: false,
  },
  {
    id: "dream" as AssessmentModule,
    route: "/dream-record",
    titleZh: "梦境记录与解析",
    titleEn: "Dream Record & Insight",
    estimatedMinutes: 4,
    pro: false,
  },
  {
    id: "fengshui" as AssessmentModule,
    route: "/fengshui-input",
    titleZh: "五行风水问诊",
    titleEn: "Five-Element Alignment",
    estimatedMinutes: 5,
    pro: true,
  },
  {
    id: "iching" as AssessmentModule,
    route: "/iching-cast",
    titleZh: "周易卦象推演",
    titleEn: "I Ching Hexagram",
    estimatedMinutes: 4,
    pro: true,
  },
] satisfies Array<{
  id: AssessmentModule;
  route: string;
  titleZh: string;
  titleEn: string;
  estimatedMinutes: number;
  pro?: boolean;
}>;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function AssessmentPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [statuses, setStatuses] = useState(loadStatuses());

  useEffect(() => {
    const handler = () => {
      setStatuses(loadStatuses());
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }, []);

  const completedCount = useMemo(
    () => Object.values(statuses).filter((status) => status === "completed").length,
    [statuses],
  );

  const handleSkip = (module: AssessmentModule) => {
    if (statuses[module] === "skipped") {
      resetStatus(module);
    } else {
      markSkipped(module);
    }
    setStatuses(loadStatuses());
  };

  return (
    <main
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          background: "rgba(255, 255, 255, 0.92)",
          padding: "2.25rem 2rem",
          borderRadius: "28px",
          boxShadow: "0 20px 40px rgba(45, 64, 51, 0.12)",
        }}
      >
        <span
          style={{
            fontSize: "0.9rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#8DAE92",
            fontWeight: 600,
          }}
        >
          {locale === "zh" ? "灵活组合 · 即刻洞察" : "Modular · Insightful"}
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "2.4rem",
            color: "#2C3E30",
          }}
        >
          {locale === "zh" ? "选择你想体验的分析模块" : "Pick the modules you’d like to explore"}
        </h1>
        <p
          style={{
            margin: 0,
            lineHeight: 1.6,
            color: "rgba(44, 62, 48, 0.75)",
          }}
        >
          {locale === "zh"
            ? "每个模块都可单独提交或加入综合报告，可随时跳过。已完成的内容会保存在本地，可再次编辑。"
            : "Each module can stand alone or feed the unified report. Skip anytime; completed entries stay on this device for future edits."}
        </p>
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.85rem 1.2rem",
            borderRadius: "18px",
            background: "rgba(141, 174, 146, 0.18)",
            color: "#2C3E30",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <span>
            {locale === "zh"
              ? `已完成模块：${completedCount} / ${modulesMeta.length}`
              : `Completed modules: ${completedCount} / ${modulesMeta.length}`}
          </span>
          <Link
            href={`/${locale}/analysis-result`}
            style={{
              textDecoration: "none",
              color: "#4C5FD7",
              fontWeight: 600,
            }}
          >
            {locale === "zh" ? "进入综合报告入口" : "Open combined report hub"}
          </Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {modulesMeta.map((module) => {
          const status = statuses[module.id];
          const isCompleted = status === "completed";
          const isSkipped = status === "skipped";

          return (
            <article
              key={module.id}
              style={{
                borderRadius: "24px",
                padding: "1.75rem",
                background: "rgba(255, 255, 255, 0.94)",
                boxShadow: "0 16px 28px rgba(45, 64, 51, 0.12)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                border: "1px solid rgba(141, 174, 146, 0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {module.pro ? (
                <span
                  style={{
                    position: "absolute",
                    top: "1.2rem",
                    right: "-2.5rem",
                    background: "linear-gradient(135deg, #8C7AE6, #4C5FD7)",
                    color: "#fff",
                    padding: "0.3rem 2.8rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    transform: "rotate(38deg)",
                    letterSpacing: "0.08em",
                  }}
                >
                  PRO
                </span>
              ) : null}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#2C3E30" }}>
                    {locale === "zh" ? module.titleZh : module.titleEn}
                  </h2>
                  <p style={{ margin: "0.35rem 0 0", color: "rgba(44, 62, 48, 0.7)", fontSize: "0.95rem" }}>
                    {locale === "zh"
                      ? `预计 ${module.estimatedMinutes} 分钟`
                      : `~${module.estimatedMinutes} min`}
                  </p>
                </div>
                <span
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    background: isCompleted
                      ? "rgba(122, 157, 127, 0.15)"
                      : isSkipped
                      ? "rgba(200, 200, 200, 0.18)"
                      : "rgba(140, 122, 230, 0.12)",
                    color: isCompleted ? "#2C3E30" : isSkipped ? "#737373" : "#4C5FD7",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {locale === "zh" ? STATUS_LABEL_ZH[status] : STATUS_LABEL_EN[status]}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href={`/${locale}${module.route}`}
                  onClick={() => markInProgress(module.id)}
                  style={{
                    padding: "0.65rem 1.2rem",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
                    color: "#fff",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 12px 22px rgba(122, 157, 127, 0.28)",
                  }}
                >
                  {isCompleted
                    ? locale === "zh"
                      ? "查看或修改"
                      : "Review / Edit"
                    : locale === "zh"
                    ? "开始"
                    : "Start"}
                </Link>
                <button
                  type="button"
                  onClick={() => handleSkip(module.id)}
                  style={{
                    padding: "0.65rem 1.2rem",
                    borderRadius: "12px",
                    border: "1px dashed rgba(141, 174, 146, 0.6)",
                    background: "transparent",
                    color: "#2C3E30",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isSkipped
                    ? locale === "zh"
                      ? "恢复待办"
                      : "Reopen"
                    : locale === "zh"
                    ? "暂时跳过"
                    : "Skip for now"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <footer
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.7)", lineHeight: 1.6 }}>
          {locale === "zh"
            ? "完成任意模块后，可返回此处继续其他分析，或直接查看对应单项报告。"
            : "After finishing any module, you can revisit others here or dive into its standalone report."}
        </p>
        <Link
          href={`/${locale}`}
          style={{
            textDecoration: "none",
            color: "#8DAE92",
            fontWeight: 600,
          }}
        >
          ← {locale === "zh" ? "返回首页" : "Back to Home"}
        </Link>
      </footer>
    </main>
  );
}
