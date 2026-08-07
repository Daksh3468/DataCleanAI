import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityScoreResponse } from '../types';

interface QualityGaugeProps {
  scores?: QualityScoreResponse | null;
  size?: number;
}

// Helper: polar → cartesian for SVG arc
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Describe an SVG arc path from startAngle to endAngle (degrees)
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ scores, size = 240 }) => {
  const overall = scores?.overall_score ?? 0;
  const clampedScore = Math.min(100, Math.max(0, overall));

  // Status badge
  let statusText = 'EXCELLENT';
  let statusColor = '#059669';
  let statusBg = '#d1fae5';
  let statusBorder = '#6ee7b7';

  if (clampedScore < 50) {
    statusText = 'POOR';
    statusColor = '#dc2626';
    statusBg = '#fee2e2';
    statusBorder = '#fca5a5';
  } else if (clampedScore < 70) {
    statusText = 'FAIR';
    statusColor = '#d97706';
    statusBg = '#fef3c7';
    statusBorder = '#fcd34d';
  } else if (clampedScore < 85) {
    statusText = 'GOOD';
    statusColor = '#2563eb';
    statusBg = '#dbeafe';
    statusBorder = '#93c5fd';
  }

  // Gauge arc params
  // The gauge sweeps from -210° to 30° (i.e. 240° sweep), centered at bottom
  const START_ANGLE = 135;  // degrees (7 o'clock)
  const END_ANGLE = 405;    // degrees = 45° (5 o'clock), 270° sweep
  const SWEEP = END_ANGLE - START_ANGLE; // 270°

  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 18;
  const r = (size - strokeWidth * 2 - 10) / 2;

  const scoreAngle = START_ANGLE + (clampedScore / 100) * SWEEP;

  // Score color transition: red → amber → green
  const getScoreColor = (s: number) => {
    if (s < 50) return '#ef4444';
    if (s < 70) return '#f59e0b';
    if (s < 85) return '#3b82f6';
    return '#10b981';
  };

  const arcColor = getScoreColor(clampedScore);

  // Needle tip position
  const needleTip = polarToCartesian(cx, cy, r - 4, scoreAngle);
  const needleBase1 = polarToCartesian(cx, cy, 8, scoreAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 8, scoreAngle - 90);

  const dimScores = scores?.dimension_scores || {
    completeness: 0,
    accuracy: 0,
    consistency: 0,
    timeliness: 0,
  };

  const dims = [
    { label: 'Completeness', value: dimScores.completeness, color: '#6366f1' },
    { label: 'Accuracy',     value: dimScores.accuracy,     color: '#10b981' },
    { label: 'Consistency',  value: dimScores.consistency,  color: '#0ea5e9' },
    { label: 'Timeliness',   value: dimScores.timeliness,   color: '#8b5cf6' },
  ];

  const svgH = size * 0.72; // only need ~72% of full circle height for 270° sweep

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center h-full relative overflow-hidden shadow-xs">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Overall Data Health Score</span>
        </h3>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full uppercase border"
          style={{ color: statusColor, background: statusBg, borderColor: statusBorder }}
        >
          {scores?.status || statusText}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="relative flex items-center justify-center w-full">
        <svg
          width={size}
          height={svgH}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Background track gradient */}
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            {/* Progress arc gradient */}
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Drop shadow for needle */}
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000030" />
            </filter>
          </defs>

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = START_ANGLE + (tick / 100) * SWEEP;
            const inner = polarToCartesian(cx, cy, r - strokeWidth / 2 - 4, tickAngle);
            const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 2, tickAngle);
            const label = polarToCartesian(cx, cy, r + strokeWidth / 2 + 14, tickAngle);
            return (
              <g key={tick}>
                <line
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"
                />
                <text
                  x={label.x} y={label.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fill="#94a3b8" fontWeight="600"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Background Track */}
          <path
            d={describeArc(cx, cy, r, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored Progress Arc */}
          {clampedScore > 0 && (
            <path
              d={describeArc(cx, cy, r, START_ANGLE, scoreAngle)}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={arcColor}
            filter="url(#needleShadow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Center hub */}
          <circle cx={cx} cy={cy} r={10} fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={5} fill={arcColor} />

          {/* Score text – centered inside gauge */}
          <text
            x={cx}
            y={cy + 38}
            textAnchor="middle"
            fontSize="36"
            fontWeight="800"
            fill="#0f172a"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {clampedScore.toFixed(1)}
          </text>
          <text
            x={cx}
            y={cy + 56}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontWeight="600"
            fontFamily="Inter, system-ui, sans-serif"
          >
            OUT OF 100
          </text>
        </svg>
      </div>

      {/* 4D Dimension Mini Bars */}
      <div className="w-full grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-slate-100">
        {dims.map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <span className="font-medium">{label}</span>
              <span className="font-bold text-slate-900">{Number(value ?? 0).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, value ?? 0)}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityGauge;
