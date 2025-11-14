'use client';

import { useMemo } from "react";

export type EnvironmentBannerProps = {
  missingServerVars?: string[];
  missingPublicVars?: string[];
};

export default function EnvironmentBanner({ missingServerVars = [], missingPublicVars = [] }: EnvironmentBannerProps) {
  const items = useMemo(() => {
    const warnings: string[] = [];
    if (missingServerVars.length) {
      warnings.push(`服务器配置缺少: ${missingServerVars.join(', ')} | Missing server env: ${missingServerVars.join(', ')}`);
    }
    if (missingPublicVars.length) {
      warnings.push(`前端配置缺少: ${missingPublicVars.join(', ')} | Missing public env: ${missingPublicVars.join(', ')}`);
    }
    return warnings;
  }, [missingPublicVars, missingServerVars]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "#FEE2E2",
        color: "#7F1D1D",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid rgba(127, 29, 29, 0.25)",
        fontSize: "0.95rem",
        lineHeight: 1.5,
      }}
    >
      {items.map((item, index) => (
        <div key={item} style={{ marginTop: index === 0 ? 0 : "0.35rem" }}>
          ⚠️ {item}
        </div>
      ))}
    </div>
  );
}
