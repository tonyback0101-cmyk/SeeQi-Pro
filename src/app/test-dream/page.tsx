"use client";

import { useEffect, useState } from "react";
import { analyzeDream } from "@/lib/analysis/dreamAnalyzer";
import type { DreamAnalysisResult } from "@/lib/analysis/dreamAnalyzer";
import { COLORS } from "@/lib/colors";

const PRESETS = [
  { text: "我梦见发洪水把我淹没，最后我飞到了天空", emotion: "fear" },
  { text: "梦见蛇蜕皮，紧接着小孩笑着跑向我", emotion: "joy" },
  { text: "梦见在学校考试迟到，被老师追问成绩", emotion: "anxiety" },
  { text: "梦见壁虎停在墙上提醒我注意细节", emotion: "calm" },
];

const EMOTIONS = [
  { value: "joy", label: "喜悦 / Joy" },
  { value: "fear", label: "恐惧 / Fear" },
  { value: "confusion", label: "困惑 / Confusion" },
  { value: "calm", label: "平静 / Calm" },
  { value: "anger", label: "愤怒 / Anger" },
  { value: "sadness", label: "悲伤 / Sadness" },
  { value: "hope", label: "希望 / Hope" },
  { value: "anxiety", label: "焦虑 / Anxiety" },
  { value: "unknown", label: "中性 / Neutral" },
];

