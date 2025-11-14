import Link from "next/link";
import { getSolarTermForDate } from "@/data/solarTerms";

type PageProps = {
  params: {
    locale: "zh" | "en";
  };
};

type InfoCardProps = {
  title: string;
  items: string[];
  accent: string;
};

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
};

export default function FortunePage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const insight = getSolarTermForDate(locale, new Date());

  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "6rem 1.5rem 3rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <section
        style={{
          borderRadius: "28px",
          padding: "2.4rem",
          background: "linear-gradient(135deg, rgba(245,230,200,0.42) 0%, rgba(226,238,232,0.88) 100%)",
          border: "1px solid rgba(198, 169, 105, 0.35)",
          boxShadow: "0 24px 44px rgba(122, 157, 127, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "1.8rem",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span
            style={{
              alignSelf: "flex-start",
              borderRadius: "999px",
              padding: "0.35rem 1rem",
              background: "rgba(198, 169, 105, 0.16)",
              color: "#C6A969",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: "0.88rem",
            }}
          >
            {locale === "zh" ? "今日气运指数" : "Fortune Insight"}
          </span>
          <h1 style={{ margin: 0, fontSize: "2.45rem", color: "#2C3E30" }}>
            {locale === "zh" ? `节气 · ${insight.name}` : `Solar Term · ${insight.name}`}
          </h1>
          <p style={{ margin: 0, color: "rgba(44, 62, 48, 0.78)", lineHeight: 1.7 }}>{insight.description}</p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <InfoCard
            title={locale === "zh" ? "宜" : "Favourable"}
            items={insight.favorable}
            accent="#7A9D7F"
          />
          <InfoCard
            title={locale === "zh" ? "忌" : "Avoid"}
            items={insight.avoid}
            accent="#C77B63"
          />
          <InfoCard
            title={locale === "zh" ? "饮食调理" : "Diet"}
            items={insight.diet}
            accent="#B28B67"
          />
          <InfoCard
            title={locale === "zh" ? "作息建议" : "Routine"}
            items={insight.routine}
            accent="#6E8D82"
          />
        </div>

        <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
          <LinkButton href={`/${locale}`} variant="ghost">
            ← {locale === "zh" ? "返回首页" : "Back to Home"}
          </LinkButton>
          <LinkButton href={`/${locale}/assessment`} variant="primary">
            {locale === "zh" ? "前往综合测评中心" : "Go to Assessment Hub"}
          </LinkButton>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, items, accent }: InfoCardProps) {
  return (
    <article
      style={{
        borderRadius: "18px",
        background: "rgba(255,255,255,0.92)",
        padding: "1.15rem 1.35rem",
        boxShadow: "0 16px 32px rgba(45, 64, 51, 0.14)",
        border: `1px solid ${accent}30`,
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "1.1rem",
          color: accent,
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: accent,
            display: "inline-block",
          }}
        />
        {title}
      </h2>
      <ul
        style={{
          margin: 0,
          paddingLeft: "1.15rem",
          color: "rgba(44, 62, 48, 0.78)",
          lineHeight: 1.6,
          fontSize: "0.98rem",
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ marginBottom: "0.25rem" }}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function LinkButton({ href, children, variant = "primary" }: LinkButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.75rem 1.6rem",
    borderRadius: "999px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  const variantStyle: Record<"primary" | "ghost", React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #8DAE92, #7A9D7F)",
      color: "#fff",
      boxShadow: "0 14px 26px rgba(122, 157, 127, 0.28)",
    },
    ghost: {
      background: "rgba(255,255,255,0.92)",
      color: "#4C5FD7",
      border: "1px solid rgba(76,95,215,0.35)",
    },
  };

  return (
    <Link href={href} style={{ ...baseStyle, ...variantStyle[variant] }}>
      {children}
    </Link>
  );
}

