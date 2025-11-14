// @ts-ignore: React types are provided by Next.js runtime
import React from "react";
import HomePage from "../../components/HomePage";

type PageProps = {
  params: { locale: "zh" | "en" };
};

export default function Page({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  return (
    <div
      style={{
        paddingTop: "calc(0.8rem + env(safe-area-inset-top, 0))",
        paddingBottom: "calc(0.8rem + env(safe-area-inset-bottom, 0))",
        paddingInline: "clamp(0.12rem, 0.5vw, 0.3rem)",
        marginInline: "auto",
        maxWidth: "min(100%, 1024px)",
      }}
    >
      <HomePage locale={locale} />
    </div>
  );
}
 