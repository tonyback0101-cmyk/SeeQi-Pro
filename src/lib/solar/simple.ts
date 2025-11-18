/**
 * 简化的节气计算：直接根据日期匹配
 * 基于准确的日期表，简单直接
 */

type SolarTermCode = 
  | "lichun" | "yushui" | "jingzhe" | "chunfen" | "qingming" | "guyu"
  | "lixia" | "xiaoman" | "mangzhong" | "xiazhi" | "xiaoshu" | "dashu"
  | "liqiu" | "chushu" | "bailu" | "qiufen" | "hanlu" | "shuangjiang"
  | "lidong" | "xiaoxue" | "daxue" | "dongzhi" | "xiaohan" | "dahan";

type SolarTermDate = [number, number]; // [月份, 日期]

/**
 * 准确的节气日期表（2024-2028年）
 * 数据来源：紫金山天文台《天文年历》
 */
const SOLAR_TERM_DATES: Record<number, Record<SolarTermCode, SolarTermDate>> = {
  2024: {
    xiaohan: [1, 6], dahan: [1, 20], lichun: [2, 4], yushui: [2, 19],
    jingzhe: [3, 5], chunfen: [3, 20], qingming: [4, 4], guyu: [4, 19],
    lixia: [5, 5], xiaoman: [5, 20], mangzhong: [6, 5], xiazhi: [6, 21],
    xiaoshu: [7, 6], dashu: [7, 22], liqiu: [8, 7], chushu: [8, 22],
    bailu: [9, 7], qiufen: [9, 22], hanlu: [10, 8], shuangjiang: [10, 23],
    lidong: [11, 7], xiaoxue: [11, 22], daxue: [12, 7], dongzhi: [12, 21],
  },
  2025: {
    xiaohan: [1, 5], dahan: [1, 20], lichun: [2, 3], yushui: [2, 18],
    jingzhe: [3, 5], chunfen: [3, 20], qingming: [4, 4], guyu: [4, 20],
    lixia: [5, 5], xiaoman: [5, 21], mangzhong: [6, 5], xiazhi: [6, 21],
    xiaoshu: [7, 7], dashu: [7, 22], liqiu: [8, 7], chushu: [8, 23],
    bailu: [9, 7], qiufen: [9, 23], hanlu: [10, 8], shuangjiang: [10, 23],
    lidong: [11, 7], xiaoxue: [11, 22], daxue: [12, 7], dongzhi: [12, 22],
  },
  2026: {
    xiaohan: [1, 5], dahan: [1, 20], lichun: [2, 4], yushui: [2, 19],
    jingzhe: [3, 5], chunfen: [3, 20], qingming: [4, 4], guyu: [4, 20],
    lixia: [5, 5], xiaoman: [5, 21], mangzhong: [6, 5], xiazhi: [6, 21],
    xiaoshu: [7, 7], dashu: [7, 22], liqiu: [8, 7], chushu: [8, 23],
    bailu: [9, 7], qiufen: [9, 23], hanlu: [10, 8], shuangjiang: [10, 23],
    lidong: [11, 7], xiaoxue: [11, 22], daxue: [12, 7], dongzhi: [12, 22],
  },
  2027: {
    xiaohan: [1, 5], dahan: [1, 20], lichun: [2, 4], yushui: [2, 19],
    jingzhe: [3, 5], chunfen: [3, 21], qingming: [4, 5], guyu: [4, 20],
    lixia: [5, 5], xiaoman: [5, 21], mangzhong: [6, 5], xiazhi: [6, 21],
    xiaoshu: [7, 7], dashu: [7, 23], liqiu: [8, 7], chushu: [8, 23],
    bailu: [9, 7], qiufen: [9, 23], hanlu: [10, 8], shuangjiang: [10, 23],
    lidong: [11, 7], xiaoxue: [11, 22], daxue: [12, 7], dongzhi: [12, 22],
  },
  2028: {
    xiaohan: [1, 5], dahan: [1, 20], lichun: [2, 4], yushui: [2, 19],
    jingzhe: [3, 5], chunfen: [3, 20], qingming: [4, 4], guyu: [4, 19],
    lixia: [5, 5], xiaoman: [5, 20], mangzhong: [6, 5], xiazhi: [6, 21],
    xiaoshu: [7, 6], dashu: [7, 22], liqiu: [8, 7], chushu: [8, 22],
    bailu: [9, 7], qiufen: [9, 22], hanlu: [10, 8], shuangjiang: [10, 23],
    lidong: [11, 7], xiaoxue: [11, 22], daxue: [12, 6], dongzhi: [12, 21],
  },
};

/**
 * 根据日期简单匹配节气
 */
export function getSolarTermByDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 如果有该年份的数据
  if (SOLAR_TERM_DATES[year]) {
    const yearDates = SOLAR_TERM_DATES[year];
    
    // 找到当前日期对应的节气（最后一个小于等于当前日期的节气）
    let currentTerm: SolarTermCode = "xiaohan"; // 默认小寒
    
    for (const [code, [termMonth, termDay]] of Object.entries(yearDates)) {
      // 如果当前日期大于等于这个节气日期
      if (month > termMonth || (month === termMonth && day >= termDay)) {
        currentTerm = code as SolarTermCode;
      } else {
        break; // 已经找到，退出循环
      }
    }
    
    // 如果当前日期在第一个节气（小寒）之前，使用上一年的最后一个节气（大寒）
    const firstTerm = yearDates.xiaohan;
    if (month < firstTerm[0] || (month === firstTerm[0] && day < firstTerm[1])) {
      if (SOLAR_TERM_DATES[year - 1]) {
        return "dahan"; // 上一年的最后一个节气
      }
    }
    
    return currentTerm;
  }
  
  // 如果没有数据，返回默认值
  return "lidong"; // 默认立冬
}

