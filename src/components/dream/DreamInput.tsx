"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS } from "@/lib/colors";

type DreamInputProps = {
  value: string;
  onChange: (value: string) => void;
  onAnalyze?: () => void;
  onSample?: () => void;
  minLength?: number;
  locale?: "zh" | "en";
};

const commonMotifs: Record<"zh" | "en", string[]> = {
  zh: ["飞翔", "迷宫", "雨夜", "旧友", "大海", "星光"],
  en: ["Flight", "Maze", "Rainy night", "Old friend", "Ocean", "Starlight"],
};

const emotionHints: Record<"zh" | "en", { label: string; keywords: string[] }[]> = {
  zh: [
    { label: "松弛", keywords: ["柔软", "暖", "花", "微笑"] },
    { label: "焦虑", keywords: ["追赶", "黑暗", "迷路", "坠落"] },
    { label: "未知", keywords: ["陌生", "雾", "门", "镜子"] },
  ],
  en: [
    { label: "Calm", keywords: ["soft", "warm", "garden", "smile"] },
    { label: "Anxious", keywords: ["chasing", "dark", "lost", "fall"] },
    { label: "Uncertain", keywords: ["strange", "fog", "door", "mirror"] },
  ],
};

const sampleDreams: Record<"zh" | "en", string> = {
  zh: "我在一座灯光柔和的图书馆追寻一本失落的手稿，窗外细雨不停，旧友在远处向我挥手。",
  en: "I wandered through a lantern-lit library searching for a missing manuscript while gentle rain tapped the windows and an old friend waved from afar.",
};

export default function DreamInput({
  value,
  onChange,
  onAnalyze,
  onSample,
  minLength = 30,
  locale = "zh",
}: DreamInputProps) {
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const motifs = commonMotifs[locale];
  const emotionConfig = emotionHints[locale];

  const wordCount = useMemo(() => {
    if (!value.trim()) return 0;
    return locale === "zh" ? value.trim().length : value.trim().split(/\s+/).length;
  }, [value, locale]);

  const activeEmotion = useMemo(() => {
    if (!value.trim()) return null;
    const text = value.toLowerCase();
    return (
      emotionConfig.find((group) => group.keywords.some((keyword) => text.includes(keyword))) ?? null
    );
  }, [value, emotionConfig]);

  const isValid = value.trim().length >= minLength;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 180), 420)}px`;
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!touched) setTouched(true);
    onChange(event.target.value);
  };

  const handleMotifAppend = (motif: string) => {
    const separator = value.endsWith(" ") || value.endsWith("，") || value.length === 0 ? "" : locale === "zh" ? "，" : ", ";
    onChange(`${value}${separator}${motif}`);
  };

  const handleSample = () => {
    const sampleText = sampleDreams[locale];
    onChange(sampleText);
    onSample?.();
  };

  return (
    <div className="dream-input">
      <div className="dream-input__header">
        <span className="dream-input__counter">
          {locale === "zh" ? `字数：${wordCount}` : `Word count: ${wordCount}`}
        </span>
        {activeEmotion && (
          <span className="dream-input__emotion">
            {locale === "zh" ? `情绪倾向：${activeEmotion.label}` : `Emotional tone: ${activeEmotion.label}`}
          </span>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={locale === "zh" ? "请描述你的梦境细节..." : "Describe the details of your dream..."}
        rows={8}
        className="dream-input__textarea"
      />

      <div className="dream-input__actions">
        <div className="dream-input__motifs">
          {motifs.map((motif) => (
            <button
              key={motif}
              type="button"
              className="dream-input__motifButton"
              onClick={() => handleMotifAppend(motif)}
            >
              {motif}
            </button>
          ))}
        </div>
        <div className="dream-input__utility">
          <button type="button" className="dream-input__utilityButton" onClick={handleSample}>
            {locale === "zh" ? "示例" : "Sample"}
          </button>
          <button
            type="button"
            className="dream-input__utilityButton"
            onClick={() => onChange("")}
            disabled={!value.trim()}
          >
            {locale === "zh" ? "清空" : "Clear"}
          </button>
          <button
            type="button"
            className="dream-input__analyze"
            onClick={onAnalyze}
            disabled={!isValid}
          >
            {locale === "zh" ? "解析梦境" : "Analyze"}
          </button>
        </div>
      </div>

      {!isValid && touched && (
        <p className="dream-input__error">
          {locale === "zh"
            ? `请至少输入 ${minLength} 字文字，描述具体场景或感受。`
            : `Please provide at least ${minLength} characters with concrete scenery or feelings.`}
        </p>
      )}

      <style jsx>{`
        .dream-input {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dream-input__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: rgba(72, 66, 53, 0.75);
        }

        .dream-input__emotion {
          color: ${COLORS.secondary.gold};
          font-weight: 600;
        }

        .dream-input__textarea {
          width: 100%;
          background: rgba(249, 247, 243, 0.9);
          border-radius: 18px;
          padding: 1.2rem 1.4rem;
          border: 1px solid rgba(141, 174, 146, 0.35);
          resize: vertical;
          min-height: 180px;
          font-size: 1.05rem;
          line-height: 1.7;
          color: ${COLORS.text.darkGreen};
          box-shadow: inset 0 1px 3px rgba(44, 62, 48, 0.08);
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .dream-input__textarea:focus {
          outline: none;
          border-color: ${COLORS.primary.qingzhu};
          box-shadow: 0 0 0 3px rgba(141, 174, 146, 0.18);
        }

        .dream-input__actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dream-input__motifs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .dream-input__motifButton {
          border: none;
          border-radius: 12px;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          background: rgba(140, 122, 230, 0.08);
          color: ${COLORS.text.darkGreen};
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s ease;
          touch-action: manipulation;
        }

        .dream-input__motifButton:hover {
          background: rgba(140, 122, 230, 0.18);
        }

        .dream-input__utility {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          justify-content: flex-end;
        }

        .dream-input__utilityButton {
          border: 1px solid rgba(141, 174, 146, 0.4);
          background: rgba(255, 255, 255, 0.7);
          border-radius: 999px;
          padding: 0.6rem 1.35rem;
          min-height: 44px;
          color: ${COLORS.text.darkGreen};
          font-weight: 600;
          cursor: pointer;
        }

        .dream-input__utilityButton:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .dream-input__analyze {
          border: none;
          border-radius: 999px;
          padding: 0.75rem 2.1rem;
          min-height: 48px;
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, #7A9D7F);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(122, 157, 127, 0.28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .dream-input__analyze:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .dream-input__error {
          margin: 0;
          font-size: 0.85rem;
          color: #d97757;
        }

        @media (max-width: 640px) {
          .dream-input__utility {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
