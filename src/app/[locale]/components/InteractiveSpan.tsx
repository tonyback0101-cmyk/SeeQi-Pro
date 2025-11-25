"use client";

import React from "react";

interface InteractiveSpanProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  hoverColor?: string;
  defaultColor?: string;
}

export function InteractiveSpan({
  className = "",
  style = {},
  children,
  hoverColor,
  defaultColor,
}: InteractiveSpanProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyle: React.CSSProperties = {
    ...style,
    color: isHovered && hoverColor ? hoverColor : defaultColor || style.color,
    transition: "all 0.2s ease",
  };

  return (
    <span
      className={className}
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </span>
  );
}

