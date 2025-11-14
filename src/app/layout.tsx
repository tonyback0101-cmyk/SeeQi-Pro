// @ts-ignore - Next.js provides React types at runtime
import React, { type ReactNode } from "react";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata = {
  title: "SeeQi Wellness",
  description: "SeeQi · 智慧东方健康体验",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh">
      <body
        style={{
          background: "#F9F7F3",
          color: "#222",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}


