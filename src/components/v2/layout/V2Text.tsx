import { type ReactNode } from "react";

type V2TextProps = {
  children: ReactNode;
  className?: string;
  /** 文本类型：body（正文）、note（注释/免责声明） */
  variant?: "body" | "note";
  as?: "p" | "span" | "div";
};

/**
 * V2 统一文本组件
 * - body: text-sm leading-relaxed（正文）
 * - note: text-xs text-gray-500 leading-relaxed（注释/免责声明）
 */
export default function V2Text({ children, className = "", variant = "body", as: Component = "p" }: V2TextProps) {
  const variantClasses = {
    body: "text-sm leading-relaxed text-gray-700",
    note: "text-xs text-gray-500 leading-relaxed",
  };

  return (
    <Component className={`${variantClasses[variant]} ${className}`}>
      {children}
    </Component>
  );
}
