"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 客户端组件：根据 URL 路径动态设置 <html> 元素的 lang 属性
 * 用于满足辅助功能要求
 * 使用 useLayoutEffect 在浏览器绘制前同步更新，避免 hydration 错误
 */
export function LangSetter() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    // 从路径中提取 locale（例如：/zh/... 或 /en/...）
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const localeFromPath = segments[0];
    
    // 根据路径动态确定语言代码
    if (typeof document !== "undefined") {
      if (localeFromPath === "en") {
        document.documentElement.lang = "en-US";
      } else if (localeFromPath === "zh") {
        document.documentElement.lang = "zh-CN";
      } else {
        // 如果没有检测到 locale，使用默认值 zh-CN
        document.documentElement.lang = "zh-CN";
      }
    }
  }, [pathname]);

  // 这个组件不渲染任何内容
  return null;
}

