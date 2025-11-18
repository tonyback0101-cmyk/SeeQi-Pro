/**
 * 农历转换工具
 * 基于现有的 getLunarInfo 函数
 */
import { getLunarInfo } from "@/lib/lunar/calendar";

/**
 * 将公历日期转换为农历
 * @param date 公历日期对象，默认为今天
 * @returns 农历日期字符串，如 "九月廿九"
 */
export function solarToLunar(date: Date = new Date()): string {
  const info = getLunarInfo(date);
  return info.lunarDate || "";
}

