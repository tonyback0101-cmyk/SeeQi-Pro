import type { ReactNode } from "react";
import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";

export const dynamicParams = true;

const METADATA: Record<string, Metadata> = {
  zh: {
    title: "SeeQi · 东方玄学洞察系统",
    description: "基于掌纹、舌象、体质、梦境与气运的综合分析，提供个性化的东方象学洞察",
  },
  en: {
    title: "SeeQi · Eastern Insight System",
    description: "Comprehensive analysis based on palmistry, tongue diagnosis, constitution, dreams, and qi rhythm for personalized Eastern insights",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const localeKey = locale === "en" ? "en" : "zh";
  return METADATA[localeKey] || METADATA.zh;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
        <AuthProvider>
      <div className="min-h-screen" style={{ 
        position: 'relative', 
        zIndex: 1, 
        minHeight: '100vh',
        display: 'block',
        visibility: 'visible',
      }}>
            {children}
      </div>
        </AuthProvider>
  );
}
