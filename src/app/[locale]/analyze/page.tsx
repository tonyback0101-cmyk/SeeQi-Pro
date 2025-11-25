import { redirect } from "next/navigation";

type PageProps = {
  params: { locale?: string };
};

export default function LegacyAnalyzeRedirect({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  redirect(`/${locale}/v2/analyze`);
}
