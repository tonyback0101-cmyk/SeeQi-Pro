"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import zh from "@/locales/zh/loading.json";
import en from "@/locales/en/loading.json";

export type Locale = "zh" | "en";

const translations: Record<Locale, typeof zh> = {
  zh,
  en,
};

const ANIMATION_MIN_MS = 7000;

export default function LoadingScene({ locale }: { locale: Locale }) {
  const t = useMemo(() => translations[locale], [locale]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams?.get("report") ?? undefined;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - start);
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!reportId) return;
    const timeout = window.setTimeout(() => {
      router.replace(`/${locale}/analysis-result/${reportId}`);
    }, Math.max(ANIMATION_MIN_MS - elapsed, 0));
    return () => window.clearTimeout(timeout);
  }, [elapsed, reportId, router, locale]);

  return (
    <main className="page">
      <div className="glow" />
      <div className="orb orb--left" />
      <div className="orb orb--right" />
      <div className="card">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <ul>
          {t.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <button type="button" onClick={() => router.replace(`/${locale}`)}>
          {t.button}
        </button>
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 3rem 1.5rem;
          background: radial-gradient(circle at top, #f4ede2, #e8f0ec);
        }
        .glow {
          position: absolute;
          width: 60vw;
          height: 60vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(198, 169, 105, 0.25), transparent 70%);
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          -webkit-filter: blur(60px);
          filter: blur(60px);
        }
        .orb {
          position: absolute;
          width: 24vw;
          max-width: 320px;
          aspect-ratio: 1/1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(141, 174, 146, 0.35), rgba(141, 174, 146, 0));
          -webkit-filter: blur(40px);
          filter: blur(40px);
          animation: float 8s ease-in-out infinite alternate;
        }
        .orb--left {
          left: 8%;
          bottom: 12%;
        }
        .orb--right {
          right: 10%;
          top: 18%;
          animation-delay: 2s;
        }
        @keyframes float {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-30px);
          }
        }
        .card {
          position: relative;
          z-index: 1;
          width: min(520px, 100%);
          background: rgba(255, 255, 255, 0.86);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border-radius: 28px;
          padding: 2.4rem 2rem;
          box-shadow: 0 30px 60px rgba(44, 62, 48, 0.15);
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          text-align: center;
          color: #2c3e30;
        }
        h1 {
          margin: 0;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
        }
        p {
          margin: 0;
          color: rgba(72, 66, 53, 0.75);
          font-size: 1.05rem;
        }
        ul {
          margin: 0;
          padding-left: 1.1rem;
          text-align: left;
          color: rgba(72, 66, 53, 0.75);
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          font-size: 0.98rem;
        }
        button {
          align-self: center;
          border: none;
          border-radius: 999px;
          padding: 0.75rem 2.4rem;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #8dae92, #c6a969);
          color: white;
          box-shadow: 0 16px 32px rgba(141, 174, 146, 0.3);
        }
        button:hover {
          opacity: 0.92;
        }
        @media (max-width: 640px) {
          .card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}

