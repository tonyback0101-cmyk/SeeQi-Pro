/**
 * 使用准确的节气计算算法
 * 基于天文计算，参考万年历数据
 */
import { resolveSolarTermCodeImproved } from "./accurate";

// 保留旧的固定日期边界作为备用（仅用于向后兼容）
const SOLAR_TERM_BOUNDARIES = [
  { code: "xiaohan", month: 1, day: 5 },
  { code: "dahan", month: 1, day: 20 },
  { code: "lichun", month: 2, day: 4 },
  { code: "yushui", month: 2, day: 19 },
  { code: "jingzhe", month: 3, day: 5 },
  { code: "chunfen", month: 3, day: 20 },
  { code: "guyu", month: 4, day: 4 },
  { code: "lixia", month: 5, day: 5 },
  { code: "xiaoman", month: 5, day: 20 },
  { code: "mangzhong", month: 6, day: 5 },
  { code: "xiazhi", month: 6, day: 21 },
  { code: "xiaoshu", month: 7, day: 6 },
  { code: "dashu", month: 7, day: 22 },
  { code: "liqiu", month: 8, day: 7 },
  { code: "chushu", month: 8, day: 23 },
  { code: "bailu", month: 9, day: 7 },
  { code: "qiufen", month: 9, day: 23 },
  { code: "hanlu", month: 10, day: 8 },
  { code: "shuangjiang", month: 10, day: 23 },
  { code: "lidong", month: 11, day: 7 },
  { code: "xiaoxue", month: 11, day: 22 },
  { code: "daxue", month: 12, day: 7 },
  { code: "dongzhi", month: 12, day: 21 },
];

/**
 * 解析节气代码（使用改进的算法）
 * 优先使用基于天文计算的准确算法
 */
export function resolveSolarTermCode(date: Date): string {
  try {
    // 使用改进的算法
    return resolveSolarTermCodeImproved(date);
  } catch (error) {
    console.warn("[resolveSolarTermCode] Improved algorithm failed, using fallback:", error);
    // 如果改进算法失败，使用旧的固定日期方法作为备用
    return resolveSolarTermCodeFallback(date);
  }
}

/**
 * 备用方法：使用固定日期边界（向后兼容）
 */
function resolveSolarTermCodeFallback(date: Date): string {
  const year = date.getUTCFullYear();

  const getBoundaryDate = (month: number, day: number, yearOffset = 0) =>
    Date.UTC(year + yearOffset, month - 1, day);

  const boundaries = SOLAR_TERM_BOUNDARIES.map((item) => ({
    code: item.code,
    timestamp: getBoundaryDate(item.month, item.day),
  })).sort((a, b) => a.timestamp - b.timestamp);

  const targetTime = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());

  // Handle days before the first boundary (use last term of previous year)
  if (targetTime < boundaries[0].timestamp) {
    const last = SOLAR_TERM_BOUNDARIES[SOLAR_TERM_BOUNDARIES.length - 1];
    return last.code;
  }

  let current = boundaries[0].code;
  for (const boundary of boundaries) {
    if (targetTime >= boundary.timestamp) {
      current = boundary.code;
    } else {
      break;
    }
  }

  return current;
}

