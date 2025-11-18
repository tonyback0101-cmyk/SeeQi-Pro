/**
 * 黄历工具
 * 获取今日宜忌、五行等信息
 */
import { getLunarInfo } from "@/lib/lunar/calendar";

export interface HuangliData {
  yi: string[]; // 宜
  ji: string[]; // 忌
  wuxing?: string; // 五行
  ganZhi?: string; // 干支
  zodiac?: string; // 生肖
}

/**
 * 获取指定日期的黄历信息
 * @param date 日期对象，默认为今天
 * @returns 黄历数据，包含宜、忌、五行等
 */
export function getHuangli(date: Date = new Date()): HuangliData {
  const info = getLunarInfo(date);
  return {
    yi: info.yi || [],
    ji: info.ji || [],
    ganZhi: info.ganZhi || "",
    zodiac: info.zodiac || "",
    // 五行信息可以从其他数据源获取，这里先返回空字符串
    wuxing: "",
  };
}

