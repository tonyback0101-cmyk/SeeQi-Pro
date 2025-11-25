import { type ReactNode } from "react";

type V2PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** 最大宽度 */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

/**
 * V2 页面容器组件
 * 统一背景色和基础布局
 */
export default function V2PageContainer({ children, className = "", maxWidth = "2xl" }: V2PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div className={`min-h-screen ${maxWidthClasses[maxWidth]} mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4 md:space-y-5 ${className}`} style={{ backgroundColor: 'transparent' }}>
      {children}
    </div>
  );
}
