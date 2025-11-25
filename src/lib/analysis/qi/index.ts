/**
 * 气运分析模块统一导出
 */

export { inferQiRhythmV2 } from "./qiEngine";
export type { QiRhythmV2 } from "./types";

// 可选：导出其他工具函数
export { getCalendarData, getSolarTermName, getTodayAlmanac } from "./calendar";
export type { CalendarData, AlmanacInfo } from "./calendar";

// 导出气运规则函数（V2）
export {
  scorePalmForQiV2,
  scoreTongueForQiV2,
  scoreDreamForQiV2,
  scoreAlmanacForQiV2,
  scoreConstitutionForQiV2,
} from "./rules";
export type { PalmInsight, BodyTongue, DreamInsight } from "./types";
export * from "./qiConfig";

