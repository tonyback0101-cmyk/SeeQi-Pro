"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface CalendarAndStatusBlockProps {
  // 公历信息
  date?: string | null;
  solarTerm?: string | null;
  dayGanzhi?: string | null;
  // 吉凶时段
  todayYi?: string[] | null;
  todayJi?: string[] | null;
  // 身心状态简版
  bodyMindStatus?: string | null;
  delay?: number;
  locale?: "zh" | "en";
  isFullAccess?: boolean;
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
}: CalendarAndStatusBlockProps) {
  const t =
    locale === "zh"
      ? {
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
          {!isFullAccess && (
            <p className="text-accent-gold font-medium cursor-pointer mt-2">
              {locale === "zh" ? "解锁完整报告：查看精密象与今日修身建议" : "Unlock Full Report: View Detailed Insights & Today's Guidance"}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}



