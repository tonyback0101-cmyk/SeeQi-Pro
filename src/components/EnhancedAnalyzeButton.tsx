import Link from "next/link";
import { ArrowRight } from "lucide-react";

type EnhancedAnalyzeButtonProps = {
  href: string;
  label: string;
  note?: string;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
};

const DEFAULT_NOTE_ZH = "专业版解锁详细报告";
const DEFAULT_NOTE_EN = "Professional plan unlocks detailed insights";
const DEFAULT_LOADING_ZH = "分析中…";
const DEFAULT_LOADING_EN = "Analyzing…";

export default function EnhancedAnalyzeButton({
  href,
  label,
  note,
  loading = false,
  disabled = false,
  loadingLabel,
}: EnhancedAnalyzeButtonProps) {
  const tooltipNote = note ?? (label.includes("体验") ? DEFAULT_NOTE_ZH : DEFAULT_NOTE_EN);
  const derivedLoadingLabel = loadingLabel ?? (label.includes("体验") ? DEFAULT_LOADING_ZH : DEFAULT_LOADING_EN);
  const isInteractive = !loading && !disabled;
  const content = (
    <>
      <span>{loading ? derivedLoadingLabel : label}</span>
      {!loading && <ArrowRight size={22} className="seeqi-enhanced-button__icon" />}
      {loading && <span className="seeqi-enhanced-button__pulse" aria-hidden />}
    </>
  );

  return (
    <div className="seeqi-enhanced-button">
      {isInteractive ? (
        <Link href={href} className="seeqi-enhanced-button__main">
          {content}
        </Link>
      ) : (
        <span
          className={`seeqi-enhanced-button__main${disabled ? " seeqi-enhanced-button__main--disabled" : ""}${
            loading ? " seeqi-enhanced-button__main--loading" : ""
          }`}
          aria-disabled="true"
        >
          {content}
        </span>
      )}
      <span className="seeqi-enhanced-button__note">{tooltipNote}</span>

      <style jsx>{`
        .seeqi-enhanced-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
        }

        .seeqi-enhanced-button__main {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          min-width: 280px;
          height: 64px;
          padding: 0 1.9rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #8dae92, #7a9d7f);
          color: #fff;
          font-weight: 700;
          text-decoration: none;
          font-size: 1.2rem;
          box-shadow:
            0 26px 48px rgba(52, 74, 58, 0.22),
            0 12px 24px rgba(141, 174, 146, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          overflow: hidden;
        }

        .seeqi-enhanced-button__main:hover {
          box-shadow:
            0 32px 60px rgba(52, 74, 58, 0.24),
            0 18px 34px rgba(141, 174, 146, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transform: translateY(-3px);
        }

        .seeqi-enhanced-button__main:hover .seeqi-enhanced-button__icon {
          transform: translateX(4px);
        }

        .seeqi-enhanced-button__main:active {
          transform: translateY(1px) scale(0.985);
          box-shadow:
            0 18px 32px rgba(52, 74, 58, 0.22),
            0 10px 20px rgba(141, 174, 146, 0.28);
        }

        .seeqi-enhanced-button__icon {
          transition: transform 0.22s ease;
        }

        .seeqi-enhanced-button__main--loading,
        .seeqi-enhanced-button__main--disabled {
          cursor: default;
          pointer-events: none;
        }

        .seeqi-enhanced-button__main--disabled {
          background: linear-gradient(135deg, rgba(141, 174, 146, 0.45), rgba(122, 157, 127, 0.45));
          color: rgba(255, 255, 255, 0.85);
          box-shadow:
            0 18px 32px rgba(52, 74, 58, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        .seeqi-enhanced-button__main--loading {
          background: linear-gradient(135deg, #8dae92, #7a9d7f);
        }

        .seeqi-enhanced-button__pulse {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
          animation: seeqi-pulse 1.4s ease-in-out infinite;
        }

        .seeqi-enhanced-button__note {
          font-size: 0.95rem;
          color: rgba(44, 62, 48, 0.82);
          letter-spacing: 0.02em;
        }

        @media (max-width: 640px) {
          .seeqi-enhanced-button__main {
            width: 100%;
            min-width: 0;
            max-width: 320px;
          }
        }

        @keyframes seeqi-pulse {
          0% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.04);
          }
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

