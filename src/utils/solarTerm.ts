/**
 * 节气计算工具
 * 基于现有的 resolveSolarTermCode 函数
 */
import { resolveSolarTermCode } from "@/lib/solar/resolve";
import { getSolarTermInsight } from "@/data/solarTerms";

/**
 * 获取指定日期的节气名称
 * @param date 日期对象，默认为今天
 * @returns 节气名称，如 "立冬"、"小雪"、"冬至" 等
 */
export function getSolarTerm(date: Date = new Date()): string {
  const code = resolveSolarTermCode(date);
  const insight = getSolarTermInsight("zh", code as any);
  return insight.name;
}

