// @ts-ignore: React types resolved at runtime in this environment
import React, { type ReactNode } from "react";
import type { Metadata } from "next";
import Navigation from "../../components/Navigation";
import AuthProvider from "@/components/providers/AuthProvider";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import { getMissingServerEnvVars, getMissingPublicEnvVars } from "@/lib/env";

type RootLayoutProps = {
  children: ReactNode;
  params: { locale: "zh" | "en" };
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SeeQi Wellness",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", rel: "icon", purpose: "maskable" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = params;
  const missingServer = getMissingServerEnvVars();
  const missingPublic = getMissingPublicEnvVars();

  return (
    <html lang={locale}>
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
        <AuthProvider>
          <EnvironmentBanner missingServerVars={missingServer} missingPublicVars={missingPublic} />
          <Navigation initialLanguage={locale} />
          <main
            style={{
              flex: 1,
              paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0))",
              paddingBottom: "calc(1.2rem + env(safe-area-inset-bottom, 0))",
              paddingInline: "clamp(0.12rem, 0.5vw, 0.3rem)",
              marginInline: "auto",
              maxWidth: "min(100%, 1024px)",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {children}
          </main>
        </AuthProvider>
        <footer
          style={{
            background: "#8DAE92",
            color: "#fff",
            padding: "1rem 2rem",
            textAlign: "center",
            fontSize: "1rem",
            letterSpacing: "0.5px",
          }}
        >
          &copy; {new Date().getFullYear()} SeeQi
        </footer>
      </body>
    </html>
  );
}
