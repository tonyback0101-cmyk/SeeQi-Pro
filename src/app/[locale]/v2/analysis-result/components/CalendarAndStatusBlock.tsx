"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface CalendarAndStatusBlockProps {
  date?: string | null;
  solarTerm?: string | null;
  dayGanzhi?: string | null;
  todayYi?: string[] | null;
  todayJi?: string[] | null;
  bodyMindStatus?: string | null;
  delay?: number;
  locale?: "zh" | "en";
  isFullAccess?: boolean;
  onUnlock?: () => void;
}

export default function CalendarAndStatusBlock({
  date,
  solarTerm,
  dayGanzhi,
  todayYi,
  todayJi,
  bodyMindStatus,
  delay = 0.3,
  locale = "zh",
  isFullAccess = false,
  onUnlock = () => {},
}: CalendarAndStatusBlockProps) {
  const t =
    locale === "zh"
      ? {
          previewLabel: "气运 · 今日节奏",
          previewCTA: "解锁气运详情",
          title: "公历信息 + 吉凶时段 + 身心状态简版",
          calendarInfo: "公历信息",
          date: "日期",
          solarTerm: "节气",
          dayGanzhi: "干支",
          auspiciousTime: "吉凶时段",
          todayYi: "今日宜",
          todayJi: "今日忌",
          bodyMindStatus: "身心状态简版",
        }
      : {
          title: "Calendar Info + Auspicious Times + Body-Mind Status",
          calendarInfo: "Calendar Info",
          date: "Date",
          solarTerm: "Solar Term",
          dayGanzhi: "Ganzhi",
          auspiciousTime: "Auspicious Times",
          todayYi: "Today's Do's",
          todayJi: "Today's Don'ts",
          bodyMindStatus: "Body-Mind Status",
          previewLabel: "Qi Rhythm · Today",
          previewCTA: "Unlock qi insights",
        };

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return locale === "zh"
        ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
        : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = date ? formatDate(date) : null;

  const previewSummary =
    bodyMindStatus ||
    (solarTerm
      ? locale === "zh"
        ? `今日节气「${solarTerm}」${dayGanzhi ? `，干支「${dayGanzhi}」` : ""}`
        : `Solar term ${solarTerm}${dayGanzhi ? `, Ganzhi ${dayGanzhi}` : ""}`
      : locale === "zh"
      ? "今日气运提示整理中，稍后查看。"
      : "Qi rhythm preview is being prepared.");

  if (!isFullAccess) {
    return (
      <motion.section
        variants={fadeUp(delay)}
        initial="hidden"
        animate="visible"
        className="report-section"
      >
        <div className="report-content">
          <div className="rounded-2xl border border-card-border-light bg-card-bg-dark/60 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-light-secondary mb-2">
              {t.previewLabel}
            </p>
            <p className="text-sm text-light-primary leading-relaxed">{previewSummary}</p>
            <button
              type="button"
              onClick={onUnlock}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent-gold/50 px-4 py-2 text-xs font-semibold text-accent-gold hover:bg-accent-gold/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              {t.previewCTA}
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="report-section public-info-section"
    >
      <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
        <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
        {t.title}
      </h2>
      <div className="report-content space-y-4">
        {/* 公历信息 */}
        <ul className="public-info-list border-b border-card-border-light pb-3">
          <li>
            <strong>{t.date}</strong>
            <span>{formattedDate ?? (locale === "zh" ? "暂无" : "N/A")}</span>
          </li>
          <li>
            <strong>{t.solarTerm}</strong>
            <span>{solarTerm ?? (locale === "zh" ? "暂无" : "N/A")}</span>
          </li>
          <li>
            <strong>{t.dayGanzhi}</strong>
            <span>{dayGanzhi ?? (locale === "zh" ? "暂无" : "N/A")}</span>
          </li>
        </ul>

        {/* 吉凶时段 */}
        {(todayYi && todayYi.length > 0) || (todayJi && todayJi.length > 0) ? (
          <div className="flex gap-4 text-sm">
            {todayYi && todayYi.length > 0 && (
              <div className="flex-1">
                <span className="text-accent-red font-bold mr-2 rounded-full border border-accent-red px-1 text-xs">
                  {t.todayYi}
                </span>
                <ul className="report-list mt-1 space-y-1 text-light-secondary">
                  {todayYi.slice(0, 3).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {todayYi && todayYi.length > 0 && todayJi && todayJi.length > 0 && (
              <div className="w-[1px] bg-card-border-light"></div>
            )}
            {todayJi && todayJi.length > 0 && (
              <div className="flex-1">
                {/* text-light-highlight: 用于"忌"的深色强调 */}
                <span className="text-light-highlight font-bold mr-2 rounded-full border border-light-highlight px-1 text-xs">
                  {t.todayJi}
                </span>
                <ul className="report-list mt-1 space-y-1 text-light-secondary">
                  {todayJi.slice(0, 3).map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* 身心状态简版 */}
        <div className="bg-mystic-secondary/50 rounded p-3 text-sm border border-card-border-light">
          <div className="font-bold mb-1 text-light-highlight">{t.bodyMindStatus}</div>
          {bodyMindStatus ? (
            <>
              {solarTerm && (
                <p className="text-light-secondary mb-1">
                  {locale === "zh" ? `今日节气为「${solarTerm}」` : `Solar Term: ${solarTerm}`}
                  {dayGanzhi && (locale === "zh" ? `，当天干支为「${dayGanzhi}」` : `, Day Ganzhi: ${dayGanzhi}`)}
                </p>
              )}
              <p className="text-light-secondary">{bodyMindStatus}</p>
            </>
          ) : (
            <p className="text-light-secondary">
              {solarTerm && (locale === "zh" ? `今日节气为「${solarTerm}」` : `Solar Term: ${solarTerm}`)}
              {dayGanzhi && (locale === "zh" ? `，当天干支为「${dayGanzhi}」` : `, Day Ganzhi: ${dayGanzhi}`)}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}



