import { redirect } from "next/navigation";

type PageProps = {
  params: { locale?: string; id?: string };
};

export default function LegacyAnalysisResultIdRedirect({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const id = params.id ?? "local";
  redirect(`/${locale}/v2/analysis-result?reportId=${encodeURIComponent(id)}`);
}
