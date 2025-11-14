'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

type ProPlanKey = "monthly" | "yearly" | "lifetime";

type PlanResponse = {
  plans: Array<{
    key: ProPlanKey;
    priceId: string;
    amount: number;
    currency: string;
    type: "recurring" | "one_time";
    interval?: "day" | "week" | "month" | "year";
  }>;
  error?: string;
};

type SubscribeButtonProps = {
  locale: "zh" | "en";
  initiallyOpen?: boolean;
};

type PlanCopy = {
  title: string;
  subtitle: string;
  cta: string;
  highlight?: boolean;
};

const PLAN_TEXT: Record<"zh" | "en", Record<ProPlanKey, PlanCopy>> = {
  zh: {
    monthly: {
      title: "月度会员",
      subtitle: "灵活订阅，随时可取消",
      cta: "开通月付",
      highlight: true,
    },
    yearly: {
      title: "年度会员",
      subtitle: "折扣更优，包含年度独家礼遇",
      cta: "升级年付",
    },
    lifetime: {
      title: "终身会员",
      subtitle: "一次付费，终身享受后续升级",
      cta: "解锁终身版",
    },
  },
  en: {
    monthly: {
      title: "Monthly",
      subtitle: "Flexible subscription, cancel anytime",
      cta: "Subscribe monthly",
      highlight: true,
    },
    yearly: {
      title: "Yearly",
      subtitle: "Best value with annual perks included",
      cta: "Upgrade yearly",
    },
    lifetime: {
      title: "Lifetime",
      subtitle: "One-time purchase with future upgrades",
      cta: "Unlock lifetime",
    },
  },
};

function formatAmount(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch (error) {
    console.warn("formatAmount", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function SubscribeButton({ locale, initiallyOpen = false }: SubscribeButtonProps) {
  const [showPlans, setShowPlans] = useState(initiallyOpen);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanResponse["plans"]>([]);
  const [selectingPlan, setSelectingPlan] = useState<ProPlanKey | null>(null);
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
      const response = await fetch("/api/billing/plans");
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
    if (!plans?.length) return [] as PlanResponse["plans"];
    const priority: ProPlanKey[] = ["monthly", "yearly", "lifetime"];
    return [...plans].sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key));
  }, [plans]);

  const handleToggle = () => {
    setShowPlans((prev) => !prev);
    if (!showPlans) {
      setCheckoutError(null);
    }
  };

  const handleCheckout = async (planKey: ProPlanKey) => {
    setCheckoutError(null);
    setSelectingPlan(planKey);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale, plan: planKey }),
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
        style={{
          width: "100%",
          maxWidth: 340,
          minWidth: 240,
          padding: "0.85rem 1.75rem",
          borderRadius: 999,
          border: "none",
          background: showPlans ? "#2C3E30" : "linear-gradient(135deg, #2C3E30, #4A7157)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1.05rem",
          cursor: "pointer",
          boxShadow: showPlans ? "0 12px 24px rgba(44, 62, 48, 0.24)" : "0 18px 32px rgba(44, 62, 48, 0.22)",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
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
                const copy = planCopies[plan.key];
                const amountText = formatAmount(plan.amount, plan.currency);
                const interval = plan.interval ? (locale === "zh" ? (plan.interval === "year" ? "年" : plan.interval === "month" ? "月" : plan.interval) : plan.interval) : null;
                const secondaryText = interval
                  ? locale === "zh"
                    ? `${amountText} / ${interval}`
                    : `${amountText} / ${interval}`
                  : amountText;
                const isSelecting = selectingPlan === plan.key;

                return (
                  <div
                    key={plan.key}
                    style={{
                      borderRadius: "20px",
                      border: copy.highlight ? "2px solid rgba(44, 110, 73, 0.4)" : "1px solid rgba(44, 62, 48, 0.2)",
                      background: copy.highlight ? "linear-gradient(140deg, rgba(44, 62, 48, 0.92), rgba(74, 113, 87, 0.9))" : "rgba(255, 255, 255, 0.95)",
                      color: copy.highlight ? "#f1fff9" : "#2C3E30",
                      padding: "1.35rem 1.4rem",
                      boxShadow: copy.highlight ? "0 24px 40px rgba(44, 62, 48, 0.32)" : "0 16px 28px rgba(44, 62, 48, 0.18)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>{copy.title}</div>
                      <div style={{ fontSize: "0.95rem", opacity: copy.highlight ? 0.8 : 0.7 }}>{copy.subtitle}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{secondaryText}</div>
                      {plan.type === "one_time" ? (
                        <div style={{ fontSize: "0.85rem", opacity: copy.highlight ? 0.75 : 0.65 }}>
                          {locale === "zh" ? "一次性付款" : "One-time payment"}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", opacity: copy.highlight ? 0.75 : 0.65 }}>
                          {locale === "zh" ? "Stripe 安全托管，可随时取消" : "Secured by Stripe, cancel anytime"}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckout(plan.key)}
                      disabled={isSelecting}
                      style={{
                        marginTop: "auto",
                        borderRadius: 999,
                        border: copy.highlight ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(44, 62, 48, 0.4)",
                        background: copy.highlight ? "rgba(255,255,255,0.18)" : "#2C3E30",
                        color: copy.highlight ? "#fff" : "#f5fff9",
                        padding: "0.65rem 1rem",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: isSelecting ? "wait" : "pointer",
                        transition: "transform 0.18s ease, box-shadow 0.18s ease",
                        boxShadow: copy.highlight ? "0 12px 24px rgba(0,0,0,0.22)" : "0 12px 22px rgba(44, 62, 48, 0.18)",
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
