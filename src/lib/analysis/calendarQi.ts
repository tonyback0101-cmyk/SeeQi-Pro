import { Lunar } from "lunar-javascript";

export interface CalendarQiInfo {
  solarTerm?: string;
  yi: string[];
  ji: string[];
  lunarDate: string;
  dayGanzhi: string;
}

export function getCalendarQiInfo(date: Date = new Date()): CalendarQiInfo {
  try {
    const lunar = Lunar.fromDate(date);

    // 获取节气
    const solarTerm = lunar.getJieQi();

    // 获取宜忌（使用正确的方法名）
    const yi = lunar.getDayYi().map((s: string) => s.replace(/、/g, "").trim());
    const ji = lunar.getDayJi().map((s: string) => s.replace(/、/g, "").trim());

    return {
      solarTerm,
      yi,
      ji,
      lunarDate: lunar.toString(),
      dayGanzhi: lunar.getDayInGanZhi(),
    };
  } catch (error) {
    console.error("[getCalendarQiInfo] Failed to get calendar info:", error);
    // 返回默认值
    return {
      solarTerm: undefined,
      yi: [],
      ji: [],
      lunarDate: "",
      dayGanzhi: "",
    };
  }
}

