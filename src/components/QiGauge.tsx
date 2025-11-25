type QiGaugeProps = {
  score: number | null;
  level?: string | null;
  trend?: string | null;
  locked?: boolean;
};

const SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clampScore(value: number | null): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function QiGauge({ score, level, trend, locked = false }: QiGaugeProps) {
  const hasScore = typeof score === "number" && Number.isFinite(score);
  const normalizedScore = clampScore(hasScore ? score : null);
  const progressOffset = CIRCUMFERENCE * (1 - normalizedScore / 100);
  const displayScore = hasScore ? Math.round(normalizedScore) : "—";

  const gradientId = locked ? "qiGaugeGradientLocked" : "qiGaugeGradient";

  return (
    <div style={wrapperStyle}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Qi index gauge">
        <defs>
          <linearGradient id="qiGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8DAE92" />
            <stop offset="100%" stopColor="#C6A969" />
          </linearGradient>
          <linearGradient id="qiGaugeGradientLocked" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(141,174,146,0.45)" />
            <stop offset="100%" stopColor="rgba(198,169,105,0.45)" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(141, 174, 146, 0.18)"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
          fill="transparent"
          style={{
            transition: "stroke-dashoffset 0.8s ease",
            WebkitFilter: locked ? "none" : "drop-shadow(0 8px 18px rgba(76, 95, 215, 0.2))",
            filter: locked ? "none" : "drop-shadow(0 8px 18px rgba(76, 95, 215, 0.2))",
          }}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS - STROKE_WIDTH}
          fill="rgba(255,255,255,0.85)"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={scoreTextStyle}>
          {displayScore}
        </text>
        <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" style={labelTextStyle}>
          {locked ? "Lite" : "Full"}
        </text>
      </svg>
      <div style={infoStyle}>
        <span style={badgeStyle}>{level ?? (locked ? "Limited" : "—")}</span>
        {trend ? <span style={{ ...badgeStyle, background: "rgba(76,95,215,0.12)", color: "#36417C" }}>{trend}</span> : null}
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const infoStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const badgeStyle: React.CSSProperties = {
  padding: "0.3rem 0.9rem",
  borderRadius: "999px",
  background: "rgba(141, 174, 146, 0.16)",
  color: "#234035",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const scoreTextStyle: React.CSSProperties = {
  fontSize: "2.6rem",
  fontWeight: 700,
  fill: "#234035",
};

const labelTextStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  fill: "rgba(35,64,53,0.65)",
};

