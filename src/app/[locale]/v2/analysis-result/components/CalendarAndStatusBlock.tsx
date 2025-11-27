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
  luckyHours?: string[] | null;
  unluckyHours?: string[] | null;
  qiTrend?: string | null;
  qiAdvice?: string[] | null;
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
  luckyHours,
  unluckyHours,
  qiTrend,
  qiAdvice,
  delay = 0.3,
  locale = "zh",
  isFullAccess = false,
  onUnlock = () => {},
}: CalendarAndStatusBlockProps) {
  const t =
    locale === "zh"
      ? {
          previewLabel: "气运 · 今日节奏",
          title: "今日气运完整版",
          date: "日期",
          solarTerm: "节气",
          dayGanzhi: "干支",
          auspiciousTime: "吉凶时段",
          todayYi: "今日宜",
          todayJi: "今日忌",
          luckyHours: "吉时",
          unluckyHours: "凶时",
          qiTrend: "五行趋势",
          lifeAdvice: "生活建议",
        }
      : {
          title: "Today's Qi Rhythm (Full Version)",
          date: "Date",
          solarTerm: "Solar Term",
          dayGanzhi: "Ganzhi",
          auspiciousTime: "Auspicious Times",
          todayYi: "Today's Do's",
          todayJi: "Today's Don'ts",
          luckyHours: "Lucky Hours",
          unluckyHours: "Unlucky Hours",
          qiTrend: "Five Elements Trend",
          lifeAdvice: "Life Advice",
          previewLabel: "Qi Rhythm · Today",
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

  // 预览版：仅展示星象名称、不可展开、不显示五行、不出现按钮
  if (!isFullAccess) {
    const starName = solarTerm || dayGanzhi || (locale === "zh" ? "今日气运" : "Today's Qi Rhythm");
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
            <p className="text-sm text-light-primary leading-relaxed line-clamp-1">
              {starName}
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  // 完整版：展示完全体：吉凶、时间段（黄历）、五行趋势、生活建议
  return (
    <motion.section
      variants={fadeUp(delay)}
      initial="hidden"
      animate="visible"
      className="report-section"
    >
      <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
        <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
        {t.title}
      </h2>
      <div className="report-content space-y-4">
        {/* 吉凶（宜忌） */}
        {(todayYi && todayYi.length > 0) || (todayJi && todayJi.length > 0) ? (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">
              {t.auspiciousTime}
            </p>
            <div className="flex gap-4 text-sm">
              {todayYi && todayYi.length > 0 && (
                <div className="flex-1">
                  <span className="text-accent-red font-bold mr-2 rounded-full border border-accent-red px-2 py-0.5 text-xs">
                    {t.todayYi}
                  </span>
                  <ul className="report-list mt-2 space-y-1 text-light-primary">
                    {todayYi.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-red" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {todayYi && todayYi.length > 0 && todayJi && todayJi.length > 0 && (
                <div className="w-[1px] bg-card-border-light"></div>
              )}
              {todayJi && todayJi.length > 0 && (
                <div className="flex-1">
                  <span className="text-light-highlight font-bold mr-2 rounded-full border border-light-highlight px-2 py-0.5 text-xs">
                    {t.todayJi}
                  </span>
                  <ul className="report-list mt-2 space-y-1 text-light-primary">
                    {todayJi.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* 时间段（黄历：吉时/凶时） */}
        {(luckyHours && luckyHours.length > 0) || (unluckyHours && unluckyHours.length > 0) ? (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">
              {locale === "zh" ? "时间段" : "Time Periods"}
            </p>
            <div className="flex gap-4 text-sm">
              {luckyHours && luckyHours.length > 0 && (
                <div className="flex-1">
                  <span className="text-accent-gold font-bold mr-2 rounded-full border border-accent-gold px-2 py-0.5 text-xs">
                    {t.luckyHours}
                  </span>
                  <ul className="report-list mt-2 space-y-1 text-light-primary">
                    {luckyHours.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {luckyHours && luckyHours.length > 0 && unluckyHours && unluckyHours.length > 0 && (
                <div className="w-[1px] bg-card-border-light"></div>
              )}
              {unluckyHours && unluckyHours.length > 0 && (
                <div className="flex-1">
                  <span className="text-light-highlight font-bold mr-2 rounded-full border border-light-highlight px-2 py-0.5 text-xs">
                    {t.unluckyHours}
                  </span>
                  <ul className="report-list mt-2 space-y-1 text-light-primary">
                    {unluckyHours.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* 五行趋势 */}
        {qiTrend && (
          <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight mb-2">
              {t.qiTrend}
            </p>
            <p className="text-sm leading-relaxed text-light-primary">{qiTrend}</p>
          </div>
        )}

        {/* 生活建议 */}
        {qiAdvice && qiAdvice.length > 0 && (
          <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold mb-2">
              {t.lifeAdvice}
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
              {qiAdvice.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.section>
  );
}



