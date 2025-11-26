import "./globals.css";
import "./test-mystic.css";

import type { ReactNode } from "react";
import { LangSetter } from "@/components/LangSetter";

export const metadata = {
  title: {
    default: "SeeQi · 东方玄学洞察系统",
    template: "%s | SeeQi",
  },
  description: {
    default: "SeeQi · 东方玄学洞察系统 | Eastern Insight System",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SeeQi",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // 移除 maximumScale 和 userScalable 以提高兼容性和可访问性
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // 设置默认 lang 为 zh-CN（服务器端渲染时使用）
  // LangSetter 会在客户端根据路径更新为正确的值
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-mystic-primary font-sans text-light-secondary min-h-screen pb-24 relative overflow-x-hidden z-0" style={{ backgroundColor: '#0D1B2A', color: '#AABBC9', display: 'block', visibility: 'visible', position: 'relative', margin: 0, padding: 0 }}>
        {/* 主背景色已调整为更深邃的 #0D1B2A */}
        {/* 玄幻背景图案层 - 更具玄幻感的背景渐变和纹理叠加 */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-mystic-gradient-deep" style={{ zIndex: 0 }}>
          {/* 主背景渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-700/12 to-teal-600/8 animate-fade-in-out"></div>
          
          {/* 光流效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-light-flow"></div>
          
          {/* 模拟玄幻能量流动的背景效果 */}
          <div className="mystic-bg-effect"></div>
          
          {/* 宇宙能量光晕 - 多个层次，使用新的动画 */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-purple-500/8 blur-2xl animate-fade-in-out" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-blue-500/6 blur-3xl animate-fade-in-out" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-36 h-36 rounded-full bg-teal-500/7 blur-2xl animate-fade-in-out" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-1/3 right-1/4 w-44 h-44 rounded-full bg-accent-gold/5 blur-3xl animate-fade-in-out" style={{ animationDelay: '3s' }}></div>
          
          {/* 星点效果 - 模拟星空 */}
          <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full bg-white/30 blur-sm animate-fade-in-out" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 rounded-full bg-light-highlight/40 blur-sm animate-fade-in-out" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-[30%] left-[30%] w-1 h-1 rounded-full bg-white/25 blur-sm animate-fade-in-out" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute bottom-[20%] right-[20%] w-1.5 h-1.5 rounded-full bg-accent-gold/30 blur-sm animate-fade-in-out" style={{ animationDelay: '3.5s' }}></div>
        </div>
        <LangSetter />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
