/**
 * 农历和黄历工具
 * 使用 lunar-javascript 库
 */

import { Lunar } from "lunar-javascript";

export interface LunarInfo {
  lunarDate: string; // 农历日期，如 "十月十八"
  lunarYear: string; // 农历年份，如 "甲辰年"
  ganZhi: string; // 干支，如 "甲辰"
  zodiac: string; // 生肖，如 "龙"
  yi: string[]; // 宜
  ji: string[]; // 忌
}

/**
 * 获取指定日期的农历和黄历信息
 */
export function getLunarInfo(date: Date = new Date()): LunarInfo {
  try {
    const lunar = Lunar.fromDate(date);
    
    return {
      lunarDate: lunar.getDayInChinese(), // 如 "十八"
      lunarYear: lunar.getYearInChinese(), // 如 "甲辰年"
      ganZhi: lunar.getYearInGanZhi(), // 如 "甲辰"
      zodiac: lunar.getYearShengXiao(), // 如 "龙"
      yi: lunar.getDayYi(), // 宜
      ji: lunar.getDayJi(), // 忌
    };
  } catch (error) {
    console.error("[getLunarInfo] Failed to get lunar info:", error);
    // 返回默认值
    return {
      lunarDate: "",
      lunarYear: "",
      ganZhi: "",
      zodiac: "",
      yi: [],
      ji: [],
    };
  }
}

/**
 * 获取完整的农历日期字符串
 */
export function getFullLunarDate(date: Date = new Date()): string {
  try {
    const lunar = Lunar.fromDate(date);
    return lunar.toString(); // 如 "二〇二四年十月十八"
  } catch (error) {
    console.error("[getFullLunarDate] Failed:", error);
    return "";
  }
}

