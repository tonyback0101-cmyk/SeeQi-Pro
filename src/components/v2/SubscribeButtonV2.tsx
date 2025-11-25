"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProPlan } from "@/lib/billing/plans";

type PlanResponse = {
  plans: ProPlan[];
  error?: string;
};

type SubscribeButtonV2Props = {
  locale: "zh" | "en";
  initiallyOpen?: boolean;
};

const PLAN_TEXT: Record<"zh" | "en", Record<"single" | "monthly" | "yearly", { title: string; subtitle: string; cta: string }>> = {
  zh: {
    single: {
      title: "单次解锁",
      subtitle: "一次性支付，永久解锁",
      cta: "立即解锁",
    },
    monthly: {
      title: "月度会员",
      subtitle: "灵活订阅，随时可取消",
      cta: "开通月付",
    },
    yearly: {
      title: "年度会员",
      subtitle: "折扣更优，包含年度独家礼遇",
      cta: "升级年付",
    },
  },
  en: {
    single: {
      title: "One-time Unlock",
      subtitle: "One-time payment, permanent unlock",
      cta: "Unlock Now",
    },
    monthly: {
      title: "Monthly Pro",
      subtitle: "Flexible subscription, cancel anytime",
      cta: "Subscribe Monthly",
    },
    yearly: {
      title: "Yearly Pro",
      subtitle: "Best value with annual perks",
      cta: "Subscribe Yearly",
    },
  },
};

export default function SubscribeButtonV2({ locale, initiallyOpen = false }: SubscribeButtonV2Props) {
  const router = useRouter();
  const [showPlans, setShowPlans] = useState(initiallyOpen);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plans, setPlans] = useState<ProPlan[]>([]);
  const [selectingPlan, setSelectingPlan] = useState<"single" | "monthly" | "yearly" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (initiallyOpen) {
      setShowPlans(true);
    }
  }, [initiallyOpen]);

  const loadPlans = useCallback(async () => {
    if (loadingPlans || plans.length > 0 || planError) {
      return;
    }
    setLoadingPlans(true);
    setPlanError(null);
    try {
      const response = await fetch("/api/v2/subscription/plans");
      const data = (await response.json()) as PlanResponse;
      if (!response.ok) {
        throw new Error(data?.error ?? "failed-to-load");
      }
      setPlans(data.plans ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取订阅方案失败";
      setPlanError(message);
    } finally {
      setLoadingPlans(false);
    }
  }, [loadingPlans, planError, plans.length]);

  useEffect(() => {
    if (showPlans) {
      void loadPlans();
    }
  }, [showPlans, loadPlans]);

  const planCopies = PLAN_TEXT[locale];

  const orderedPlans = useMemo(() => {
    if (!plans?.length) return [] as ProPlan[];
    const priority: ("single" | "monthly" | "yearly")[] = ["monthly", "yearly", "single"];
    return [...plans].sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id));
  }, [plans]);

  const handleToggle = () => {
    setShowPlans((prev) => !prev);
    if (!showPlans) {
      setCheckoutError(null);
    }
  };

  const handleCheckout = async (planId: "single" | "monthly" | "yearly") => {
    setCheckoutError(null);
    setSelectingPlan(planId);
    try {
      const response = await fetch("/api/v2/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale, plan: planId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error((data?.error as string | undefined) ?? "Failed to start checkout");
      }
      window.location.href = data.url as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setCheckoutError(message);
      setSelectingPlan(null);
    }
  };

  const buttonLabel = showPlans
    ? locale === "zh"
      ? "收起订阅方案"
      : "Hide plan options"
    : locale === "zh"
    ? "选择订阅方案"
    : "Choose your plan";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.9rem", alignItems: "center" }}>
      <button
        type="button"
        onClick={handleToggle}
        className="v2-button"
        style={{
          width: "100%",
          maxWidth: 340,
          minWidth: 240,
        }}
      >
        {buttonLabel}
      </button>

      {checkoutError && (
        <span style={{ fontSize: "0.9rem", color: "#7f1d1d", textAlign: "center" }}>
          {locale === "zh" ? `创建支付链接失败：${checkoutError}` : `Failed to start checkout: ${checkoutError}`}
        </span>
      )}

      {showPlans && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            alignItems: "stretch",
          }}
        >
          {loadingPlans ? (
            <div style={{ textAlign: "center", color: "rgba(44, 62, 48, 0.75)", padding: "0.8rem 0" }}>
              {locale === "zh" ? "正在加载订阅方案…" : "Loading plans…"}
            </div>
          ) : planError ? (
            <div style={{ textAlign: "center", color: "#7f1d1d", fontSize: "0.95rem" }}>
              {locale === "zh" ? `获取订阅方案失败：${planError}` : `Unable to load plans: ${planError}`}
            </div>
          ) : orderedPlans.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(44, 62, 48, 0.65)", fontSize: "0.95rem" }}>
              {locale === "zh" ? "暂无可用的订阅配置，请稍后再试。" : "No subscription plans are currently available."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "1rem",
                width: "100%",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {orderedPlans.map((plan) => {
                const copy = planCopies[plan.id];
                const isSelecting = selectingPlan === plan.id;
                const isHighlight = plan.id === "monthly";

                return (
                  <div
                    key={plan.id}
                    style={{
                      borderRadius: "20px",
                      border: isHighlight ? "2px solid rgba(44, 110, 73, 0.4)" : "1px solid rgba(44, 62, 48, 0.2)",
                      background: isHighlight
                        ? "linear-gradient(140deg, rgba(44, 62, 48, 0.92), rgba(74, 113, 87, 0.9))"
                        : "rgba(255, 255, 255, 0.95)",
                      color: isHighlight ? "#f1fff9" : "#2C3E30",
                      padding: "1.35rem 1.4rem",
                      boxShadow: isHighlight
                        ? "0 24px 40px rgba(44, 62, 48, 0.32)"
                        : "0 16px 28px rgba(44, 62, 48, 0.18)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>{plan.name}</div>
                      <div style={{ fontSize: "0.95rem", opacity: isHighlight ? 0.8 : 0.7 }}>{plan.description}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{plan.priceText}</div>
                      {plan.billingType === "subscription" ? (
                        <div style={{ fontSize: "0.85rem", opacity: isHighlight ? 0.75 : 0.65 }}>
                          {locale === "zh" ? "Stripe 安全托管，可随时取消" : "Secured by Stripe, cancel anytime"}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", opacity: isHighlight ? 0.75 : 0.65 }}>
                          {locale === "zh" ? "一次性付款" : "One-time payment"}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isSelecting}
                      style={{
                        marginTop: "auto",
                        borderRadius: 999,
                        border: isHighlight ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(44, 62, 48, 0.4)",
                        background: isHighlight ? "rgba(255,255,255,0.18)" : "#2C3E30",
                        color: isHighlight ? "#fff" : "#f5fff9",
                        padding: "0.65rem 1rem",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: isSelecting ? "wait" : "pointer",
                        transition: "transform 0.18s ease, box-shadow 0.18s ease",
                        boxShadow: isHighlight ? "0 12px 24px rgba(0,0,0,0.22)" : "0 12px 22px rgba(44, 62, 48, 0.18)",
                      }}
                    >
                      {isSelecting
                        ? locale === "zh"
                          ? "跳转中…"
                          : "Redirecting…"
                        : copy.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
