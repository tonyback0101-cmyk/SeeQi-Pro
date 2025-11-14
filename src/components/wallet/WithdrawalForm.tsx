'use client';

import { useCallback, useMemo, useState } from "react";

type Locale = "zh" | "en";

type Props = {
  locale: Locale;
  minAmount: number;
  availableBalance: number;
};

type Method = "paypal" | "stripe_connect" | "bank";

type SubmitState = "idle" | "loading" | "success" | "error";

type MessagePack = {
  title: string;
  description: string;
  amountLabel: string;
  methodLabel: string;
  emailLabel: string;
  accountLabel: string;
  bankLabel: string;
  submit: string;
  success: string;
  error: string;
  insufficient: string;
  minAmount: (min: number) => string;
  methodOptions: Record<Method, string>;
  comingSoon: string;
};

const MESSAGES: Record<Locale, MessagePack> = {
  zh: {
    title: "发起提现",
    description: "选择到账方式并填写必要信息，平台将在 7 个自然日内处理。",
    amountLabel: "提现金额 (USD)",
    methodLabel: "到账方式",
    emailLabel: "PayPal 邮箱",
    accountLabel: "Stripe Connect 账号",
    bankLabel: "银行账户信息",
    submit: "提交提现申请",
    success: "提现申请已提交，请留意邮箱通知。",
    error: "提交失败，请稍后重试。",
    insufficient: "余额不足无法提现",
    minAmount: (min) => `低于 $${min} 无法提现`,
    methodOptions: {
      paypal: "PayPal",
      stripe_connect: "Stripe Connect",
      bank: "国际银行转账",
    },
    comingSoon: "即将开放",
  },
  en: {
    title: "Request Withdrawal",
    description: "Select a payout method and provide details. We process within 7 calendar days.",
    amountLabel: "Amount (USD)",
    methodLabel: "Payout Method",
    emailLabel: "PayPal Email",
    accountLabel: "Stripe Connect Account",
    bankLabel: "Bank Account Details",
    submit: "Submit Request",
    success: "Withdrawal request submitted. Check your inbox for updates.",
    error: "Submission failed. Please try again later.",
    insufficient: "Insufficient balance",
    minAmount: (min) => `Minimum amount is $${min}`,
    methodOptions: {
      paypal: "PayPal",
      stripe_connect: "Stripe Connect",
      bank: "International Bank Transfer",
    },
    comingSoon: "Coming soon",
  },
};

function getDefaultDetails(method: Method) {
  switch (method) {
    case "paypal":
      return { email: "" };
    case "stripe_connect":
      return { accountId: "" };
    case "bank":
      return { bankInfo: "" };
    default:
      return {};
  }
}

