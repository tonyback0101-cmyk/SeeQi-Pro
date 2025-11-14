"use client";

import { useEffect, useMemo, useState } from "react";
import { COLORS } from "@/lib/colors";
import type { HexagramMeta, IchingLine } from "@/lib/ichingGenerator";

type HexagramDisplayProps = {
  baseHexagram: HexagramMeta;
  lines: IchingLine[];
  changingHexagram?: HexagramMeta;
  locale?: "zh" | "en";
};

type ActiveLine = {
  index: number;
  line: IchingLine;
};

const lineLabels: Record<"zh" | "en", string[]> = {
  zh: ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"],
  en: ["1st line", "2nd line", "3rd line", "4th line", "5th line", "6th line"],
};

const instructions: Record<"zh" | "en", string> = {
  zh: "点击爻位查看详细解读，带 ✦ 的为变爻。",
  en: "Tap a line for detailed insight. Lines marked ✦ are changing.",
};

function lineToSegments(line: IchingLine) {
  const isYang = line.type === "yang";
  const base = 80;
  const gap = 16;
  if (isYang) {
    return [
      { x: 10, width: base + gap },
      { x: 110, width: base + gap },
    ];
  }
  return [
    { x: 10, width: base },
    { x: 90, width: gap },
    { x: 130, width: base },
  ];
}

