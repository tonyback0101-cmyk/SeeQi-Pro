import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: "zh" | "en" }>;
};

export default async function AuthPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/auth/sign-in`);
}

