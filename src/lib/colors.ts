export const COLORS = {
  primary: {
    qingzhu: "#8DAE92", // 青竹
  },
  secondary: {
    gold: "#C6A969", // 金色
  },
  accent: {
    purple: {
      100: "#f3e8ff",
      500: "#a855f7",
      600: "#9333ea",
    },
    indigo: {
      100: "#e0e7ff",
      500: "#6366f1",
      600: "#4f46e5",
    },
  },
  background: {
    milkyWhite: "#F9F7F3", // 米白
    lightGold: "#F5E6C8", // 浅金色，用于渐变或强调
  },
  text: {
    darkGreen: "#2C3E30", // 墨绿
    darkBrown: "#484235", // 深棕，用于辅助文字
  },
  status: {
    success: "#4CAF50",
    warning: "#FFC107",
    error: "#F44336",
  },
} as const;

export type ColorToken = keyof typeof COLORS;