export default function HexagramDisplay({ baseHexagram, lines, changingHexagram, locale = "zh" }: HexagramDisplayProps) {
  const [active, setActive] = useState<ActiveLine | null>(null);
  const [renderedLines, setRenderedLines] = useState<number>(0);

  useEffect(() => {
    setRenderedLines(0);
    const timer = setInterval(() => {
      setRenderedLines((prev) => {
        if (prev >= lines.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(timer);
  }, [lines]);

  const renderedSegments = useMemo(() => lines.map((line) => lineToSegments(line)), [lines]);

  const activeText = active
    ? {
        title:
          locale === "zh"
            ? `${lineLabels[locale][active.index]} · ${active.line.isChanging ? "✦ 变爻" : active.line.type === "yang" ? "阳爻" : "阴爻"}`
            : `${lineLabels[locale][active.index]} · ${active.line.isChanging ? "✦ Changing" : active.line.type === "yang" ? "Yang" : "Yin"}`,
        classic: active.line.traditionalMeaning,
        modern: active.line.modernReflection,
      }
    : null;

  const panelTitle = locale === "zh" ? `${baseHexagram.name}卦` : `${baseHexagram.name} Hexagram`;
  const hexagramName = `${baseHexagram.name} · ${baseHexagram.description}`;
  const changingName = changingHexagram ? `${changingHexagram.name} · ${changingHexagram.description}` : null;

  return (
    <div className="hexagram">
      <div className="hexagram__visual">
        <svg viewBox="0 0 220 300" className="hexagram__svg" role="presentation">
          {renderedSegments.map((segments, index) => {
            const line = lines[index];
            const isVisible = renderedLines > index;
            const y = 270 - index * 40;
            const isActive = active?.index === index;
            return (
              <g key={line.position} className="hexagram__lineGroup" onClick={() => setActive({ index, line })}>
                <title>{lineLabels[locale][index]}</title>
                {segments.map((segment, segIndex) => (
                  <rect
                    key={segIndex}
                    x={segment.x}
                    y={y}
                    width={segment.width}
                    height={20}
                    rx={8}
                    className={`hexagram__line${line.isChanging ? " hexagram__line--changing" : ""}${isActive ? " hexagram__line--active" : ""}`}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "scaleX(1)" : "scaleX(0.3)",
                      transformOrigin: `${segment.x + segment.width / 2}px ${y + 10}px`,
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                    }}
                  />
                ))}
                {line.isChanging && (
                  <text
                    x={segmentCenter(segments)}
                    y={y - 4}
                    className="hexagram__marker"
                    textAnchor="middle"
                  >
                    ✦
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="hexagram__meta">
          <h3>{panelTitle}</h3>
          <p className="hexagram__headline">{hexagramName}</p>
          <p className="hexagram__judgement">{baseHexagram.judgement}</p>
          <p className="hexagram__image">{baseHexagram.image}</p>
          {changingName && <p className="hexagram__changing">{locale === "zh" ? `之变：${changingName}` : `Transformed into: ${changingName}`}</p>}
          <p className="hexagram__instruction">{instructions[locale]}</p>
        </div>
      </div>

      <div className="hexagram__details" aria-live="polite">
        {activeText ? (
          <article className="hexagram__card">
            <h4>{activeText.title}</h4>
            <p className="hexagram__classic">{activeText.classic}</p>
            <p className="hexagram__modern">{activeText.modern}</p>
          </article>
        ) : (
          <article className="hexagram__card hexagram__card--placeholder">
            <p>{locale === "zh" ? "选择任意爻位以查看传统与现代解读。" : "Select any line to view classical text and modern reflection."}</p>
          </article>
        )}
      </div>

      <style jsx>{`
        .hexagram {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hexagram__visual {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1.5rem;
          align-items: start;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          padding: 1.8rem;
          box-shadow: 0 22px 40px rgba(45, 64, 51, 0.12);
        }

        .hexagram__svg {
          width: 100%;
          max-width: 240px;
        }

        .hexagram__line {
          fill: rgba(44, 62, 48, 0.78);
          cursor: pointer;
        }

        .hexagram__lineGroup {
          touch-action: manipulation;
        }

        .hexagram__line--changing {
          fill: rgba(198, 169, 105, 0.78);
        }

        .hexagram__line--active {
          fill: #fff;
          stroke: ${COLORS.primary.qingzhu};
          stroke-width: 2;
        }

        .hexagram__marker {
          fill: ${COLORS.secondary.gold};
          font-size: 1rem;
        }

        .hexagram__meta {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          color: ${COLORS.text.darkBrown};
        }

        .hexagram__meta h3 {
          margin: 0;
          font-size: 1.4rem;
          color: ${COLORS.primary.qingzhu};
        }

        .hexagram__headline {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
        }

        .hexagram__judgement {
          margin: 0;
          font-style: italic;
          color: rgba(72, 66, 53, 0.85);
        }

        .hexagram__changing {
          margin: 0;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          background: rgba(198, 169, 105, 0.12);
          color: ${COLORS.secondary.gold};
          font-weight: 600;
        }

        .hexagram__instruction {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: rgba(72, 66, 53, 0.65);
        }

        .hexagram__details {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }

        .hexagram__card {
          background: rgba(255, 255, 255, 0.92);
          border-radius: 20px;
          padding: 1.6rem;
          box-shadow: 0 18px 32px rgba(45, 64, 51, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .hexagram__card--placeholder {
          color: rgba(72, 66, 53, 0.65);
        }

        .hexagram__card h4 {
          margin: 0;
          font-size: 1.2rem;
          color: ${COLORS.primary.qingzhu};
        }

        .hexagram__classic {
          margin: 0;
          color: ${COLORS.text.darkBrown};
        }

        .hexagram__modern {
          margin: 0;
          padding: 0.9rem 1rem;
          border-left: 4px solid ${COLORS.primary.qingzhu};
          background: rgba(141, 174, 146, 0.12);
          border-radius: 12px;
          color: ${COLORS.text.darkGreen};
        }

        @media (max-width: 960px) {
          .hexagram__visual {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hexagram__meta {
            align-items: center;
          }
        }

        @media print {
          .hexagram__visual {
            box-shadow: none;
            background: transparent;
          }
          .hexagram__card {
            box-shadow: none;
            background: transparent;
          }
        }
      `}</style>
    </div>
  );
}

function segmentCenter(segments: { x: number; width: number }[]) {
  const totalWidth = segments.reduce((sum, segment) => sum + segment.width, 0);
  const minX = Math.min(...segments.map((segment) => segment.x));
  return minX + totalWidth / 2;
}