export default function WithdrawalForm({ locale, minAmount, availableBalance }: Props) {
  const text = MESSAGES[locale];
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<Method>("paypal");
  const [details, setDetails] = useState<Record<string, string>>(getDefaultDetails("paypal"));
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const amountNumber = useMemo(() => Number.parseFloat(amount || "0"), [amount]);
  const canSubmit = useMemo(() => {
    if (!amountNumber || Number.isNaN(amountNumber)) return false;
    if (amountNumber < minAmount) return false;
    if (amountNumber > availableBalance) return false;
    if (method === "paypal") {
      return Boolean(details.email && /.+@.+/.test(details.email));
    }
    if (method === "stripe_connect") {
      return Boolean(details.accountId && details.accountId.length > 4);
    }
    if (method === "bank") {
      return Boolean(details.bankInfo && details.bankInfo.length > 6);
    }
    return false;
  }, [amountNumber, availableBalance, details, method, minAmount]);

  const handleMethodChange = useCallback((next: Method) => {
    setMethod(next);
    setDetails(getDefaultDetails(next));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || state === "loading") return;
    setState("loading");
    setError(null);
    try {
      const response = await fetch("/api/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNumber, method, details }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Unknown error");
      }
      setState("success");
      setAmount("");
      setDetails(getDefaultDetails(method));
    } catch (err) {
      console.error("WithdrawalForm", err);
      setState("error");
      setError(err instanceof Error ? err.message : text.error);
    }
  }, [amountNumber, canSubmit, details, method, state, text.error]);

  const renderDetailsField = () => {
    switch (method) {
      case "paypal":
        return (
          <label style={labelStyle}>
            <span>{text.emailLabel}</span>
            <input
              type="email"
              value={details.email ?? ""}
              onChange={(event) => setDetails((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="billing@yourdomain.com"
              style={inputStyle}
            />
          </label>
        );
      case "stripe_connect":
        return (
          <label style={labelStyle}>
            <span>{text.accountLabel}</span>
            <input
              type="text"
              value={details.accountId ?? ""}
              onChange={(event) => setDetails((prev) => ({ ...prev, accountId: event.target.value }))}
              placeholder="acct_1234..."
              style={inputStyle}
            />
          </label>
        );
      case "bank":
        return (
          <label style={labelStyle}>
            <span>{text.bankLabel}</span>
            <textarea
              value={details.bankInfo ?? ""}
              onChange={(event) => setDetails((prev) => ({ ...prev, bankInfo: event.target.value }))}
              placeholder={
                locale === "zh"
                  ? "请提供银行名称、账号、SWIFT / IBAN 等信息"
                  : "Provide bank name, account number, SWIFT / IBAN, etc."
              }
              style={{ ...inputStyle, minHeight: "110px", resize: "vertical" }}
            />
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1F3329" }}>{text.title}</h3>
        <p style={{ margin: "0.4rem 0 0", color: "rgba(31,51,41,0.7)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {text.description}
        </p>
      </div>

      <label style={labelStyle}>
        <span>{text.amountLabel}</span>
        <input
          type="number"
          min={minAmount}
          max={availableBalance}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="50.00"
          style={inputStyle}
        />
        <span style={{ fontSize: "0.85rem", color: "rgba(31,51,41,0.55)", marginTop: "0.3rem" }}>
          {availableBalance < minAmount
            ? text.insufficient
            : text.minAmount(minAmount)}
        </span>
      </label>

      <label style={labelStyle}>
        <span>{text.methodLabel}</span>
        <select
          value={method}
          onChange={(event) => handleMethodChange(event.target.value as Method)}
          style={inputStyle}
        >
          {Object.entries(text.methodOptions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {(method === "stripe_connect" || method === "bank") && (
          <span style={{ fontSize: "0.82rem", color: "rgba(31,51,41,0.55)", marginTop: "0.25rem" }}>
            {text.comingSoon}
          </span>
        )}
      </label>

      {renderDetailsField()}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || state === "loading"}
        style={{
          borderRadius: "16px",
          border: "none",
          padding: "0.9rem 1.6rem",
          background: canSubmit && state !== "loading" ? "linear-gradient(135deg,#2C3E30,#4A7157)" : "rgba(141,174,146,0.4)",
          color: "#fff",
          fontWeight: 600,
          cursor: !canSubmit || state === "loading" ? "default" : "pointer",
          boxShadow: canSubmit ? "0 18px 32px rgba(44,62,48,0.22)" : "none",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
        }}
      >
        {state === "loading" ? `${text.submit}…` : text.submit}
      </button>

      {state === "success" && (
        <div
          style={{
            borderRadius: "14px",
            padding: "0.85rem 1rem",
            background: "rgba(236, 253, 245, 0.9)",
            color: "#065F46",
            fontWeight: 600,
          }}
        >
          {text.success}
        </div>
      )}

      {state === "error" && (
        <div
          style={{
            borderRadius: "14px",
            padding: "0.85rem 1rem",
            background: "rgba(254, 226, 226, 0.92)",
            color: "#7F1D1D",
            fontWeight: 600,
          }}
        >
          {error ?? text.error}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
  fontSize: "0.95rem",
  color: "#1F3329",
};

const inputStyle: React.CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(31,51,41,0.2)",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
  color: "#1F3329",
  background: "rgba(255,255,255,0.95)",
  boxShadow: "inset 0 1px 2px rgba(31,51,41,0.08)",
  outline: "none",
};






