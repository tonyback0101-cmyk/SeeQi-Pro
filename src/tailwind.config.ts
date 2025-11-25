const config = {
  // 确保这里包含了你项目中的所有文件路径
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // 确保包含 src 目录
  ],
  theme: {
    extend: {
      colors: {
        // 全局背景颜色 - 更深邃的玄幻蓝黑
        // 注意：Tailwind 会自动添加 bg- 或 text- 前缀，所以颜色名不应该包含这些前缀
        'mystic-primary': '#0D1B2A', // 主要背景色，深蓝近黑，使用: bg-mystic-primary
        'mystic-secondary': '#1A2F45', // 辅助背景色，稍亮，使用: bg-mystic-secondary
        
        // 文字颜色 - 适应深色背景
        'light-primary': '#E0E8F0',    // 主要文字，如标题，使用: text-light-primary
        'light-secondary': '#AABBC9',  // 普通正文，对比度良好，使用: text-light-secondary
        'light-highlight': '#8FD8FF',  // 强调文字，如日期、重要指标，使用: text-light-highlight
        
        // 特殊强调色
        'accent-gold': '#D4AF37',     // 金色，用于解锁/付费，更亮眼，使用: bg-accent-gold 或 text-accent-gold
        'accent-red': '#C74A78',      // 柔和的品红色，用于吉凶或特殊提示，使用: text-accent-red
        'accent-green': '#6ECB8C',    // 绿色用于积极指标，使用: text-accent-green
        'accent-blue': '#5C8ECC',     // 蓝色用于中性指标，使用: text-accent-blue

        // 卡片颜色 - 更具质感的半透明深色
        'card-bg-dark': 'rgba(25, 45, 65, 0.7)', // 卡片背景，更深更透明，使用: bg-card-bg-dark
        'card-border-light': 'rgba(80, 120, 160, 0.4)', // 卡片边框，更浅更通透，使用: border-card-border-light
        
        // 锁定区域覆盖层
        'locked-overlay-dark': 'rgba(0, 0, 0, 0.9)', // 纯黑半透明，更彻底地模糊，使用: bg-locked-overlay-dark
      },
      fontFamily: {
        // 确保你的系统中有这些字体，或者通过 @import 引入
        serif: ['"Noto Serif SC"', 'serif'], // 标题和关键信息使用衬线体
        sans: ['"Noto Sans SC"', 'sans-serif'], // 正文使用无衬线体
      },
      backgroundImage: {
        // 更具玄幻感的背景渐变和纹理叠加
        'mystic-gradient-deep': 'linear-gradient(135deg, #0D1B2A 0%, #1A2F45 50%, #0D1B2A 100%)',
        'mystic-texture': 'url("/images/mystic-texture.png")', // 假设有一个纹理图片，例如星云、暗流等
      },
      keyframes: {
        'fade-in-out': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.2' },
        },
        'light-flow': {
          '0%': { backgroundPosition: '0% 0%, 0% 0%, 0px 0px' },
          '50%': { backgroundPosition: '100% 100%, 100% 100%, 50px 50px' },
          '100%': { backgroundPosition: '0% 0%, 0% 0%, 0px 0px' },
        },
      },
      animation: {
        'fade-in-out': 'fade-in-out 10s ease-in-out infinite',
        'light-flow': 'light-flow 30s ease infinite', /* 30秒循环，创建缓慢流动的玄幻感 */
      },
    },
  },
  plugins: [],
};
export default config;