export default function TestDreamPage() {
  const [locale, setLocale] = useState<"zh" | "en">("zh");
  const [text, setText] = useState(PRESETS[0].text);
  const [emotion, setEmotion] = useState(PRESETS[0].emotion);
  const [result, setResult] = useState<DreamAnalysisResult>(() => analyzeDream(PRESETS[0].text, PRESETS[0].emotion, "zh"));

  useEffect(() => {
    setResult(analyzeDream(text, emotion, locale));
  }, [text, emotion, locale]);

  const handleShare = async () => {
    const shareData = {
      title: locale === "zh" ? "SeeQi 梦境解析" : "SeeQi Dream Insight",
      text: result.summary,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        alert(locale === "zh" ? "解析摘要已复制，可手动分享。" : "Summary copied to clipboard for manual sharing.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seeqi-dream-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <section className="card">
        <div className="header">
          <h1>{locale === "zh" ? "梦境解析测试页面" : "Dream Analysis Playground"}</h1>
          <div className="header__actions">
            <button type="button" className="secondary" onClick={() => setLocale((prev) => (prev === "zh" ? "en" : "zh"))}>
              {locale === "zh" ? "切换到 English" : "切换到 中文"}
            </button>
            <button type="button" className="secondary" onClick={handleShare}>
              {locale === "zh" ? "分享解析" : "Share"}
            </button>
            <button type="button" className="secondary" onClick={handleExport}>
              {locale === "zh" ? "导出 JSON" : "Export JSON"}
            </button>
          </div>
        </div>
        <p className="description">
          {locale === "zh"
            ? "输入梦境描述并选择情绪，查看 SeeQi 梦境解析引擎的实时结果。可使用下方面板查看关键词、五行倾向与个性化建议。"
            : "Enter a dream narrative and choose an emotion to preview SeeQi dream insights in real time. Panels below show keywords, five-element tendencies and personalized advice."}
        </p>

        <label className="field">
          <span>{locale === "zh" ? "梦境描述" : "Dream Narrative"}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            className="textarea"
            placeholder={
              locale === "zh"
                ? "请详细描述您的梦境...（例如：我梦见在森林中漫步，遇到一只白鹿）"
                : "Describe your dream in detail… (e.g. I wandered in a forest and met a white deer)"
            }
          />
          <span className="helper">
            {locale === "zh" ? `当前字数：${text.trim().length}` : `Characters: ${text.trim().length}`}
          </span>
        </label>

        <label className="field">
          <span>{locale === "zh" ? "情绪选择" : "Emotion"}</span>
          <select value={emotion} onChange={(event) => setEmotion(event.target.value)} className="select">
            {EMOTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="presets">
          <span>{locale === "zh" ? "测试用例：" : "Presets:"}</span>
          <div className="preset-list">
            {PRESETS.map((preset) => (
              <button
                key={preset.text}
                type="button"
                onClick={() => {
                  setText(preset.text);
                  setEmotion(preset.emotion);
                }}
              >
                {preset.text.slice(0, 12)}…
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={() => setResult(analyzeDream(text, emotion))}>
            解析梦境
          </button>
          <span className="hint">内容会实时解析，点击按钮可手动刷新。</span>
        </div>
      </section>

      <section className="card">
        <h2>解析概览</h2>
        <p className="summary">{result.summary}</p>
        <p className="insight">{result.culturalInsight}</p>
        <p className="interpretation">{result.interpretation}</p>
      </section>

      <section className="card">
        <h2>关键词与置信度</h2>
        <div className="tag-list">
          {result.symbolDetails.length ? (
            result.symbolDetails.map((detail) => (
              <div key={detail.key} className="tag">
                <span className="tag__title">{detail.meaning}</span>
                <span className="tag__meta">
                  信心 {Math.round((detail.intensity / 5) * 100)}% · 元素 {detail.element}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">暂未识别出经典梦境符号，请尝试补充细节。</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>情绪与五行</h2>
        <div className="intensity">
          <span>情感强度：{result.intensity} / 5</span>
          <div className="scale">
            {[1, 2, 3, 4, 5].map((level) => (
              <span key={level} className={level <= result.intensity ? "scale__dot scale__dot--active" : "scale__dot"} />
            ))}
          </div>
        </div>
        <div className="elements">
          {Object.entries(result.elements).map(([element, score]) => (
            <div key={element} className="element">
              <span className="element__label">{element}</span>
              <div className="bar">
                <div className="bar__fill" style={{ width: `${Math.min(score * 12, 100)}%` }} />
              </div>
              <span className="element__score">{score}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>符号解析</h2>
        <ul className="list">
          {result.symbolDetails.map((symbol) => (
            <li key={symbol.key}>
              <h4>{symbol.meaning}</h4>
              <p>【传统文化】{symbol.cultural}</p>
              <p>【心理洞察】{symbol.psychology}</p>
              <p>【建议】{symbol.advice}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>个性化建议</h2>
        <ul className="list">
          {result.advice.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <style jsx>{`
        .page {
          max-width: 1080px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.75rem;
        }
        .card {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 24px;
          padding: 1.9rem;
          box-shadow: 0 22px 42px rgba(45, 64, 51, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .card:first-of-type {
          grid-column: span 2;
        }
        .description {
          margin: 0;
          color: ${COLORS.text.darkBrown};
          line-height: 1.7;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          color: ${COLORS.text.darkGreen};
        }
        .textarea {
          width: 100%;
          border-radius: 18px;
          padding: 1rem 1.2rem;
          border: 1px solid rgba(141, 174, 146, 0.35);
          background: rgba(249, 247, 243, 0.9);
          font-size: 1rem;
          line-height: 1.7;
          min-height: 160px;
        }
        .select {
          border-radius: 12px;
          padding: 0.6rem 1rem;
          border: 1px solid rgba(141, 174, 146, 0.35);
          background: rgba(255, 255, 255, 0.9);
        }
        .helper {
          font-size: 0.85rem;
          color: rgba(72, 66, 53, 0.6);
        }
        .presets {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: ${COLORS.text.darkGreen};
        }
        .preset-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        .preset-list button {
          border: 1px solid rgba(141, 174, 146, 0.4);
          border-radius: 12px;
          padding: 0.45rem 0.85rem;
          background: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          color: ${COLORS.text.darkGreen};
          transition: background 0.2s ease;
        }
        .preset-list button:hover {
          background: rgba(141, 174, 146, 0.15);
        }
        .actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .primary {
          border: none;
          border-radius: 999px;
          padding: 0.75rem 1.8rem;
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, ${COLORS.secondary.gold});
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 18px 32px rgba(45, 64, 51, 0.22);
        }
        .hint {
          color: rgba(72, 66, 53, 0.62);
          font-size: 0.9rem;
        }
        .summary,
        .interpretation,
        .insight {
          margin: 0;
          color: ${COLORS.text.darkBrown};
          line-height: 1.6;
        }
        .tag-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .tag {
          padding: 0.75rem 1rem;
          border-radius: 16px;
          background: rgba(141, 174, 146, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .tag__title {
          color: ${COLORS.text.darkGreen};
          font-weight: 600;
        }
        .tag__meta {
          font-size: 0.9rem;
          color: rgba(72, 66, 53, 0.65);
        }
        .muted {
          margin: 0;
          color: rgba(72, 66, 53, 0.6);
        }
        .intensity {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .scale {
          display: flex;
          gap: 0.4rem;
        }
        .scale__dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(141, 174, 146, 0.2);
        }
        .scale__dot--active {
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, ${COLORS.secondary.gold});
        }
        .elements {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .element {
          display: grid;
          grid-template-columns: 70px 1fr 36px;
          gap: 0.6rem;
          align-items: center;
        }
        .element__label {
          color: ${COLORS.text.darkGreen};
          font-weight: 600;
        }
        .bar {
          height: 6px;
          border-radius: 999px;
          background: rgba(141, 174, 146, 0.2);
          overflow: hidden;
        }
        .bar__fill {
          height: 100%;
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, ${COLORS.secondary.gold});
        }
        .element__score {
          text-align: right;
          color: ${COLORS.text.darkBrown};
        }
        .list {
          margin: 0;
          padding-left: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          color: ${COLORS.text.darkBrown};
        }
        @media (max-width: 900px) {
          .page {
            grid-template-columns: 1fr;
          }
          .card:first-of-type {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
