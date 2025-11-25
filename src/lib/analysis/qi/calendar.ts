/**
 * 黄历数据 + 节气查找模块
 * 提供统一的黄历和节气数据接口
 */

import { getLunarInfo, LunarInfo } from "@/lib/lunar/calendar";
import { getSolarTermByDate } from "@/lib/solar/simple";

/**
 * 黄历信息接口
 */
export interface AlmanacInfo {
  yi: string[];       // 宜
  ji: string[];       // 忌
  lunarTerm: string;  // 今日所属节气，如：立春/惊蛰/小暑/霜降
}

/**
 * 获取节气中文名称
 */
export function getSolarTermName(code: string): string {
  const termNames: Record<string, string> = {
    lichun: "立春",
    yushui: "雨水",
    jingzhe: "惊蛰",
    chunfen: "春分",
    qingming: "清明",
    guyu: "谷雨",
    lixia: "立夏",
    xiaoman: "小满",
    mangzhong: "芒种",
    xiazhi: "夏至",
    xiaoshu: "小暑",
    dashu: "大暑",
    liqiu: "立秋",
    chushu: "处暑",
    bailu: "白露",
    qiufen: "秋分",
    hanlu: "寒露",
    shuangjiang: "霜降",
    lidong: "立冬",
    xiaoxue: "小雪",
    daxue: "大雪",
    dongzhi: "冬至",
    xiaohan: "小寒",
    dahan: "大寒",
  };
  return termNames[code] || "";
}

/**
 * 获取指定日期的黄历和节气信息
 */
export interface CalendarData {
  lunarInfo: LunarInfo;
  solarTerm: string | null;
  solarTermName: string | null;
}

export function getCalendarData(date: Date = new Date()): CalendarData {
  let lunarInfo: LunarInfo;
  let solarTerm: string | null = null;
  let solarTermName: string | null = null;

  try {
    lunarInfo = getLunarInfo(date);
    solarTerm = getSolarTermByDate(date);
    solarTermName = solarTerm ? getSolarTermName(solarTerm) : null;
  } catch (error) {
    console.warn("[getCalendarData] Failed to get lunar/solar info:", error);
    lunarInfo = {
      lunarDate: "",
      lunarYear: "",
      ganZhi: "",
      zodiac: "",
      yi: [],
      ji: [],
    };
  }

  return {
    lunarInfo,
    solarTerm,
    solarTermName,
  };
}

/**
 * 获取今日的黄历数据
 * 优先使用项目已有的黄历库（lunar-javascript），若无依赖库则使用静态 almanac.json
 */
export function getTodayAlmanac(date: Date = new Date()): AlmanacInfo {
  try {
    // 优先使用项目已有的黄历库（lunar-javascript）
    const lunarInfo = getLunarInfo(date);
    const solarTermCode = getSolarTermByDate(date);
    const lunarTerm = solarTermCode ? getSolarTermName(solarTermCode) : "";

    return {
      yi: lunarInfo.yi || [],
      ji: lunarInfo.ji || [],
      lunarTerm: lunarTerm || "",
    };
  } catch (error) {
    console.warn("[getTodayAlmanac] Failed to get almanac from library, trying static data:", error);
    
    // 降级：使用静态 almanac.json 数据
    return getAlmanacFromStatic(date);
  }
}

/**
 * 从静态 almanac.json 获取黄历数据（降级方案）
 * 注意：此函数在 Node.js 环境中运行（API 路由），可以使用 require
 */
function getAlmanacFromStatic(date: Date): AlmanacInfo {
  try {
    const dateKey = formatDateKey(date);
    
    // 动态导入静态数据（如果存在）
    // 在 Node.js 环境中使用 require，在客户端环境中需要不同的处理方式
    let almanacData: Record<string, AlmanacInfo> = {};
    
    try {
      // 尝试导入静态数据（如果文件存在）
      // 使用 require 在 Node.js 环境中是安全的
      // eslint-disable-next-line
      const staticData = require("@/data/almanac.json");
      almanacData = staticData as Record<string, AlmanacInfo>;
    } catch (importError) {
      // 如果导入失败，继续使用默认逻辑
      console.warn("[getAlmanacFromStatic] Static almanac.json not found, using fallback");
    }
    
    // 查找对应日期的数据
    const dayData = almanacData[dateKey];
    
    if (dayData) {
      return {
        yi: dayData.yi || [],
        ji: dayData.ji || [],
        lunarTerm: dayData.lunarTerm || "",
      };
    }
    
    // 如果没有找到对应日期的数据，至少返回节气信息
    const solarTermCode = getSolarTermByDate(date);
    const lunarTerm = solarTermCode ? getSolarTermName(solarTermCode) : "";
    
    return {
      yi: [],
      ji: [],
      lunarTerm: lunarTerm || "",
    };
  } catch (error) {
    console.error("[getAlmanacFromStatic] Failed to get static almanac:", error);
    // 最终降级：返回空数据
    return {
      yi: [],
      ji: [],
      lunarTerm: "",
    };
  }
}

/**
 * 格式化日期为 YYYY-MM-DD 格式（用于 almanac.json 的 key）
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

