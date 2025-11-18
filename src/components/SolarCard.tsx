// 调整今日气运指数文案与配色，使节气与宜忌更准确
"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { getSolarTerm } from "@/utils/solarTerm";
import { getFullLunarDate } from "@/lib/lunar/calendar";
import { getHuangli } from "@/utils/huangli";
import { getSolarTermByDate, getSolarTermStartDate } from "@/lib/solar/simple";

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

// 计算节气天数（从节气开始日期到当前日期的天数）
function getDaysSinceSolarTermStart(currentDate: Date, termCode: string): number | null {
  try {
    const year = currentDate.getFullYear();
    const termStartDate = getSolarTermStartDate(year, termCode);
    
    if (termStartDate) {
      termStartDate.setHours(0, 0, 0, 0);
      const current = new Date(currentDate);
      current.setHours(0, 0, 0, 0);
      const diffTime = current.getTime() - termStartDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays + 1 : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function SolarCard({ locale, name, doList, avoidList, healthTip, element, isLite }: SolarCardProps) {
  const [lunarDate, setLunarDate] = useState<string>("");
  const [huangliData, setHuangliData] = useState<{ yi: string[]; ji: string[]; wuxing?: string } | null>(null);

  // 使用工具函数获取节气名称（始终使用工具函数，忽略传入的 name prop）
  const currentDate = useMemo(() => new Date(), []);
  const solarTermName = useMemo(() => {
    try {
      // 始终使用工具函数 getSolarTerm() 获取准确的节气名称
      return getSolarTerm(currentDate);
    } catch (error) {
      console.error("[SolarCard] Failed to get solar term:", error);
      // 只有在工具函数失败时才使用传入的 name
      return name ?? (locale === "zh" ? "今日节气" : "Current Solar Term");
    }
  }, [currentDate, locale, name]); // 添加 name 到依赖数组以消除警告（虽然实际不使用）

  useEffect(() => {
    try {
      const today = new Date();
      // 使用工具函数获取完整的农历日期（如"二〇二四年十月十八"）
      const fullLunar = getFullLunarDate(today);
      // 提取月份和日期部分（如"十月十八"）
      // 匹配格式：X月X日 或 X月X号
      const lunarMatch = fullLunar.match(/([一二三四五六七八九十]+月[一二三四五六七八九十]+[日号])/);
      if (lunarMatch && lunarMatch[1]) {
        setLunarDate(lunarMatch[1]);
      } else if (fullLunar) {
        // 如果正则匹配失败，尝试直接使用完整字符串
        // 或者提取最后一部分（月份+日期）
        const parts = fullLunar.split(/年/);
        if (parts.length > 1) {
          setLunarDate(parts[parts.length - 1]);
        } else {
          setLunarDate(fullLunar);
        }
      } else {
        setLunarDate("");
      }
      
      // 使用工具函数获取黄历数据
      const huangli = getHuangli(today);
      setHuangliData({
        yi: huangli.yi || [],
        ji: huangli.ji || [],
        wuxing: huangli.wuxing || "",
      });
    } catch (error) {
      console.error("[SolarCard] Failed to get lunar/huangli info:", error);
      setLunarDate("");
      setHuangliData(null);
    }
  }, []);

  const gradient = SCENE_GRADIENT[solarTermName] ?? LIGHT_SCENE_GRADIENT;
  const elementColor =
    (element && ELEMENT_COLOR[element]) ||
    (element && ELEMENT_COLOR[element.toLowerCase()]) ||
    "rgba(76,95,215,0.35)";
  const elementLabel =
    (element && (ELEMENT_LABEL[locale][element] || ELEMENT_LABEL[locale][element.toLowerCase()])) ||
    ELEMENT_LABEL[locale].default;

  // 计算节气天数
  const currentTermCode = useMemo(() => getSolarTermByDate(currentDate), [currentDate]);
  const daysSinceStart = useMemo(() => getDaysSinceSolarTermStart(currentDate, currentTermCode), [currentDate, currentTermCode]);
  const titleWithDays = daysSinceStart 
    ? `${solarTermName} · 第${daysSinceStart}天`
    : solarTermName;

  // 固定文案（作为备用）
  const fixedDoList = locale === "zh" 
    ? ["签约合作", "学习进修", "整理空间"]
    : ["Sign contracts", "Study & learn", "Organize space"];
  const fixedAvoidList = locale === "zh"
    ? ["动土破土", "长途迁移"]
    : ["Groundbreaking", "Long relocation"];

  // 优先使用 getHuangli() 返回的数据，如果没有或为空则使用固定文案
  const safeDo = (huangliData?.yi && huangliData.yi.length > 0) 
    ? huangliData.yi 
    : fixedDoList;
  const safeAvoid = (huangliData?.ji && huangliData.ji.length > 0)
    ? huangliData.ji
    : fixedAvoidList;

  const liteDo = isLite ? safeDo.slice(0, 1) : safeDo;
  const liteAvoid = isLite ? safeAvoid.slice(0, 1) : safeAvoid;

  // 五行信息：如果 getHuangli() 返回的 wuxing 为空，使用固定文案
  const wuxingText = (huangliData?.wuxing && huangliData.wuxing.trim()) 
    ? huangliData.wuxing 
    : (locale === "zh" ? "水旺・金强・火衰・木弱" : "");

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "rgba(35,64,53,0.7)", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.05em" }}>
              {locale === "zh" ? "今日养生节气" : "Today's Seasonal Focus"}
            </span>
            {lunarDate && (
              <span style={{ color: "rgba(35,64,53,0.6)", fontSize: "0.6rem" }}>
                {locale === "zh" ? `农历 ${lunarDate}` : `Lunar ${lunarDate}`}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#234035", lineHeight: 1.2 }}>
            {titleWithDays} <span style={{ fontSize: "0.7rem", color: "#ff0000", fontWeight: "bold" }}>【调试标记XYZ-133ecc5e】</span>
          </h2>
          {/* 五行提示 */}
          {locale === "zh" && wuxingText && (
            <span style={{ fontSize: "0.65rem", color: "rgba(35,64,53,0.6)", marginTop: "0.1rem" }}>
              今日五行：{wuxingText}
            </span>
          )}
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

      {/* 节气描述：固定为"阴增阳退，宜收敛能量，稳中求进。" */}
      <p style={{ margin: 0, color: "rgba(35,64,53,0.78)", lineHeight: 1.4, fontSize: "0.75rem" }}>
        {locale === "zh" ? "阴增阳退，宜收敛能量，稳中求进。" : "Yin increases, yang retreats. Gather energy and progress steadily."}
      </p>

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
          accent="#E8F5E9"
          icon="🌿"
          isLite={isLite}
          hint={locale === "zh" ? "适合稳步推进、复盘与学习" : "Suitable for steady progress, review and learning"}
        />
        <AdviceBlock
          locale={locale}
          title={locale === "zh" ? "忌" : "Avoid"}
          items={liteAvoid}
          accent="#FFF3E0"
          icon="⚠️"
          isLite={isLite}
          hint={locale === "zh" ? "今日不宜大动土、远距离搬迁" : "Avoid major construction and long-distance relocation today"}
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
  hint?: string;
};

function AdviceBlock({ locale, title, items, accent, icon, isLite, hint }: AdviceBlockProps) {
  const emptyText = locale === "zh" ? "暂无建议" : "No entries";
  // 根据背景色计算边框色（如果是十六进制颜色）
  const borderColor = accent.startsWith("#") 
    ? accent 
    : accent.replace("0.15", "0.4");
  
  return (
    <motion.div
      style={{
        borderRadius: "10px",
        padding: "0.5rem 0.7rem",
        background: accent,
        border: `1px solid ${borderColor}`,
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
      {hint && (
        <span style={{ fontSize: "0.65rem", color: "rgba(35,64,53,0.65)", fontStyle: "italic", marginTop: "0.1rem" }}>
          {hint}
        </span>
      )}
      {isLite && items.length > 0 && !hint ? (
        <span style={{ fontSize: "0.65rem", color: "rgba(35,64,53,0.7)", fontStyle: "italic" }}>
          {locale === "zh" ? "解锁获取更多节气要点" : "Unlock to view full seasonal checklist"}
        </span>
      ) : null}
    </motion.div>
  );
}

