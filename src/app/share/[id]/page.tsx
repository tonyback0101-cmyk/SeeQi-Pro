import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type PageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

type ReportRow = {
  id: string;
  constitution: string | null;
  advice: Record<string, unknown> | null;
  solar_term: string | null;
  dream: Record<string, unknown> | null;
  created_at: string | null;
  locale: string | null;
  qi_index: {
    total?: number;
    level?: string;
    trend?: string;
    advice?: string[];
  } | null;
};

const STRINGS = {
  zh: {
    title: "来自 SeeQi 的体质洞察",
    subtitle: "好友分享了今日气运与调理建议，供你参考。",
    shareId: "分享编号",
    qiIndex: "今日气运指数",
    solarTerm: "当前节气",
    constitution: "体质倾向",
    diet: "饮食建议",
    lifestyle: "生活建议",
    dream: "梦境提示",
    callToAction: "我也要分析",
    empty: "该报告暂无可公开内容。",
    disclaimer: "注意：本信息仅供文化娱乐参考，不构成医疗建议。",
  },
  en: {
    title: "A Glimpse from SeeQi",
    subtitle: "Your friend shared today’s Qi insight for your inspiration.",
    shareId: "Share ID",
    qiIndex: "Qi Index Today",
    solarTerm: "Seasonal Term",
    constitution: "Constitution Trend",
    diet: "Diet Advice",
    lifestyle: "Lifestyle Advice",
    dream: "Dream Highlight",
    callToAction: "Start My Analysis",
    empty: "No shareable content yet.",
    disclaimer: "Note: SeeQi insights are for cultural & wellness reference only.",
  },
} as const;

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function extractAdvice(advice: Record<string, unknown> | null | undefined, locale: "zh" | "en") {
  if (!advice) {
    return {
      diet: [],
      lifestyle: [],
    };
  }
  if (locale === "zh") {
    return {
      diet: safeArray(advice.diet),
      lifestyle: safeArray(advice.lifestyle),
    };
  }
  return {
    diet: safeArray(advice.diet),
    lifestyle: safeArray(advice.lifestyle),
  };
}

export default async function ShareShortLinkPage({ params, searchParams }: PageProps) {
  const ref = typeof searchParams.ref === "string" ? searchParams.ref : undefined;
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("reports")
    .select("id,constitution,advice,solar_term,dream,created_at,locale,qi_index,unlocked")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("share-shortlink", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  const locale = data.locale === "en" ? "en" : "zh";
  const copy = STRINGS[locale];
  const qiIndex = data.qi_index;
  const advice = extractAdvice(data.advice as Record<string, unknown> | null, locale);
  const dream = (data.dream as Record<string, unknown> | null) ?? null;
  const dreamSummary = typeof dream?.summary === "string" ? dream.summary : null;

  const startHref = ref ? `/${locale}/analyze?ref=${encodeURIComponent(ref)}` : `/${locale}/analyze`;

  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "5rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.6rem",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "0.6rem", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "2.3rem", color: "#234035" }}>{copy.title}</h1>
        <p style={{ margin: 0, color: "rgba(35,64,53,0.7)" }}>{copy.subtitle}</p>
        <span
          style={{
            alignSelf: "center",
            padding: "0.35rem 0.9rem",
            borderRadius: 999,
            background: "rgba(198,169,105,0.18)",
            color: "#8C6B28",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {copy.shareId} · {data.id}
        </span>
      </header>

      <section
        style={{
          borderRadius: "24px",
          padding: "2rem",
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(141,174,146,0.25)",
          boxShadow: "0 24px 46px rgba(35,64,53,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
          <HighlightBlock title={copy.qiIndex} content={typeof qiIndex?.total === "number" ? `${Math.round(qiIndex.total)}` : "—"} />
          <HighlightBlock title={copy.solarTerm} content={data.solar_term ?? "—"} />
          <HighlightBlock title={copy.constitution} content={data.constitution ?? "—"} />
        </div>

        {advice.diet.length > 0 || advice.lifestyle.length > 0 || dreamSummary ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {advice.diet.length > 0 ? <ListBlock title={copy.diet} items={advice.diet} /> : null}
            {advice.lifestyle.length > 0 ? <ListBlock title={copy.lifestyle} items={advice.lifestyle} /> : null}
            {dreamSummary ? <TextBlock title={copy.dream} content={dreamSummary} /> : null}
          </div>
        ) : (
          <p style={{ color: "rgba(35,64,53,0.65)", textAlign: "center" }}>{copy.empty}</p>
        )}
      </section>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Link
          href={startHref}
          style={{
            borderRadius: 999,
            padding: "0.9rem 1.9rem",
            background: "linear-gradient(135deg,#2C3E30,#4A7157)",
            color: "#fff",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 18px 36px rgba(35,64,53,0.22)",
          }}
        >
          {copy.callToAction}
        </Link>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "rgba(35,64,53,0.55)" }}>{copy.disclaimer}</p>
    </main>
  );
}

function HighlightBlock({ title, content }: { title: string; content: string }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "1rem 1.2rem",
        background: "rgba(141,174,146,0.12)",
        color: "rgba(35,64,53,0.78)",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <span style={{ fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(35,64,53,0.62)" }}>
        {title}
      </span>
      <strong style={{ fontSize: "1.3rem", color: "#234035" }}>{content}</strong>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "1rem 1.2rem",
        border: "1px solid rgba(141,174,146,0.25)",
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <strong style={{ color: "#234035" }}>{title}</strong>
      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(35,64,53,0.78)", lineHeight: 1.6 }}>
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TextBlock({ title, content }: { title: string; content: string }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "1rem 1.2rem",
        border: "1px solid rgba(141,174,146,0.25)",
        background: "rgba(255,255,255,0.85)",
        color: "rgba(35,64,53,0.78)",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <strong style={{ color: "#234035" }}>{title}</strong>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{content}</p>
    </div>
  );
}

