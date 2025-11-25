import React, { type ElementType, type ReactNode } from "react";

type V2PageTitleProps = {
  children: ReactNode;
  className?: string;
  /** 标题层级：page（主标题）、section（区块标题）、card（卡片内小标题） */
  level?: "page" | "section" | "card";
  as?: ElementType;
  style?: React.CSSProperties;
};

/**
 * V2 统一标题组件
 * - page: text-2xl font-semibold（页面主标题）
 * - section: text-xl font-semibold（区块标题）
 * - card: text-lg font-semibold（卡片内小标题）
 */
export default function V2PageTitle({ children, className = "", level = "page", as, style }: V2PageTitleProps) {
  const levelClasses = {
    page: "text-2xl font-bold text-gray-900", // 标题字体更粗
    section: "text-xl font-bold text-gray-900", // 标题字体更粗
    card: "text-lg font-bold text-gray-900", // 标题字体更粗
  };

  const Component = (as ?? "h2") as ElementType;

  return (
    <Component className={`${levelClasses[level]} ${className}`} style={style}>
      {children}
    </Component>
  );
}
