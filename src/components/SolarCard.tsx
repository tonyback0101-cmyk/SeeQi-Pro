"use client";

import { motion } from "framer-motion";

type Locale = "zh" | "en";

type SolarCardProps = {
  locale: Locale;
  name: string | null;
  doList: string[];
  avoidList: string[];
  healthTip: string | null;
  element: string | null;
  isLite: boolean;
};

const ELEMENT_COLOR: Record<string, string> = {
  木: "#50816B",
  火: "#C66A3D",
  土: "#C2A05E",
  金: "#8D96B1",
  水: "#4F6FA6",
  wood: "#50816B",
  fire: "#C66A3D",
  earth: "#C2A05E",
  metal: "#8D96B1",
  water: "#4F6FA6",
};

const ELEMENT_LABEL: Record<Locale, Record<string, string>> = {
  zh: {
    木: "木 · 生长",
    火: "火 · 温阳",
    土: "土 · 调中",
    金: "金 · 肃杀",
    水: "水 · 涵养",
    default: "节气养生",
  },
  en: {
    wood: "Wood • Growth",
    fire: "Fire • Warmth",
    earth: "Earth • Balance",
    metal: "Metal • Clarity",
    water: "Water • Nourish",
    default: "Seasonal Wellness",
  },
};

const SCENE_GRADIENT: Record<string, [string, string]> = {
  立春: ["#E3F2FD", "#FFF3E0"],
  雨水: ["#DDEBF7", "#E6FFFA"],
  惊蛰: ["#F9F7E8", "#E8F5E9"],
  春分: ["#E8F5E9", "#FFF8E1"],
  清明: ["#E0F2F1", "#F3E5F5"],
  谷雨: ["#E1F5FE", "#FFF3E0"],
  立夏: ["#FFF3E0", "#FFE0B2"],
  小满: ["#F3E5F5", "#FFFDE7"],
  芒种: ["#FFFDE7", "#FFECB3"],
  夏至: ["#FFEBEE", "#FFF3E0"],
  小暑: ["#FFF8E1", "#FFF3E0"],
  大暑: ["#FFF3E0", "#FFCCBC"],
  立秋: ["#FFF3E0", "#E3F2FD"],
  处暑: ["#F3E5F5", "#E1F5FE"],
  白露: ["#E0F2F1", "#ECEFF1"],
  秋分: ["#ECEFF1", "#FFECB3"],
  寒露: ["#E1F5FE", "#ECEFF1"],
  霜降: ["#E8EAF6", "#F3E5F5"],
  立冬: ["#E8EAF6", "#E0F7FA"],
  小雪: ["#E0F7FA", "#E3F2FD"],
  大雪: ["#E3F2FD", "#F1F8E9"],
  冬至: ["#ECEFF1", "#E8EAF6"],
  小寒: ["#E1F5FE", "#E0F7FA"],
  大寒: ["#E0F7FA", "#ECEFF1"],
};

const LIGHT_SCENE_GRADIENT: [string, string] = ["#F8F9FA", "#F1F8E9"];

export default function SolarCard({ locale, name, doList, avoidList, healthTip, element, isLite }: SolarCardProps) {
  const resolvedName = name ?? (locale === "zh" ? "今日节气" : "Current Solar Term");
  const gradient = SCENE_GRADIENT[resolvedName] ?? LIGHT_SCENE_GRADIENT;
  const elementColor =
    (element && ELEMENT_COLOR[element]) ||
    (element && ELEMENT_COLOR[element.toLowerCase()]) ||
    "rgba(76,95,215,0.35)";
  const elementLabel =
    (element && (ELEMENT_LABEL[locale][element] || ELEMENT_LABEL[locale][element.toLowerCase()])) ||
    ELEMENT_LABEL[locale].default;

  const safeDo = Array.isArray(doList) ? (doList.filter(Boolean) as string[]) : [];
  const safeAvoid = Array.isArray(avoidList) ? (avoidList.filter(Boolean) as string[]) : [];

  const liteDo = isLite ? safeDo.slice(0, 1) : safeDo.slice(0, 3);
  const liteAvoid = isLite ? safeAvoid.slice(0, 1) : safeAvoid.slice(0, 3);

  return (
    <motion.div
      className="solar-card"
      style={{
        borderRadius: "14px",
        background: `linear-gradient(140deg, ${gradient[0]}, ${gradient[1]})`,
        border: "1px solid rgba(141, 174, 146, 0.25)",
        boxShadow: "0 8px 16px rgba(35, 64, 53, 0.06)",
        padding: "0.7rem 0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "100%",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1 }}>
          <span style={{ color: "rgba(35,64,53,0.7)", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.05em" }}>
            {locale === "zh" ? "今日养生节气" : "Today's Seasonal Focus"}
          </span>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#234035", lineHeight: 1.2 }}>{resolvedName}</h2>
        </div>
        <motion.span
          style={{
            padding: "0.25rem 0.7rem",
            borderRadius: 999,
            background: elementColor,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.65rem",
            boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
            whiteSpace: "nowrap",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {elementLabel}
        </motion.span>
      </header>

      {healthTip && (
        <p style={{ margin: 0, color: "rgba(35,64,53,0.78)", lineHeight: 1.4, fontSize: "0.75rem" }}>{healthTip}</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: "0.6rem",
        }}
      >
        <AdviceBlock
          locale={locale}
          title={locale === "zh" ? "宜" : "Recommended"}
          items={liteDo}
          accent="rgba(80,129,107,0.15)"
          icon="🌿"
          isLite={isLite}
        />
        <AdviceBlock
          locale={locale}
          title={locale === "zh" ? "忌" : "Avoid"}
          items={liteAvoid}
          accent="rgba(198,105,105,0.15)"
          icon="⚠️"
          isLite={isLite}
        />
      </div>

      {isLite && (
        <p style={{ margin: 0, color: "rgba(76,95,215,0.75)", fontWeight: 600, fontSize: "0.7rem" }}>
          {locale === "zh" ? "解锁可查看完整节气饮食、作息与穴位指导。" : "Unlock to reveal full diet, routine and acupoint guidance."}
        </p>
      )}
    </motion.div>
  );
}

type AdviceBlockProps = {
  locale: Locale;
  title: string;
  items: string[];
  accent: string;
  icon: string;
  isLite: boolean;
};

function AdviceBlock({ locale, title, items, accent, icon, isLite }: AdviceBlockProps) {
  const emptyText = locale === "zh" ? "暂无建议" : "No entries";
  return (
    <motion.div
      style={{
        borderRadius: "10px",
        padding: "0.5rem 0.7rem",
        background: accent,
        border: `1px solid ${accent.replace("0.15", "0.4")}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <strong style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#234035", fontSize: "0.75rem" }}>
        <span style={{ fontSize: "0.8rem" }}>{icon}</span>
        {title}
      </strong>
      <ul style={{ margin: 0, paddingLeft: "0.75rem", color: "rgba(35,64,53,0.78)", display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.7rem", lineHeight: 1.3 }}>
        {items.length === 0 ? <li>{emptyText}</li> : null}
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {isLite && items.length > 0 ? (
        <span style={{ fontSize: "0.65rem", color: "rgba(35,64,53,0.7)", fontStyle: "italic" }}>
          {locale === "zh" ? "解锁获取更多节气要点" : "Unlock to view full seasonal checklist"}
        </span>
      ) : null}
    </motion.div>
  );
}

