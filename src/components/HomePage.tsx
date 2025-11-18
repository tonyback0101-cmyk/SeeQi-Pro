"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import zhContent from "../locales/zh/home.json";
import enContent from "../locales/en/home.json";
import EnhancedAnalyzeButton from "./EnhancedAnalyzeButton";
import SubscribeButton from "./SubscribeButton";
import FEATURE_CONFIGS, { type FeatureConfig } from "../data/features";
import { COLORS } from "@/lib/colors";
import type { FeatureId } from "@/types/features";
import { getSolarTermForDate } from "@/data/solarTerms";
import ExpertsSection from "./home/ExpertsSection";
import SolarCard from "./SolarCard";

 type Locale = "zh" | "en";

 const contentMap: Record<Locale, typeof zhContent> = {
  zh: zhContent,
  en: enContent,
 };

 const localeKeyToFeatureId: Record<string, FeatureId> = {
  palm: "palm-analysis",
  tongue: "tongue-health",
  fiveElements: "fengshui-diagnosis",
  solarTerm: "solar-term",
  dream: "dream-analysis",
  iching: "iching-analysis",
 };

 function buildLocalePath(locale: Locale, path: string) {
  if (!path) return `/${locale}`;
  if (path.startsWith(`/${locale}`)) return path;
  if (path.startsWith("/")) return `/${locale}${path}`;
  return `/${locale}/${path}`;
 }

 type HomePageProps = {
  locale: Locale;
 };

 export default function HomePage({ locale }: HomePageProps) {
  const content = useMemo(() => contentMap[locale] ?? contentMap.zh, [locale]);
  const solarTermInsight = useMemo(() => getSolarTermForDate(locale, new Date()), [locale]);
  const featureConfigMap = useMemo(() => {
    return FEATURE_CONFIGS.reduce<Record<FeatureId, FeatureConfig>>((acc, feature) => {
      acc[feature.id] = feature;
      return acc;
    }, {} as Record<FeatureId, FeatureConfig>);
  }, []);
  const combinedFeatures = useMemo(() => {
    return content.features.map((feature) => {
      const id = localeKeyToFeatureId[feature.key];
      const config = id ? featureConfigMap[id] : undefined;
      return {
        ...feature,
        config,
      };
    });
  }, [content.features, featureConfigMap]);
  const pullStartY = useRef<number | null>(null);
  const pullTriggeredAt = useRef<number>(0);

  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;

    const handleTouchStart = (event: TouchEvent) => {
      if (!isMobile() || window.scrollY > 0) {
        pullStartY.current = null;
        return;
      }
      pullStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (pullStartY.current === null || !isMobile()) return;
      const delta = event.touches[0].clientY - pullStartY.current;
      const now = Date.now();
      if (delta > 120 && now - pullTriggeredAt.current > 4000) {
        pullTriggeredAt.current = now;
        window.location.reload();
      }
    };

    const handleTouchEnd = () => {
      pullStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const heroChips = locale === "zh"
    ? ["掌纹分析", "舌象洞察", "节气调理", "梦境解读"]
    : ["Palm Insight", "Tongue Wellness", "Seasonal Guidance", "Dream Analytics"];

  return (
    <div className="homepage">
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__pill">SeeQi</span>
          <h1 className="hero__title">{content.banner.title}</h1>
          <p className="hero__subtitle">{content.banner.subtitle}</p>
          <div className="hero__chips">
            {heroChips.map((chip) => (
              <span key={chip} className="hero__chip">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="hero__actions">
          <EnhancedAnalyzeButton href={`/${locale}/analyze`} label={content.banner.cta} />
          <SubscribeButton locale={locale} />
        </div>
      </section>

      <section className="section section--compact">
        <div className="section__header section__header--compact">
          <h2>{content.solarTerm.title}</h2>
          <p>{content.solarTerm.description}</p>
        </div>
        <div style={{ maxWidth: "100%" }}>
          <SolarCard
            locale={locale}
            name={solarTermInsight.name}
            doList={solarTermInsight.favorable}
            avoidList={solarTermInsight.avoid}
            healthTip={solarTermInsight.qiPhrase}
            element={null}
            isLite={false}
          />
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>{locale === "zh" ? "立即体验专业身心分析" : "Experience Holistic Insights"}</h2>
          <p>
            {locale === "zh"
              ? "SeeQi 专业版融合掌纹识别、舌象分析与五行体质洞察，为你打造全方位东方健康方案。"
              : "SeeQi Pro blends palmistry, tongue diagnostics and five-element profiling for holistic wellness."}
          </p>
        </div>
        <div className="promo">
          <div>
            <EnhancedAnalyzeButton href={`/${locale}/analyze`} label={content.banner.cta} />
            <SubscribeButton locale={locale} />
          </div>
          <ul>
            {(locale === "zh"
              ? [
                  "掌纹手相分析",
                  "舌苔健康解析",
                  "节气调理提醒",
                  "梦境象征解读",
                  "周易八卦推理",
                ]
              : [
                  "Palmistry Insight",
                  "Tongue Wellness Scan",
                  "Seasonal Wellness Reminders",
                  "Dream Symbolism Decoding",
                  "I Ching & Bagua Guidance",
                ]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>{content.featuresTitle}</h2>
          {locale === "zh" ? null : <p>Explore SeeQi’s signature modules</p>}
        </div>
        <div className="feature-grid">
          {combinedFeatures.map((feature) => {
            const config = feature.config;
            const Icon = config?.icon;
            const isPro = config?.proFeature;
            const card = (
              <article className={`feature-card${isPro ? " feature-card--pro" : ""}`}>
                <div className="feature-card__icon">
                  {Icon ? <Icon size={26} strokeWidth={1.75} /> : "✨"}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                {isPro ? <span className="feature-card__badge">PRO</span> : null}
              </article>
            );

            if (!config) {
              return card;
            }

            return (
              <Link
                key={feature.key}
                className="feature-link"
                href={buildLocalePath(locale, config.path)}
                prefetch={config.id === "dream-analysis" || config.id === "iching-analysis" ? false : undefined}
              >
                {card}
              </Link>
            );
          })}
        </div>
      </section>

      {content.experts.items?.length ? (
        <ExpertsSection experts={content.experts.items as any[]} />
      ) : null}

      <style jsx>{`
        .homepage {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
        }
        .hero {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 1.4rem 1.6rem;
          background: linear-gradient(135deg, rgba(214, 243, 235, 0.9), rgba(231, 242, 255, 0.9));
          border: 1px solid rgba(16, 185, 129, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          align-items: center;
        }
        .hero::after {
          content: "";
          position: absolute;
          right: -3rem;
          top: -3rem;
          width: 11rem;
          height: 11rem;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.16), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .hero__copy {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 620px;
          align-items: center;
          text-align: center;
        }
        .hero__pill {
          align-self: center;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #047857;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
        }
        .hero__title {
          margin: 0;
          font-size: clamp(1.75rem, 3.4vw, 2.6rem);
          color: #064e3b;
          letter-spacing: 0.02em;
        }
        .hero__subtitle {
          margin: 0;
          font-size: clamp(0.92rem, 2vw, 1.05rem);
          line-height: 1.6;
          color: rgba(4, 78, 59, 0.7);
        }
        .hero__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          justify-content: center;
        }
        .hero__chip {
          background: rgba(255, 255, 255, 0.82);
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.8rem;
          color: rgba(4, 78, 59, 0.75);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.12);
        }
        .hero__actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
        }
        .section {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .section--compact {
          gap: 0.8rem;
        }
        .section__header {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .section__header--compact {
          gap: 0.3rem;
        }
        .section__header h2 {
          margin: 0;
          font-size: 1.55rem;
          color: #1f2937;
        }
        .section__header--compact h2 {
          font-size: 1.3rem;
        }
        .section__header p {
          margin: 0;
          color: rgba(31, 41, 55, 0.65);
          font-size: 0.98rem;
        }
        .section__header--compact p {
          font-size: 0.85rem;
        }
        .promo {
          border-radius: 20px;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(224, 242, 241, 0.85), rgba(240, 249, 255, 0.85));
          border: 1px solid rgba(16, 185, 129, 0.18);
          display: grid;
          gap: 1rem;
          box-shadow: 0 18px 34px rgba(15, 118, 110, 0.12);
        }
        .promo > div {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .promo ul {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.6rem;
          padding: 0;
          margin: 0;
          list-style: none;
        }
        .promo li {
          border-radius: 14px;
          padding: 0.65rem 0.9rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(16, 185, 129, 0.15);
          color: #065f46;
          font-weight: 600;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .feature-link {
          text-decoration: none;
        }
        .feature-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          padding: 1.3rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(99, 102, 241, 0.18);
          box-shadow: 0 16px 30px rgba(79, 70, 229, 0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(79, 70, 229, 0.18);
        }
        .feature-card__icon {
          font-size: 2rem;
          color: ${COLORS.accent.indigo[600]};
        }
        .feature-card h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: ${COLORS.accent.indigo[700]};
        }
        .feature-card p {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(45, 55, 72, 0.75);
          line-height: 1.55;
        }
        .feature-card__badge {
          position: absolute;
          right: 1.1rem;
          top: 1.1rem;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(251, 191, 36, 0.9));
          color: #fff;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          box-shadow: 0 12px 22px rgba(245, 158, 11, 0.28);
        }
        .feature-card--pro {
          border-color: rgba(245, 158, 11, 0.35);
        }
        @media (max-width: 768px) {
          .hero {
            gap: 1rem;
            padding: 1.1rem 1.2rem;
          }
          .hero__actions {
            flex-direction: column;
          }
          .promo {
            padding: 1.25rem;
          }
          .promo ul {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
        }
        @media (max-width: 520px) {
          .hero__chips {
            gap: 0.35rem;
          }
          .promo ul {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
 }

