"use client";

import LoadingScene from "@/components/LoadingScene";
import type { Locale } from "@/components/LoadingScene";

type PageProps = {
  params: { locale: Locale };
};

export default function LoadingPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  return <LoadingScene locale={locale} />;
}

