import Link from "next/link";

const pageContent = {
  zh: {
    title: "周公梦境解析",
    subtitle: "解读梦境符号，洞察潜意识指引",
    description:
      "SeeQi 梦境解析结合古典《周公解梦》与现代心理语义，帮助你从梦境碎片中寻找健康与情绪线索。",
    cta: "开始记录梦境",
    tipsTitle: "使用提示",
    tips: [
      "睡前简单冥想，有助于回忆梦境细节",
      "醒来后在 5 分钟内记录关键词",
      "标注梦境中的颜色、人物与情绪",
      "结合体质报告，查看梦境与身心关系"
    ],
    proNote: "PRO 专享功能：深度梦境解析以及 AI 咨询",
    returnLabel: "返回首页",
  },
  en: {
    title: "Zhougong Dream Interpretation",
    subtitle: "Decode dream symbols to surface subconscious guidance",
    description:
      "SeeQi blends classical Zhougong lore with modern semantic analysis to uncover wellness signals hidden in your dreams.",
    cta: "Start Logging Dreams",
    tipsTitle: "Tips",
    tips: [
      "Practice light meditation before sleep to retain vivid details",
      "Capture keywords within five minutes of waking",
      "Note colors, people, and emotions present in the dream",
      "Cross-check insights with your constitution report"
    ],
    proNote: "PRO feature: in-depth dream decoding with AI consultation",
    returnLabel: "Back to Home",
  },
} as const;

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

export default function DreamAnalysisPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const content = pageContent[locale];

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <section
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "28px",
          padding: "2.4rem 2.1rem",
          boxShadow: "0 24px 48px rgba(45, 64, 51, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "#8DAE92",
            textTransform: "uppercase",
          }}
        >
          {content.subtitle}
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "2.6rem",
            lineHeight: 1.2,
            color: "#2C3E30",
          }}
        >
          {content.title}
        </h1>
        <p style={{ margin: 0, lineHeight: 1.8, color: "#484235" }}>{content.description}</p>
        <Link
          href={`/${locale}/dream-record`}
          style={{
            alignSelf: "flex-start",
            padding: "0.85rem 1.8rem",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 16px 28px rgba(122, 157, 127, 0.28)",
          }}
        >
          {content.cta}
        </Link>
      </section>

      <section
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "24px",
          padding: "2rem 1.8rem",
          boxShadow: "0 18px 32px rgba(76, 95, 215, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#4C5FD7" }}>{content.tipsTitle}</h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: "1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.7rem",
            color: "#2C3E30",
            lineHeight: 1.6,
          }}
        >
          {content.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p
          style={{
            margin: 0,
            padding: "1rem 1.2rem",
            borderRadius: "16px",
            background: "rgba(140, 122, 230, 0.12)",
            color: "#4C5FD7",
            fontWeight: 600,
          }}
        >
          {content.proNote}
        </p>
      </section>

      <Link
        href={`/${locale}`}
        style={{
          alignSelf: "center",
          color: "#8DAE92",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← {content.returnLabel}
      </Link>
    </div>
  );
}
