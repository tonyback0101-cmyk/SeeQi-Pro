"use client";

import React from "react";
import Link from "next/link";

interface InteractiveLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  hoverColor?: string;
  defaultColor?: string;
  hoverBgColor?: string;
  defaultBgColor?: string;
}

export function InteractiveLink({
  href,
  className = "",
  style = {},
  children,
  hoverColor,
  defaultColor,
  hoverBgColor,
  defaultBgColor,
}: InteractiveLinkProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyle: React.CSSProperties = {
    ...style,
    color: isHovered && hoverColor ? hoverColor : defaultColor || style.color,
    backgroundColor: isHovered && hoverBgColor ? hoverBgColor : defaultBgColor || style.backgroundColor,
    transition: "all 0.2s ease",
  };

  return (
    <Link
      href={href}
      className={className}
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  );
}

