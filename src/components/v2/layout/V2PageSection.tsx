import { type ReactNode } from "react";
import V2Card from "./V2Card";

type V2PageSectionProps = {
  children: ReactNode;
  className?: string;
  /** 是否使用卡片样式（默认 true） */
  card?: boolean;
};

/**
 * V2 页面区块组件
 * 统一间距和布局
 */
export default function V2PageSection({ children, className = "", card = true }: V2PageSectionProps) {
  if (card) {
    return (
      <V2Card className={className}>
        {children}
      </V2Card>
    );
  }
  
  return (
    <div className={`space-y-4 md:space-y-5 ${className}`}>
      {children}
    </div>
  );
}

