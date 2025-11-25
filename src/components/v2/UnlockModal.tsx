"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/v2/routes";
import { buildV2ResultPage } from "@/lib/v2/routes";

type PaymentOption = "single" | "month" | "year";

type UnlockModalProps = {
  locale: Locale;
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  currentUrl: string;
};

const TEXT = {
  zh: {
    title: "解锁完整报告",
    single: {
      name: "单次解锁本份报告",
      description: "一次性支付，永久解锁当前报告",
      price: "$1.99",
    },
    month: {
      name: "开通月度会员",
      description: "月订阅，全部报告解锁，随时可取消",
      price: "$9.99/月",
    },
    year: {
      name: "开通年度会员",
      description: "年订阅，全部报告解锁，包含年度独家礼遇",
      price: "$99.00/年",
    },
    unlockButton: "立即解锁",
    cancel: "取消",
  },
  en: {
    title: "Unlock Full Report",
    single: {
      name: "Unlock This Report",
      description: "One-time payment to permanently unlock this report",
      price: "$1.99",
    },
    month: {
      name: "Monthly Membership",
      description: "Monthly subscription, unlock all reports, cancel anytime",
      price: "$9.99/month",
    },
    year: {
      name: "Yearly Membership",
      description: "Yearly subscription, unlock all reports with annual perks",
      price: "$99.00/year",
    },
    unlockButton: "Unlock Now",
    cancel: "Cancel",
  },
} as const;

export default function UnlockModal({
  locale,
  reportId,
  isOpen,
  onClose,
  isLoggedIn,
  currentUrl,
}: UnlockModalProps) {
  const t = TEXT[locale];
  const [loading, setLoading] = useState<PaymentOption | null>(null);

  if (!isOpen) return null;

  const handlePayment = async (option: PaymentOption) => {
    if (!isLoggedIn) {
      // 未登录，跳转到登录页
      await signIn(undefined, { callbackUrl: currentUrl });
      return;
    }

    setLoading(option);

    try {
      // 映射 option 到 mode
      const mode = option === "single" ? "single" : option === "month" ? "sub_month" : "sub_year";
      
      const response = await fetch("/api/v2/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          reportId: mode === "single" ? reportId : reportId, // single 模式必填，订阅模式可选（用于返回页面）
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        console.error("Payment checkout failed:", data);
        alert(locale === "zh" ? "支付创建失败，请重试" : "Payment checkout failed, please try again");
        setLoading(null);
        return;
      }

      // 跳转到 Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Payment error:", error);
      alert(locale === "zh" ? "支付处理出错，请重试" : "Payment processing error, please try again");
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1A202C",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: "#F8F8F8", fontSize: "24px", marginBottom: "24px", fontWeight: 700 }}>
          {t.title}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {/* 单次解锁 */}
          <button
            onClick={() => handlePayment("single")}
            disabled={loading !== null}
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "2px solid #4A5568",
              backgroundColor: "#2D3748",
              color: "#F8F8F8",
              textAlign: "left",
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null && loading !== "single" ? 0.5 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#FF7B54";
                e.currentTarget.style.backgroundColor = "#3C475A";
              }
            }}
            onMouseLeave={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#4A5568";
                e.currentTarget.style.backgroundColor = "#2D3748";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{t.single.name}</div>
                <div style={{ fontSize: "14px", color: "#B0BACC" }}>{t.single.description}</div>
              </div>
              <div style={{ fontWeight: 700, color: "#FF7B54" }}>{t.single.price}</div>
            </div>
          </button>

          {/* 月度订阅 */}
          <button
            onClick={() => handlePayment("month")}
            disabled={loading !== null}
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "2px solid #4A5568",
              backgroundColor: "#2D3748",
              color: "#F8F8F8",
              textAlign: "left",
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null && loading !== "month" ? 0.5 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#FF7B54";
                e.currentTarget.style.backgroundColor = "#3C475A";
              }
            }}
            onMouseLeave={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#4A5568";
                e.currentTarget.style.backgroundColor = "#2D3748";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{t.month.name}</div>
                <div style={{ fontSize: "14px", color: "#B0BACC" }}>{t.month.description}</div>
              </div>
              <div style={{ fontWeight: 700, color: "#FF7B54" }}>{t.month.price}</div>
            </div>
          </button>

          {/* 年度订阅 */}
          <button
            onClick={() => handlePayment("year")}
            disabled={loading !== null}
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "2px solid #4A5568",
              backgroundColor: "#2D3748",
              color: "#F8F8F8",
              textAlign: "left",
              cursor: loading !== null ? "not-allowed" : "pointer",
              opacity: loading !== null && loading !== "year" ? 0.5 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#FF7B54";
                e.currentTarget.style.backgroundColor = "#3C475A";
              }
            }}
            onMouseLeave={(e) => {
              if (loading === null) {
                e.currentTarget.style.borderColor = "#4A5568";
                e.currentTarget.style.backgroundColor = "#2D3748";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{t.year.name}</div>
                <div style={{ fontSize: "14px", color: "#B0BACC" }}>{t.year.description}</div>
              </div>
              <div style={{ fontWeight: 700, color: "#FF7B54" }}>{t.year.price}</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4A5568",
            color: "#F8F8F8",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

