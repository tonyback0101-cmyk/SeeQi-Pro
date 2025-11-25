/**
 * 检测是否在 PWA 模式下运行
 */
import { useState, useEffect } from "react";

export function useIsPWA(): boolean {
  // 初始值设为 false，避免服务器端和客户端不一致导致的 hydration 错误
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 检测方法 1: display-mode: standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    // 检测方法 2: navigator.standalone (iOS Safari)
    const isIOSStandalone = 
      (window.navigator as any).standalone === true;
    
    // 检测方法 3: 检查是否从主屏幕启动（通过 referrer 和 window 特性）
    const isFromHomeScreen = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsPWA(isStandalone || isIOSStandalone || isFromHomeScreen);
  }, []);

  return isPWA;
}

