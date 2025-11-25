"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface DreamBlockProps {
  dreamSummary?: string | null;
  accessLevel: "preview" | "full";
  fullContent?: {
    imageSymbol?: string | null; // 象义说明（符号）
    symbol?: string | null; // 象义说明（兼容字段）
    trend?: string | null; // 趋势/吉凶预兆
    meaning?: string | null; // 含义（吉凶）
    advice?: string[]; // 化解建议
    suggestions?: string[]; // 建议（兼容字段）
  } | null;
  delay?: number;
  locale?: "zh" | "en";
  reportId?: string | null;
  notice?: string | null;
  onUnlock?: () => void;
}

export default function DreamBlock({
  dreamSummary,
  accessLevel,
  fullContent,
  delay = 0.25,
  locale = "zh",
  reportId,
  notice = null,
  onUnlock = () => {},
}: DreamBlockProps) {
  const isFull = accessLevel === "full";
  const t =
    locale === "zh"
      ? {
          title: "梦境简批",
        }
      : {
          title: "Dream Brief",
        };

  const renderSummarySection = (withLock: boolean) => (
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
      <div className="report-content space-y-5">
        <div className="locked-preview-body px-6 md:px-10 py-6 space-y-3">
          {notice && (
            <p className="text-sm text-light-secondary">{notice}</p>
          )}
          {dreamSummary && (
            <p className="text-sm text-light-secondary">{dreamSummary}</p>
          )}
          {!dreamSummary && !notice && (
            <p className="text-sm text-light-secondary">
              {locale === "zh" ? "本次梦境数据暂未生成完整洞察，可在下一次记录更详细的梦境内容。" : "Dream insight not fully generated this time. Try recording more detailed dream content next time."}
            </p>
          )}
        </div>

        {withLock && (
          <div className="locked-preview-card">
            <div className="locked-overlay-header">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC857">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              <span className="locked-overlay-title">
                {locale === "zh" ? "梦境象意与化解方案" : "Dream Symbols & Remedies"}
              </span>
            </div>
            <div className="locked-overlay-body">
              {locale === "zh"
                ? "解读周公经典象意、吉凶趋势与身心对应联动，附化解建议。"
                : "Get classical symbolism, omen trends, and mind-body guidance with remedies."}
            </div>
            <button type="button" className="locked-overlay-cta" onClick={onUnlock}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm2 10v4h-4v-4h4zm-3-5V7a1 1 0 012 0v3h-2z"/>
              </svg>
              {locale === "zh" ? "解锁梦境详情" : "Unlock dream details"}
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );

  const hasPreviewData = !!dreamSummary || !!notice;

  if (isFull && fullContent) {
    // 付费用户：显示预览 + 完整内容（周公解梦风格：象意学、符号、吉凶、预兆）
    const symbolText = fullContent.imageSymbol ?? fullContent.symbol ?? null;
    const trendText = fullContent.trend ?? null;
    const meaningText = fullContent.meaning ?? null;
    const adviceList = fullContent.advice ?? fullContent.suggestions ?? [];
    // 如果预览数据存在，先显示预览部分；否则直接显示详细部分

    return (
      <>
        {hasPreviewData && renderSummarySection(false)}
        <motion.section
          variants={fadeUp(delay + 0.05)}
          initial="hidden"
          animate="visible"
          className="report-section"
        >
          <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2 text-light-primary">
            <span className="w-1 h-4 bg-accent-gold rounded-full"></span>
            {locale === "zh" ? "梦境深度解梦" : "Deep Dream Interpretation"}
          </h2>
          <div className="report-content space-y-4">
            {/* 象义说明（符号） */}
            {symbolText && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "象义说明" : "Symbolic Meaning"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{symbolText}</p>
              </div>
            )}

            {/* 吉凶预兆 */}
            {meaningText && (
              <div className="rounded-xl border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/5 to-accent-gold/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-gold">
                  {locale === "zh" ? "吉凶预兆" : "Fortune Omen"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{meaningText}</p>
              </div>
            )}

            {/* 趋势提醒 */}
            {trendText && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "趋势提醒" : "Trend Reminder"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-light-primary">{trendText}</p>
              </div>
            )}

            {/* 化解建议 */}
            {adviceList.length > 0 && (
              <div className="rounded-xl border border-card-border-light bg-mystic-secondary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-light-highlight">
                  {locale === "zh" ? "化解建议" : "Resolution Suggestions"}
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-light-primary">
                  {adviceList.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-light-highlight" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>
      </>
    );
  }

  if (isFull) {
    return hasPreviewData ? renderSummarySection(false) : null;
  }

  // 未付费用户：显示预览（已包含锁定覆盖层）
  return renderSummarySection(true);
}

