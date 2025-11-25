"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { V2PageContainer, V2PageTitle, V2Text } from "@/components/v2/layout";
import { buildV2ResultPage, buildHomePage } from "@/lib/v2/routes";
import "@/styles/v2-theme.css";

type Locale = "zh" | "en";

type PageProps = {
  params: { locale: Locale };
};

const TEXT = {
  zh: {
    title: "订阅成功",
    verifying: "正在验证订阅状态...",
    success: "SeeQi 专业版已解锁！",
    successDesc: "你现在可以访问所有专业功能，包括完整报告、历史记录和多语言分享。",
    pending: "支付正在处理中，请稍候...",
    error: "验证失败，请稍后重试或联系客服。",
    refresh: "刷新状态",
    goToReports: "查看报告",
    goHome: "返回首页",
  },
  en: {
    title: "Subscription Successful",
    verifying: "Verifying subscription status...",
    success: "SeeQi Pro is unlocked!",
    successDesc: "You now have access to all Pro features, including full reports, history, and multi-language sharing.",
    pending: "Payment is being processed, please wait...",
    error: "Verification failed, please try again later or contact support.",
    refresh: "Refresh Status",
    goToReports: "View Reports",
    goHome: "Back to Home",
  },
} as const;

export default function SubscriptionSuccessPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const t = TEXT[locale];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const sessionId = searchParams?.get("session_id");

  const [status, setStatus] = useState<"verifying" | "success" | "pending" | "error">("verifying");
  const [message, setMessage] = useState<string>(t.verifying);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage(t.error);
      return;
    }

    let cancelled = false;

    async function verifySubscription() {
      try {
        // 刷新 session 以获取最新的订阅状态
        await updateSession();

        // 等待一下让 session 更新
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 检查 session 中的 Pro 状态
        const isPro = (session as any)?.proStatus?.isPro ?? false;

        if (cancelled) return;

        if (isPro) {
          setStatus("success");
          setMessage(t.success);
        } else {
          setStatus("pending");
          setMessage(t.pending);
        }
      } catch (error) {
        console.error("verify-subscription", error);
        if (!cancelled) {
          setStatus("error");
          setMessage(t.error);
        }
      }
    }

    verifySubscription();

    return () => {
      cancelled = true;
    };
  }, [sessionId, session, updateSession, t]);

  const handleRefresh = async () => {
    setStatus("verifying");
    setMessage(t.verifying);
    await updateSession();
    // 重新检查 Pro 状态
    const isPro = (session as any)?.proStatus?.isPro ?? false;
    if (isPro) {
      setStatus("success");
      setMessage(t.success);
    } else {
      setStatus("pending");
      setMessage(t.pending);
    }
  };

  return (
    <V2PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <V2PageTitle>{t.title}</V2PageTitle>

        <div className="v2-card space-y-4">
          <div
            className={`text-center p-6 rounded-xl ${
              status === "success"
                ? "bg-green-50 border border-green-200"
                : status === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <p className="text-lg font-medium">{message}</p>
            {status === "success" && <p className="mt-2 text-sm opacity-75">{t.successDesc}</p>}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {status !== "success" && (
              <button
                type="button"
                onClick={handleRefresh}
                className="v2-button"
              >
                {t.refresh}
              </button>
            )}
            {status === "success" && (
              <Link href={buildV2ResultPage(locale)} className="v2-button">
                {t.goToReports}
              </Link>
            )}
            <Link href={buildHomePage(locale)} className="v2-button variant-outline">
              {t.goHome}
            </Link>
          </div>
        </div>
      </div>
    </V2PageContainer>
  );
}

