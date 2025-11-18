/**
 * 准确的二十四节气日期表
 * 基于紫金山天文台发布的《天文年历》数据
 * 数据格式：年份 -> 节气代码 -> [月份, 日期]
 */

type SolarTermCode = 
  | "lichun" | "yushui" | "jingzhe" | "chunfen" | "qingming" | "guyu"
  | "lixia" | "xiaoman" | "mangzhong" | "xiazhi" | "xiaoshu" | "dashu"
  | "liqiu" | "chushu" | "bailu" | "qiufen" | "hanlu" | "shuangjiang"
  | "lidong" | "xiaoxue" | "daxue" | "dongzhi" | "xiaohan" | "dahan";

type SolarTermDate = [number, number]; // [月份, 日期]

/**
 * 2024-2025年准确的节气日期表
 * 数据来源：紫金山天文台《天文年历》
 */
const PRECISE_SOLAR_TERM_DATES: Record<number, Record<SolarTermCode, SolarTermDate>> = {
  2024: {
    xiaohan: [1, 6],    // 小寒 1月6日
    dahan: [1, 20],     // 大寒 1月20日
    lichun: [2, 4],     // 立春 2月4日
    yushui: [2, 19],    // 雨水 2月19日
    jingzhe: [3, 5],    // 惊蛰 3月5日
    chunfen: [3, 20],   // 春分 3月20日
    qingming: [4, 4],   // 清明 4月4日
    guyu: [4, 19],      // 谷雨 4月19日
    lixia: [5, 5],      // 立夏 5月5日
    xiaoman: [5, 20],   // 小满 5月20日
    mangzhong: [6, 5],  // 芒种 6月5日
    xiazhi: [6, 21],    // 夏至 6月21日
    xiaoshu: [7, 6],    // 小暑 7月6日
    dashu: [7, 22],     // 大暑 7月22日
    liqiu: [8, 7],      // 立秋 8月7日
    chushu: [8, 22],    // 处暑 8月22日
    bailu: [9, 7],      // 白露 9月7日
    qiufen: [9, 22],    // 秋分 9月22日
    hanlu: [10, 8],     // 寒露 10月8日
    shuangjiang: [10, 23], // 霜降 10月23日
    lidong: [11, 7],    // 立冬 11月7日
    xiaoxue: [11, 22],  // 小雪 11月22日
    daxue: [12, 7],     // 大雪 12月7日
    dongzhi: [12, 21],  // 冬至 12月21日
  },
  2025: {
    xiaohan: [1, 5],    // 小寒 1月5日
    dahan: [1, 20],     // 大寒 1月20日
    lichun: [2, 3],     // 立春 2月3日
    yushui: [2, 18],    // 雨水 2月18日
    jingzhe: [3, 5],    // 惊蛰 3月5日
    chunfen: [3, 20],   // 春分 3月20日
    qingming: [4, 4],   // 清明 4月4日
    guyu: [4, 20],      // 谷雨 4月20日
    lixia: [5, 5],      // 立夏 5月5日
    xiaoman: [5, 21],   // 小满 5月21日
    mangzhong: [6, 5],  // 芒种 6月5日
    xiazhi: [6, 21],    // 夏至 6月21日
    xiaoshu: [7, 7],    // 小暑 7月7日
    dashu: [7, 22],     // 大暑 7月22日
    liqiu: [8, 7],      // 立秋 8月7日
    chushu: [8, 23],    // 处暑 8月23日
    bailu: [9, 7],      // 白露 9月7日
    qiufen: [9, 23],    // 秋分 9月23日
    hanlu: [10, 8],     // 寒露 10月8日
    shuangjiang: [10, 23], // 霜降 10月23日
    lidong: [11, 7],    // 立冬 11月7日
    xiaoxue: [11, 22],  // 小雪 11月22日
    daxue: [12, 7],     // 大雪 12月7日
    dongzhi: [12, 22],  // 冬至 12月22日
  },
};

/**
 * 节气顺序（从立春开始）
 */
const SOLAR_TERM_ORDER: SolarTermCode[] = [
  "lichun", "yushui", "jingzhe", "chunfen", "qingming", "guyu",
  "lixia", "xiaoman", "mangzhong", "xiazhi", "xiaoshu", "dashu",
  "liqiu", "chushu", "bailu", "qiufen", "hanlu", "shuangjiang",
  "lidong", "xiaoxue", "daxue", "dongzhi", "xiaohan", "dahan",
];

/**
 * 使用准确的日期表解析节气代码
 * 优先使用预计算的准确日期，如果没有则使用计算算法
 */
export function resolveSolarTermCodeFromPreciseDates(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // 如果有该年份的准确日期表，使用它
  if (PRECISE_SOLAR_TERM_DATES[year]) {
    const yearDates = PRECISE_SOLAR_TERM_DATES[year];
    
    // 将日期表转换为可比较的格式
    const termDates = Object.entries(yearDates)
      .map(([code, [termMonth, termDay]]) => ({
        code: code as SolarTermCode,
        month: termMonth,
        day: termDay,
        date: new Date(year, termMonth - 1, termDay),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const currentDate = new Date(year, month - 1, day);
    
    // 找到当前日期对应的节气
    let currentTerm = termDates[0].code; // 默认第一个
    
    for (let i = 0; i < termDates.length; i++) {
      if (currentDate >= termDates[i].date) {
        currentTerm = termDates[i].code;
      } else {
        break;
      }
    }
    
    // 如果当前日期在第一个节气之前，使用上一年的最后一个节气
    if (currentDate < termDates[0].date) {
      const lastYear = year - 1;
      if (PRECISE_SOLAR_TERM_DATES[lastYear]) {
        const lastYearTerms = PRECISE_SOLAR_TERM_DATES[lastYear];
        return "dahan"; // 大寒通常是上一年的最后一个节气
      }
    }
    
    return currentTerm;
  }
  
  // 如果没有该年份的数据，使用计算算法（fallback）
  // 这里可以调用之前的计算函数
  return calculateSolarTermFallback(date);
}

/**
 * 备用计算方法（当没有准确日期表时使用）
 */
function calculateSolarTermFallback(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 使用改进的近似算法
  const lichunBaseDay = 4;
  const lichunAdjustment = Math.floor((year - 2000) * 0.2422) - Math.floor((year - 2000) / 4);
  const lichunDay = lichunBaseDay + lichunAdjustment;
  
  const dayOfYear = getDayOfYear(date);
  const lichunDate = new Date(year, 1, lichunDay);
  const lichunDayOfYear = getDayOfYear(lichunDate);
  
  let daysFromLichun: number;
  if (dayOfYear >= lichunDayOfYear) {
    daysFromLichun = dayOfYear - lichunDayOfYear;
  } else {
    const lastYearLichunDay = 4 + Math.floor((year - 2001) * 0.2422) - Math.floor((year - 2001) / 4);
    const lastYearLichunDate = new Date(year - 1, 1, lastYearLichunDay);
    const lastYearLichunDayOfYear = getDayOfYear(lastYearLichunDate);
    const daysInLastYear = isLeapYear(year - 1) ? 366 : 365;
    daysFromLichun = (daysInLastYear - lastYearLichunDayOfYear) + dayOfYear;
  }
  
  const termIndex = Math.floor(daysFromLichun / 15.218) % SOLAR_TERM_ORDER.length;
  return SOLAR_TERM_ORDER[termIndex];
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

