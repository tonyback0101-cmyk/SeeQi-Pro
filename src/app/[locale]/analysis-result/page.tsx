import { redirect } from "next/navigation";

type PageProps = {
  params: { locale?: string };
};

export default function LegacyAnalysisRedirect({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  redirect(`/${locale}/v2/analysis-result`);
}
