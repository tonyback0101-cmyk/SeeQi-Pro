import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { fetchAffiliateDashboard } from "@/lib/server/affiliate";
import { COLORS } from "@/lib/colors";
import AffiliateShareTools from "@/components/affiliate/AffiliateShareTools";

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
    title: "推广中心",
    intro: "在这里创建和管理您的推广链接，实时查看下级贡献与返佣收益。",
    summaryCards: {
      balance: "账户余额",
      pending: "待入账",
      referrals: "直接邀请",
      team: "团队规模",
    },
    referral: {
      heading: "我的专属推广链接",
      description: "复制链接或下载二维码，分享到社交媒体、微信公众号或短信。",
      copyLink: "复制链接",
      downloadQR: "下载二维码",
      preview: "示例落地页预览",
    },
    performance: {
      heading: "推广效果总览",
      labels: ["今日新增", "本周新增", "本月新增"],
      orders: "付费订单",
      commissions: "返佣收入",
    },
    cta: {
      wallet: "前往钱包中心提现",
      resources: "查看推广素材",
    },
  },
  en: {
    title: "Affiliate Hub",
    intro:
      "Create and manage your referral links, monitor team performance, and track commission earnings in real time.",
    summaryCards: {
      balance: "Available Balance",
      pending: "Pending Earnings",
      referrals: "Direct Referrals",
      team: "Team Size",
    },
    referral: {
      heading: "Your Referral Toolkit",
      description:
        "Copy a shareable link or download a QR code for social media, newsletters, and community channels.",
      copyLink: "Copy Link",
      downloadQR: "Download QR",
      preview: "Landing Preview",
    },
    performance: {
      heading: "Performance Snapshot",
      labels: ["Today", "This Week", "This Month"],
      orders: "Paid Orders",
      commissions: "Commission Revenue",
    },
    cta: {
      wallet: "Open Wallet Center",
      resources: "Browse Promo Assets",
    },
  },
};

const summaryPlaceholder = [
  { key: "balance", value: "$0.00" },
  { key: "pending", value: "$0.00" },
  { key: "referrals", value: "0" },
  { key: "team", value: "0" },
] as const;

export default async function AffiliatePage({ params }: PageProps) {
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
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: TEXT_PRIMARY,
          }}
        >
          {t.title}
        </h1>
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
          {locale === "zh" ? "登录后查看推广数据" : "Sign in to view your affiliate data"}
        </Link>
      </div>
    );
  }

  const dashboard = await fetchAffiliateDashboard(session.user.id);
  const shareBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://seeqi.app";
  const shareLink = dashboard.refCode ? `${shareBase.replace(/\/$/, "")}/?ref=${dashboard.refCode}` : `${shareBase}`;

  const summaryCards = [
    { key: "balance" as const, value: formatCurrency(dashboard.balance, dashboard.currency, locale) },
    { key: "pending" as const, value: formatCurrency(dashboard.pending, dashboard.currency, locale) },
    { key: "referrals" as const, value: `${dashboard.referrals.direct}` },
    { key: "team" as const, value: `${dashboard.referrals.team}` },
  ];

  const performanceStats = [
    {
      label: t.performance.labels[0],
      orders: dashboard.performance.day.count,
      amount: formatCurrency(dashboard.performance.day.amount, dashboard.currency, locale),
    },
    {
      label: t.performance.labels[1],
      orders: dashboard.performance.week.count,
      amount: formatCurrency(dashboard.performance.week.amount, dashboard.currency, locale),
    },
    {
      label: t.performance.labels[2],
      orders: dashboard.performance.month.count,
      amount: formatCurrency(dashboard.performance.month.amount, dashboard.currency, locale),
    },
  ];

  const payoutMethodSummary = dashboard.payoutMethod && Object.keys(dashboard.payoutMethod).length
    ? Object.entries(dashboard.payoutMethod)
    : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "960px",
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
                ? "升级 SeeQi 专业版即可自动记录返佣数据并解锁推广素材。"
                : "Upgrade to SeeQi Pro to unlock tracked commissions and premium promo assets."}
            </span>
            <Link
              href={`/${locale}/pricing`}
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
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        {summaryCards.map((item) => (
          <div
            key={item.key}
            style={{
              background: "linear-gradient(135deg, rgba(141, 174, 146, 0.15), rgba(198, 169, 105, 0.12))",
              borderRadius: "20px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              border: "1px solid rgba(141, 174, 146, 0.25)",
              boxShadow: "0 18px 34px rgba(25, 34, 28, 0.08)",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "rgba(35, 54, 45, 0.7)",
              }}
            >
              {t.summaryCards[item.key]}
            </span>
            <strong
              style={{
                fontSize: "1.75rem",
                color: TEXT_PRIMARY,
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
        <AffiliateShareTools
          link={shareLink}
          locale={locale}
          refCode={dashboard.refCode}
          primaryColor={PRIMARY_COLOR}
          secondaryColor={SECONDARY_COLOR}
          title={t.referral.heading}
          description={t.referral.description}
        />

        <div
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(141, 174, 146, 0.18)",
            background: "linear-gradient(135deg, rgba(198, 169, 105, 0.18), rgba(141, 174, 146, 0.12))",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: TEXT_PRIMARY,
            }}
          >
            {t.performance.heading}
          </h2>
          <div
            style={{
              display: "grid",
              gap: "0.9rem",
            }}
          >
            {performanceStats.map((entry) => (
              <div
                key={entry.label}
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  borderRadius: "18px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(141, 174, 146, 0.2)",
                }}
              >
                <span
                  style={{
                    color: "rgba(34, 48, 44, 0.75)",
                    fontWeight: 600,
                  }}
                >
                  {entry.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    fontWeight: 700,
                    color: SECONDARY_COLOR,
                  }}
                >
                  <span>
                    {entry.orders} {t.performance.orders}
                  </span>
                  <span>
                    {entry.amount} {t.performance.commissions}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {payoutMethodSummary.length > 0 && (
            <div
              style={{
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(141, 174, 146, 0.2)",
                padding: "1rem",
                fontSize: "0.9rem",
                color: "rgba(34, 48, 44, 0.7)",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                {locale === "zh" ? "到账方式" : "Payout methods"}
              </strong>
              {payoutMethodSummary.map(([key, value]) => (
                <div key={key}>• {key}: {JSON.stringify(value)}</div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "flex-start",
        }}
      >
        <Link
          href={`/${locale}/wallet`}
          style={{
            borderRadius: "16px",
            background: PRIMARY_COLOR,
            color: "#fff",
            padding: "0.85rem 1.5rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 16px 28px rgba(141, 174, 146, 0.35)",
          }}
        >
          {t.cta.wallet}
        </Link>
        <Link
          href={`/${locale}/resources/affiliate`}
          style={{
            borderRadius: "16px",
            border: `1px solid ${SECONDARY_COLOR}`,
            color: SECONDARY_COLOR,
            padding: "0.85rem 1.5rem",
            fontWeight: 600,
            textDecoration: "none",
            background: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {t.cta.resources}
        </Link>
      </section>
    </div>
  );
}
