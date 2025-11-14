'use client';

import { useState } from "react";

type Locale = "zh" | "en";

type Method = "paypal" | "stripe_connect" | "bank";

type PayoutMethod = Record<string, Record<string, unknown>>;

type Props = {
  locale: Locale;
  methods: PayoutMethod;
};

type Message = {
  heading: string;
  save: string;
  success: string;
  error: string;
  fields: Record<Method, { label: string; desc: string; placeholder: string }>;
};

const MESSAGES: Record<Locale, Message> = {
  zh: {
    heading: "到账方式",
    save: "保存",
    success: "保存成功",
    error: "保存失败，请稍后重试",
    fields: {
      paypal: {
        label: "PayPal 邮箱",
        desc: "请输入经过验证的 PayPal 邮箱，用于接收款项。",
        placeholder: "billing@yourdomain.com",
      },
      stripe_connect: {
        label: "Stripe Connect 账号",
        desc: "请输入连接的 Stripe Connect 账号 ID (以 acct_ 开头)。",
        placeholder: "acct_1234...",
      },
      bank: {
        label: "银行账户信息",
        desc: "填写收款银行名称、账号、SWIFT / IBAN 等信息。",
        placeholder: "Bank name, Account number, SWIFT...",
      },
    },
  },
  en: {
    heading: "Payout Methods",
    save: "Save",
    success: "Saved successfully",
    error: "Save failed. Please try again later.",
    fields: {
      paypal: {
        label: "PayPal Email",
        desc: "Enter your verified PayPal email to receive funds.",
        placeholder: "billing@yourdomain.com",
      },
      stripe_connect: {
        label: "Stripe Connect Account",
        desc: "Provide the Stripe Connect account ID (starts with acct_).",
        placeholder: "acct_1234...",
      },
      bank: {
        label: "Bank Account Details",
        desc: "Include bank name, account number, SWIFT / IBAN, etc.",
        placeholder: "Bank name, Account number, SWIFT...",
      },
    },
  },
};

const METHOD_ORDER: Method[] = ["paypal", "stripe_connect", "bank"];

export default function PayoutMethodManager({ locale, methods }: Props) {
  const messages = MESSAGES[locale];
  const [draft, setDraft] = useState<Record<Method, string>>(() => ({
    paypal: String((methods?.paypal as any)?.email ?? ""),
    stripe_connect: String((methods?.stripe_connect as any)?.accountId ?? ""),
    bank: String((methods?.bank as any)?.bankInfo ?? ""),
  }));
  const [status, setStatus] = useState<Record<Method, "idle" | "saving" | "success" | "error">>({
    paypal: "idle",
    stripe_connect: "idle",
    bank: "idle",
  });
  const [errors, setErrors] = useState<Record<Method, string | null>>({
    paypal: null,
    stripe_connect: null,
    bank: null,
  });

  const handleSave = async (method: Method) => {
    const value = draft[method]?.trim();
    setStatus((prev) => ({ ...prev, [method]: "saving" }));
    setErrors((prev) => ({ ...prev, [method]: null }));
    try {
      const body: Record<string, unknown> = { method };
      if (method === "paypal") {
        if (!value || !/.+@.+\..+/.test(value)) {
          throw new Error(locale === "zh" ? "请输入有效邮箱" : "Please enter a valid email");
        }
        body.details = { email: value };
      } else if (method === "stripe_connect") {
        if (!value || !value.startsWith("acct_")) {
          throw new Error(locale === "zh" ? "请输入正确的 Stripe 账号" : "Enter a valid Stripe account ID");
        }
        body.details = { accountId: value };
      } else {
        if (!value || value.length < 6) {
          throw new Error(locale === "zh" ? "请补充完整银行信息" : "Please provide bank details");
        }
        body.details = { bankInfo: value };
      }

      const response = await fetch("/api/wallet/payout-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? messages.error);
      }
      setStatus((prev) => ({ ...prev, [method]: "success" }));
    } catch (error) {
      console.error("PayoutMethodManager", error);
      setStatus((prev) => ({ ...prev, [method]: "error" }));
      setErrors((prev) => ({
        ...prev,
        [method]: error instanceof Error ? error.message : messages.error,
      }));
    }
  };

  const renderField = (method: Method) => {
    const field = messages.fields[method];
    const isTextArea = method === "bank";
    const value = draft[method] ?? "";

    return (
      <div
        key={method}
        style={{
          border: "1px solid rgba(141, 174, 146, 0.25)",
          borderRadius: "18px",
          padding: "1.2rem 1.4rem",
          background: "rgba(255,255,255,0.95)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <strong style={{ color: "#1F3329", fontSize: "1rem" }}>{field.label}</strong>
          <span style={{ color: "rgba(31,51,41,0.6)", fontSize: "0.9rem", lineHeight: 1.5 }}>{field.desc}</span>
        </div>
        {isTextArea ? (
          <textarea
            value={value}
            onChange={(event) => setDraft((prev) => ({ ...prev, [method]: event.target.value }))}
            placeholder={field.placeholder}
            style={textareaStyle}
          />
        ) : (
          <input
            type={method === "paypal" ? "email" : "text"}
            value={value}
            onChange={(event) => setDraft((prev) => ({ ...prev, [method]: event.target.value }))}
            placeholder={field.placeholder}
            style={inputStyle}
          />
        )}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleSave(method)}
            disabled={status[method] === "saving"}
            style={{
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg,#2C3E30,#4A7157)",
              color: "#fff",
              fontWeight: 600,
              padding: "0.7rem 1.4rem",
              cursor: status[method] === "saving" ? "default" : "pointer",
              boxShadow: "0 14px 24px rgba(44,62,48,0.18)",
            }}
          >
            {status[method] === "saving" ? `${messages.save}…` : messages.save}
          </button>
          {status[method] === "success" && (
            <span style={{ color: "#047857", fontSize: "0.9rem", fontWeight: 600 }}>{messages.success}</span>
          )}
          {status[method] === "error" && (
            <span style={{ color: "#B91C1C", fontSize: "0.9rem", fontWeight: 600 }}>
              {errors[method] ?? messages.error}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1F3329" }}>{messages.heading}</h3>
      <div
        style={{
          display: "grid",
          gap: "1rem",
        }}
      >
        {METHOD_ORDER.map((method) => renderField(method))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(31,51,41,0.2)",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  color: "#1F3329",
  background: "rgba(255,255,255,0.95)",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(31,51,41,0.08)",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
};
