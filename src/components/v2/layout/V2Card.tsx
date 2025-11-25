import { type ReactNode } from "react";

type V2CardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * V2 统一卡片组件
 * 使用统一的样式：rounded-2xl border border-slate-100 bg-white p-5 md:p-6 shadow-sm
 */
export default function V2Card({ children, className = "" }: V2CardProps) {
  return <div className={`v2-card ${className}`}>{children}</div>;
}




