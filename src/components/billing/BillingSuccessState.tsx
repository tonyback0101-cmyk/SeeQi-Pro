'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

const TEXT = {
  zh: {
    syncing: "正在同步订阅状态...",
    success: "专业版已解锁，立即查看报告。",
    pending: "正在等待 Stripe 确认，稍后可再次刷新。",
    error: "同步失败，请稍后重试或联系客服。",
    refresh: "刷新状态",
    startAssessment: "立即开启新的测评",
    goHome: "返回首页",
  },
  en: {
    syncing: "Syncing your subscription...",
    success: "SeeQi Pro is unlocked. Explore your reports now.",
    pending: "Waiting for Stripe confirmation. Try refreshing in a moment.",
    error: "Sync failed. Please try again or contact support.",
    refresh: "Refresh",
    startAssessment: "Start a new assessment",
    goHome: "Back to Home",
  },
} as const;

type Props = {
  locale: "zh" | "en";
};

type State = "loading" | "active" | "pending" | "error";

type ApiResponse = {
  subscription?: {
    active: boolean;
  } | null;
  error?: string;
};

export default function BillingSuccessState({ locale }: Props) {
  const copy = TEXT[locale];
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string>(copy.syncing);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    // TODO: 旧版订阅 API 已废弃，功能暂未开放
    setIsRefreshing(true);
    try {
      // 旧版 API 已移动到 legacy，不再使用
      // const response = await fetch("/api/billing/refresh-subscription", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // const data = (await response.json()) as ApiResponse;
      throw new Error("Subscription feature not available");
    } catch (error) {
      console.error("BillingSuccessState", error);
      setState("error");
      setMessage(copy.error);
    } finally {
      setIsRefreshing(false);
    }
  }, [copy.error, copy.pending, copy.success]);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(fetchStatus, 10_000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  const actionButtons = useMemo(() => {
    const buttons = [
      {
        key: "analyze",
        href: `/${locale}/analyze`,
        label: copy.startAssessment,
        primary: true,
      },
      {
        key: "home",
        href: `/${locale}`,
        label: copy.goHome,
      },
    ];
    return buttons;
  }, [copy.goHome, copy.startAssessment, locale]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.4rem",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "1.05rem",
          lineHeight: 1.7,
          color:
            state === "error"
              ? "#7F1D1D"
              : state === "pending"
              ? "#92400E"
              : "rgba(44, 62, 48, 0.82)",
        }}
      >
        {message}
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={fetchStatus}
          disabled={isRefreshing}
          style={{
            borderRadius: "999px",
            padding: "0.65rem 1.6rem",
            border: "1px solid rgba(44,62,48,0.25)",
            background: isRefreshing ? "rgba(141,174,146,0.25)" : "#fff",
            color: "#2C3E30",
            fontWeight: 600,
            cursor: isRefreshing ? "default" : "pointer",
            boxShadow: "0 12px 24px rgba(44, 62, 48, 0.08)",
            minWidth: "140px",
          }}
        >
          {isRefreshing ? `${copy.refresh}…` : copy.refresh}
        </button>
        {state === "active" &&
          actionButtons.map((item) => (
            <a
              key={item.key}
              href={item.href}
              style={{
                borderRadius: "999px",
                padding: "0.7rem 1.8rem",
                background: item.primary ? "linear-gradient(135deg,#2C3E30,#4A7157)" : "#fff",
                color: item.primary ? "#fff" : "#2C3E30",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: item.primary ? "0 16px 32px rgba(44,62,48,0.18)" : "0 12px 24px rgba(44,62,48,0.08)",
              }}
            >
              {item.label}
            </a>
          ))}
      </div>
    </div>
  );
}










