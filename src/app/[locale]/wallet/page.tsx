import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { fetchAffiliateDashboard, fetchWalletTransactions, fetchPayoutRequests } from "@/lib/server/affiliate";
import { COLORS } from "@/lib/colors";
import WithdrawalForm from "@/components/wallet/WithdrawalForm";
import PayoutMethodManager from "@/components/wallet/PayoutMethodManager";

const PRIMARY_COLOR = COLORS.primary.qingzhu;
const SECONDARY_COLOR = COLORS.secondary.gold;
const TEXT_PRIMARY = COLORS.text.darkGreen;

function formatCurrency(value: number, currency: string, locale: "zh" | "en") {
  try {
    return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

const copy = {
  zh: {
    title: "钱包中心",
    intro: "查看返佣入账、提现记录及税务合规状态。支持绑定 PayPal / Stripe Connect / 本地银行到账。",
    balance: {
      available: "可提现余额",
      pending: "结算中",
      lifetime: "累计收益",
    },
    payout: {
      heading: "提现申请",
      description: "满足最低提现门槛 $20 后即可提交申请，系统将在 7 个自然日内处理。",
      cta: "发起提现",
      kyc: "完成身份认证后可提升单次提现额度",
      methods: "已绑定到账方式",
    },
    transactions: {
      heading: "流水明细",
      columns: ["日期", "类型", "金额", "状态", "备注"],
      empty: "暂无记录，完成首笔推广即可在此查看收益。",
    },
  },
  en: {
    title: "Wallet Center",
    intro:
      "Track commission earnings, withdrawal history, and compliance status. Link PayPal, Stripe Connect, or local bank payouts.",
    balance: {
      available: "Available Balance",
      pending: "Pending Settlement",
      lifetime: "Lifetime Earnings",
    },
    payout: {
      heading: "Withdrawal",
      description: "Once the available balance exceeds $20, submit a request and we will process it within 7 days.",
      cta: "Request Withdrawal",
      kyc: "Complete KYC to unlock higher payout limits",
      methods: "Connected payout methods",
    },
    transactions: {
      heading: "Transaction History",
      columns: ["Date", "Type", "Amount", "Status", "Note"],
      empty: "No records yet. Your earnings timeline will appear here after the first referral.",
    },
  },
};

export default async function WalletPage({ params }: PageProps) {
  const { locale } = params;
  const t = copy[locale];

  if (!t) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isPro = Boolean((session as any)?.subscription?.active);

  if (!session?.user?.id) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "2rem 1.5rem 3rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: TEXT_PRIMARY }}>{t.title}</h1>
        <p style={{ color: "rgba(34, 48, 44, 0.7)", lineHeight: 1.6 }}>{t.intro}</p>
        <Link
          href={`/${locale}/auth/sign-in`}
          style={{
            borderRadius: "16px",
            background: PRIMARY_COLOR,
            color: "#fff",
            padding: "0.95rem 1.5rem",
            textAlign: "center",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {locale === "zh" ? "登录后管理钱包" : "Sign in to manage wallet"}
        </Link>
      </div>
    );
  }

  const [dashboard, transactions, payoutRequests] = await Promise.all([
    fetchAffiliateDashboard(session.user.id),
    fetchWalletTransactions(session.user.id, 20),
    fetchPayoutRequests(session.user.id, 20),
  ]);

  const balanceCards = [
    { key: "available" as const, value: formatCurrency(dashboard.balance, dashboard.currency, locale) },
    { key: "pending" as const, value: formatCurrency(dashboard.pending, dashboard.currency, locale) },
    { key: "lifetime" as const, value: formatCurrency(dashboard.lifetime, dashboard.currency, locale) },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "920px",
        margin: "0 auto",
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: TEXT_PRIMARY,
          }}
        >
          {t.title}
        </h1>
        {!isPro && (
          <div
            style={{
              background: "rgba(255, 243, 205, 0.9)",
              borderRadius: "14px",
              padding: "0.75rem 1rem",
              color: "#8B5E00",
              fontSize: "0.95rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              alignItems: "center",
            }}
          >
            <span>
              {locale === "zh"
                ? "升级 SeeQi 专业版可以自动累计收益并开放提现申请。"
                : "Upgrade to SeeQi Pro to accumulate earnings and enable withdrawal requests."}
            </span>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(locale === "zh" ? "升级功能暂未开放" : "Upgrade feature coming soon");
              }}
              style={{
                borderRadius: "999px",
                padding: "0.45rem 1.1rem",
                background: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {locale === "zh" ? "立即升级" : "Upgrade now"}
            </Link>
          </div>
        )}
        <p
          style={{
            color: "rgba(34, 48, 44, 0.7)",
            lineHeight: 1.6,
          }}
        >
          {t.intro}
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {balanceCards.map((item, index) => (
          <div
            key={item.key}
            style={{
              borderRadius: "22px",
              padding: "1.75rem",
              background: index === 0 ? PRIMARY_COLOR : "rgba(255, 255, 255, 0.92)",
              color: index === 0 ? "#fff" : TEXT_PRIMARY,
              border: index === 0 ? "none" : "1px solid rgba(141, 174, 146, 0.25)",
              boxShadow: "0 18px 40px rgba(18, 48, 30, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                opacity: 0.85,
              }}
            >
              {t.balance[item.key]}
            </span>
            <strong
              style={{
                fontSize: "2rem",
                letterSpacing: "0.02em",
              }}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(141, 174, 146, 0.25)",
            background: "rgba(255, 255, 255, 0.94)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          <WithdrawalForm
            locale={locale}
            minAmount={20}
            availableBalance={Number(dashboard.balance ?? 0)}
          />
          <div
            style={{
              borderRadius: "16px",
              background: "rgba(198, 169, 105, 0.15)",
              border: `1px solid ${SECONDARY_COLOR}`,
              padding: "0.9rem 1rem",
              fontSize: "0.9rem",
              color: SECONDARY_COLOR,
              fontWeight: 600,
            }}
          >
            {t.payout.kyc}
          </div>
          <PayoutMethodManager locale={locale} methods={dashboard.payoutMethod ?? {}} />
        </div>

        <div
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(141, 174, 146, 0.18)",
            background: "linear-gradient(135deg, rgba(141, 174, 146, 0.12), rgba(198, 169, 105, 0.15))",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: TEXT_PRIMARY,
            }}
          >
            {t.transactions.heading}
          </h2>
          <div
            style={{
              borderRadius: "18px",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(141, 174, 146, 0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(80px, 1fr))",
                gap: "0",
                background: "rgba(141, 174, 146, 0.16)",
                fontWeight: 600,
                color: TEXT_PRIMARY,
              }}
            >
              {t.transactions.columns.map((column) => (
                <span key={column} style={{ padding: "0.75rem 1rem", fontSize: "0.9rem" }}>
                  {column}
                </span>
              ))}
            </div>
            <div
              style={{
                padding: "1.2rem",
                fontSize: "0.95rem",
                color: "rgba(34, 48, 44, 0.7)",
                textAlign: transactions.length ? "left" : "center",
              }}
            >
              {transactions.length === 0 ? (
                t.transactions.empty
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(80px, 1fr))",
                        gap: "0",
                        borderBottom: "1px solid rgba(141, 174, 146, 0.12)",
                        paddingBottom: "0.4rem",
                      }}
                    >
                      <span>{new Date(tx.created_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</span>
                      <span>{tx.type}</span>
                      <span>{formatCurrency(Number(tx.amount ?? 0), tx.currency ?? dashboard.currency, locale)}</span>
                      <span>{tx.reference_type ?? "-"}</span>
                      <span>{String((tx.metadata as Record<string, unknown> | null)?.reason ?? "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          borderRadius: "24px",
          border: "1px solid rgba(141, 174, 146, 0.25)",
          background: "rgba(255, 255, 255, 0.94)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: TEXT_PRIMARY,
          }}
        >
          {locale === "zh" ? "提现进度" : "Withdrawal History"}
        </h2>
        {payoutRequests.length === 0 ? (
          <p style={{ color: "rgba(34,48,44,0.7)", margin: 0 }}>
            {locale === "zh" ? "暂无提现申请" : "No withdrawal requests yet."}
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {payoutRequests.map((request) => {
              const formattedDate = new Date(request.submitted_at).toLocaleString(
                locale === "zh" ? "zh-CN" : "en-US",
                { hour12: false }
              );
              const amountLabel = formatCurrency(Number(request.amount ?? 0), request.currency ?? dashboard.currency, locale);
              const statusBadge = renderStatusBadge(request.status, locale);
              return (
                <div
                  key={request.id}
                  style={{
                    borderRadius: "18px",
                    border: "1px solid rgba(141, 174, 146, 0.2)",
                    background: "rgba(255,255,255,0.95)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "0.65rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <strong style={{ color: TEXT_PRIMARY, fontSize: "1rem" }}>{amountLabel}</strong>
                    <span style={{ color: "rgba(34,48,44,0.65)", fontSize: "0.9rem" }}>
                      {formattedDate} · {request.payout_method?.toUpperCase?.() ?? request.payout_method}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
                    <span>{statusBadge}</span>
                    {request.processed_at && (
                      <span style={{ color: "rgba(34,48,44,0.55)", fontSize: "0.85rem" }}>
                        {locale === "zh" ? "处理时间" : "Processed"}: {new Date(request.processed_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

type WalletStatus = "pending" | "approved" | "rejected" | "paid" | string;

function renderStatusBadge(status: WalletStatus, locale: "zh" | "en") {
  const normalized = (status || "pending").toLowerCase();
  const map: Record<string, { zh: string; en: string; color: string; background: string }> = {
    pending: {
      zh: "审核中",
      en: "Pending",
      color: "#92400E",
      background: "rgba(251, 191, 36, 0.2)",
    },
    approved: {
      zh: "已批准",
      en: "Approved",
      color: "#2563EB",
      background: "rgba(191, 219, 254, 0.35)",
    },
    paid: {
      zh: "已打款",
      en: "Paid",
      color: "#047857",
      background: "rgba(167, 243, 208, 0.3)",
    },
    rejected: {
      zh: "已驳回",
      en: "Rejected",
      color: "#B91C1C",
      background: "rgba(248, 113, 113, 0.25)",
    },
  };

  const entry = map[normalized] ?? map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: entry.color,
        background: entry.background,
        minWidth: "96px",
        textAlign: "center",
      }}
    >
      {locale === "zh" ? entry.zh : entry.en}
    </span>
  );
}
