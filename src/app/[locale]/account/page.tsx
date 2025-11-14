import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import SubscribeButton from "@/components/SubscribeButton";

export const metadata: Metadata = {
  title: "SeeQi 账户中心",
  description: "管理个人资料、支付记录与报告同步设置",
};

export default async function AccountPage({ params }: { params: { locale: "zh" | "en" } }) {
  const isZh = params.locale === "zh";
  const session = await getServerSession(authOptions);
  const subscription = session?.subscription;
  const isPro = Boolean(subscription?.active);

  return (
    <section
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        background: "rgba(255, 255, 255, 0.92)",
        borderRadius: "24px",
        padding: "2.5rem 2rem",
        boxShadow: "0 24px 48px rgba(20, 32, 24, 0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1.25rem", color: "#2C3E30" }}>
        {isZh ? "账户中心" : "Account Center"}
      </h1>
      <p style={{ color: "rgba(44,62,48,0.7)", lineHeight: 1.7, marginBottom: "2rem" }}>
        {isZh
          ? "在这里管理您的登录方式、收件邮箱和专业版订阅状态。我们会在下一步上线数据导出、跨设备同步控制以及 AI 分析历史记录回放。"
          : "Manage your login methods, contact email, and premium subscription status here. Upcoming updates will add data export, multi-device sync controls, and AI insight history."}
      </p>
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
        }}
      >
        <div style={cardStyle}>
          <h2>{isZh ? "登录方式" : "Sign-in methods"}</h2>
          <p>
            {isZh
              ? "您可以绑定 Google 账户或海外手机号。中国大陆手机号暂不支持。"
              : "Link your Google account or an international phone number. Mainland China numbers are not supported in this release."}
          </p>
        </div>
        <div style={cardStyle}>
          <h2>{isZh ? "支付与订阅" : "Billing & subscriptions"}</h2>
          {isPro ? (
            <p>
              {isZh
                ? `已激活 SeeQi 专业版（最近一次更新：${subscription?.updatedAt ?? "--"}）`
                : `SeeQi Pro is active (last update: ${subscription?.updatedAt ?? "--"}).`}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <p>
                {isZh
                  ? "升级专业版即可解锁深度分析报告与推广返佣功能。"
                  : "Upgrade to SeeQi Pro to unlock deep-dive reports and affiliate rewards."}
              </p>
              <SubscribeButton locale={params.locale} />
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <h2>{isZh ? "隐私与数据" : "Privacy & data"}</h2>
          <p>
            {isZh
              ? "我们会在未来提供数据导出与删除选项，确保您的跨设备体验安全可控。"
              : "Future updates will add export and deletion tools so you stay in control of your data across devices."}
          </p>
        </div>
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "1.5rem",
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(141, 174, 146, 0.25)",
  boxShadow: "0 18px 36px rgba(20, 32, 24, 0.06)",
  color: "#2C3E30",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};
