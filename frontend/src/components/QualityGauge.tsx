import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityScoreResponse } from '../types';

interface QualityGaugeProps {
  scores?: QualityScoreResponse | null;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ scores }) => {
  const overall = scores?.overall_score ?? 0;
  const score = Math.min(100, Math.max(0, overall));

  // Status config
  const getStatus = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', track: '#d1fae5' };
    if (s >= 75) return { label: 'Good',      color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', track: '#dbeafe' };
    if (s >= 50) return { label: 'Fair',      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', track: '#fef3c7' };
    return             { label: 'Poor',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca', track: '#fee2e2' };
  };

  const status = getStatus(score);

  // ── SVG half-circle (180° arc) ──────────────────────────────────
  const W = 260;
  const H = 160;          // just the top half + breathing room
  const cx = W / 2;
  const cy = H - 20;      // pivot point near bottom center
  const R = 100;          // arc radius
  const SW = 20;          // stroke width

  // Full half-circle goes from 180° to 0° (left → right across top)
  // In SVG coords: start = left of center, end = right of center
  const startX = cx - R;
  const startY = cy;
  const endX   = cx + R;
  const endY   = cy;

  // Progress arc: fraction of 180°
  const angle = 180 - (score / 100) * 180;          // 180° (left) → 0° (right)
  const rad   = (angle * Math.PI) / 180;
  const dotX  = cx + R * Math.cos(rad);
  const dotY  = cy - R * Math.sin(rad);

  // Gradient stops based on score
  const gradId = 'scoreArcGrad';

  const dims = [
    { label: 'Completeness', value: scores?.dimension_scores?.completeness ?? 0, color: '#6366f1' },
    { label: 'Accuracy',     value: scores?.dimension_scores?.accuracy     ?? 0, color: '#10b981' },
    { label: 'Consistency',  value: scores?.dimension_scores?.consistency  ?? 0, color: '#0ea5e9' },
    { label: 'Timeliness',   value: scores?.dimension_scores?.timeliness   ?? 0, color: '#8b5cf6' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center p-6 h-full">

      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          Overall Health Score
        </h3>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{ color: status.color, background: status.bg, borderColor: status.border }}
        >
          {scores?.status || status.label}
        </span>
      </div>

      {/* ── Arc Gauge ── */}
      <div className="relative flex items-end justify-center" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ef4444" />
              <stop offset="35%"  stopColor="#f59e0b" />
              <stop offset="65%"  stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={`M ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={SW}
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          {score > 0 && (
            <path
              d={`M ${startX} ${startY} A ${R} ${R} 0 0 1 ${dotX} ${dotY}`}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={SW}
              strokeLinecap="round"
              style={{ transition: 'all 1s ease-out' }}
            />
          )}

          {/* Glowing dot indicator at arc tip */}
          {score > 0 && (
            <>
              <circle cx={dotX} cy={dotY} r={14} fill={status.color} opacity="0.15" filter="url(#dotGlow)" />
              <circle cx={dotX} cy={dotY} r={8}  fill="white" stroke={status.color} strokeWidth={3} />
              <circle cx={dotX} cy={dotY} r={3.5} fill={status.color} />
            </>
          )}

          {/* Score number */}
          <text
            x={cx} y={cy - 10}
            textAnchor="middle"
            fontSize="42"
            fontWeight="800"
            fill="#0f172a"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {score.toFixed(1)}
          </text>
          <text
            x={cx} y={cy + 14}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#94a3b8"
            fontFamily="Inter, system-ui, sans-serif"
          >
            OUT OF 100
          </text>

          {/* Min / Max labels */}
          <text x={startX - 4} y={cy + 18} textAnchor="end"   fontSize="10" fill="#cbd5e1" fontWeight="600">0</text>
          <text x={endX   + 4} y={cy + 18} textAnchor="start" fontSize="10" fill="#cbd5e1" fontWeight="600">100</text>
        </svg>
      </div>

      {/* ── 4D Dimension Bars ── */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
        {dims.map(({ label, value, color }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{label}</span>
              <span className="font-bold text-slate-800">{Number(value ?? 0).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, value ?? 0)}%`,
                  background: color,
                  transition: 'width 0.8s ease-out',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityGauge;
